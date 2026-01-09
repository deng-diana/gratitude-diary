/**
 * useVoiceRecording Hook
 *
 * 📚 学习点：自定义 Hook (Custom Hook)
 * 1. **逻辑复用**：将复杂的录音逻辑（权限、状态、定时器、音频模式）封装在一起，
 *    让不同的组件（如 RecordingModal 和 ImageDiaryModal）可以共享同一套逻辑。
 * 2. **关注点分离**：UI 组件只负责展示，Hook 负责业务逻辑。
 * 3. **易于测试**：逻辑独立后，可以更方便地进行单元测试。
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Audio } from "expo-av";
import { Alert, AppState } from "react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

let globalRecordingRef: Audio.Recording | null = null;
let globalPreparing = false;

export interface UseVoiceRecordingReturn {
  isRecording: boolean;
  isPaused: boolean;
  duration: number;
  isStarting: boolean;
  nearLimit: boolean;
  startRecording: () => Promise<void>;
  pauseRecording: () => Promise<void>;
  resumeRecording: () => Promise<void>;
  stopRecording: () => Promise<string | null>;
  cancelRecording: () => Promise<void>;
}

export function useVoiceRecording(
  maxDurationSeconds: number = 600
): UseVoiceRecordingReturn {
  const KEEP_AWAKE_TAG = "voice-recording-session";

  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [nearLimit, setNearLimit] = useState(false);

  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownWarningRef = useRef(false);

  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    durationIntervalRef.current = setInterval(async () => {
      if (recordingRef.current) {
        const status = await recordingRef.current.getStatusAsync();
        if (status.isRecording) {
          const seconds = Math.floor(status.durationMillis / 1000);
          setDuration(seconds);

          if (seconds >= maxDurationSeconds - 60 && !hasShownWarningRef.current) {
            hasShownWarningRef.current = true;
            setNearLimit(true);
          }

          if (seconds >= maxDurationSeconds) {
            stopRecording();
          }
        }
      }
    }, 1000);
  }, [maxDurationSeconds]);

  // 清理资源
  useEffect(() => {
    return () => {
      if (recordingRef.current) {
        recordingRef.current.stopAndUnloadAsync().catch(console.error);
        if (globalRecordingRef === recordingRef.current) {
          globalRecordingRef = null;
        }
      }
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
      deactivateKeepAwake(KEEP_AWAKE_TAG);
    };
  }, []);

  useEffect(() => {
    const subscription = AppState.addEventListener("change", async (state) => {
      if (state !== "active" || !recordingRef.current) {
        return;
      }

      try {
        const status = await recordingRef.current.getStatusAsync();
        const seconds = Math.floor(status.durationMillis / 1000);
        setDuration(seconds);

        if (status.isRecording) {
          setIsRecording(true);
          setIsPaused(false);
          startDurationTimer();
          await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
        } else if (status.canRecord) {
          setIsRecording(true);
          setIsPaused(true);
          await activateKeepAwakeAsync(KEEP_AWAKE_TAG);
        }
      } catch (error) {
        console.log("恢复录音状态失败:", error);
      }
    });

    return () => subscription.remove();
  }, [startDurationTimer]);

  /**
   * 安全清理录音对象的辅助函数
   * 统一处理录音对象的清理逻辑，避免代码重复
   */
  const cleanupRecordingObject = async (recording: Audio.Recording | null): Promise<void> => {
    if (!recording) return;
    
    try {
      const status = await recording.getStatusAsync();
      if (status.isLoaded) {
        if (status.isRecording) {
          await recording.stopAndUnloadAsync();
        } else {
          await recording.unloadAsync();
        }
      }
    } catch (error) {
      // 清理失败时忽略错误，确保继续执行
      console.log("清理录音对象时出错（可忽略）:", error);
    }
  };

  const configureAudioMode = async () => {
    try {
      // ✅ 关键修复：先设置音频模式为录音模式
      // 使用数字值：1 = DoNotMix (停止其他音频), 2 = DuckOthers (降低其他音频)
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1, // ✅ DoNotMix - 停止其他音频，避免冲突
        interruptionModeAndroid: 1, // ✅ DoNotMix - 停止其他音频，避免冲突
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // ✅ 额外等待一小段时间，确保音频模式切换完成
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Failed to configure audio mode:", error);
      throw error; // ✅ 抛出错误，让调用者知道配置失败
    }
  };

  const requestPermission = async () => {
    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      Alert.alert("需要麦克风权限", "请在设置中允许访问麦克风");
      return false;
    }
    return true;
  };

  const startRecording = async () => {
    if (isStarting) return;
    setIsStarting(true);

    try {
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        setIsStarting(false);
        return;
      }

      // ✅ 关键修复：在创建新录音之前，先清理之前的录音对象
      // 这可以防止 "Only one Recording object can be prepared at a given time" 错误
      if (recordingRef.current) {
        await cleanupRecordingObject(recordingRef.current);
        recordingRef.current = null;
        // ✅ 额外等待，确保录音对象完全释放
        await new Promise(resolve => setTimeout(resolve, 100));
      }

      // ✅ 全局互斥：防止多个录音实例同时准备
      // 如果另一个录音正在准备，稍等一会儿再尝试
      if (globalPreparing) {
        await new Promise((resolve) => setTimeout(resolve, 120));
      }
      globalPreparing = true;

      // ✅ 如果全局已有录音对象（来自其他组件），先清理
      if (globalRecordingRef && globalRecordingRef !== recordingRef.current) {
        await cleanupRecordingObject(globalRecordingRef);
        globalRecordingRef = null;
      }

      // ✅ 清理之前的定时器
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }

      // ✅ 关键修复：先配置音频模式（这会停止所有播放），再创建录音对象
      try {
        await configureAudioMode();
      } catch (error) {
        console.error("配置音频模式失败:", error);
        // ✅ 即使配置失败，也尝试继续（某些情况下可能仍然可以录音）
        // 但记录错误以便调试
      }
      
      // ✅ 额外等待，确保所有音频播放器已完全停止
      await new Promise(resolve => setTimeout(resolve, 150));
      
      await activateKeepAwakeAsync(KEEP_AWAKE_TAG);

      const { recording } = await Audio.Recording.createAsync({
        android: {
          extension: ".m4a",
          outputFormat: Audio.AndroidOutputFormat.MPEG_4,
          audioEncoder: Audio.AndroidAudioEncoder.AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: ".m4a",
          outputFormat: Audio.IOSOutputFormat.MPEG4AAC,
          audioQuality: Audio.IOSAudioQuality.HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
        web: {
          mimeType: "audio/webm",
          bitsPerSecond: 128000,
        },
      });

      // ✅ 关键修复：验证录音对象是否成功创建且正在录音
      // 根据 expo-av 文档，createAsync 创建的录音对象应该立即开始录音
      try {
        const status = await recording.getStatusAsync();
        if (!status.isLoaded || !status.isRecording) {
          console.error("❌ 录音对象创建但未开始录音，状态:", status);
          await cleanupRecordingObject(recording);
          throw new Error("录音对象创建失败：状态异常");
        }
        console.log("✅ 录音成功启动，状态正常");
      } catch (verifyError) {
        // 如果验证失败，清理录音对象并重新抛出错误
        console.error("❌ 验证录音状态失败:", verifyError);
        await cleanupRecordingObject(recording);
        throw verifyError;
      }

      recordingRef.current = recording;
      globalRecordingRef = recording;
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setNearLimit(false);
      hasShownWarningRef.current = false;

      startDurationTimer();
    } catch (error) {
      console.error("❌ Failed to start recording:", error);
      
      // ✅ 关键修复：错误发生时，彻底清理所有状态
      // 这可以防止后续录音尝试时状态不一致导致卡住
      
      // 1. 清理录音对象引用（如果存在）
      // 注意：如果 createAsync 失败，recordingRef.current 应该是 null
      // 但如果验证失败，recordingRef.current 可能还未设置，所以这里只清理已存在的引用
      if (recordingRef.current) {
        await cleanupRecordingObject(recordingRef.current);
        recordingRef.current = null;
      }
      
      // 2. 清理全局录音对象引用（如果存在且与当前引用不同）
      if (globalRecordingRef && globalRecordingRef !== recordingRef.current) {
        await cleanupRecordingObject(globalRecordingRef);
        globalRecordingRef = null;
      }
      
      // 3. 清理定时器
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
        durationIntervalRef.current = null;
      }
      
      // 4. 重置所有状态
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setNearLimit(false);
      hasShownWarningRef.current = false;
      
      // 5. 清理 KeepAwake
      try {
        deactivateKeepAwake(KEEP_AWAKE_TAG);
      } catch (e) {
        // 忽略错误
      }
      
      // 6. 显示错误提示
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error("❌ 录音启动失败详情:", errorMessage);
      Alert.alert("错误", "启动录音失败，请重试");
    } finally {
      globalPreparing = false;
      setIsStarting(false);
    }
  };

  const pauseRecording = async () => {
    if (!recordingRef.current || !isRecording || isPaused) return;
    try {
      await recordingRef.current.pauseAsync();
      setIsPaused(true);
      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }
    } catch (error) {
      console.error("Failed to pause recording:", error);
    }
  };

  const resumeRecording = async () => {
    if (!recordingRef.current || !isRecording || !isPaused) return;
    try {
      await configureAudioMode();
      await recordingRef.current.startAsync();
      setIsPaused(false);

      startDurationTimer();
    } catch (error) {
      console.error("Failed to resume recording:", error);
    }
  };

  const stopRecording = async (): Promise<string | null> => {
    if (!recordingRef.current) return null;

    try {
      const uri = recordingRef.current.getURI();
      await recordingRef.current.stopAndUnloadAsync();
      if (globalRecordingRef === recordingRef.current) {
        globalRecordingRef = null;
      }
      recordingRef.current = null;

      if (durationIntervalRef.current) {
        clearInterval(durationIntervalRef.current);
      }

      setIsRecording(false);
      setIsPaused(false);
      deactivateKeepAwake(KEEP_AWAKE_TAG);

      return uri;
    } catch (error) {
      console.error("Failed to stop recording:", error);
      return null;
    }
  };

  const cancelRecording = async () => {
    if (recordingRef.current) {
      try {
        await recordingRef.current.stopAndUnloadAsync();
      } catch (e) {}
      if (globalRecordingRef === recordingRef.current) {
        globalRecordingRef = null;
      }
      recordingRef.current = null;
    }
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    setIsRecording(false);
    setIsPaused(false);
    setDuration(0);
    deactivateKeepAwake(KEEP_AWAKE_TAG);
  };

  return {
    isRecording,
    isPaused,
    duration,
    isStarting,
    nearLimit,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    cancelRecording,
  };
}
