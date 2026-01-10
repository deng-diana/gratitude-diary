/**
 * useVoiceRecording Hook
 *
 * Production-grade voice recording hook with robust error handling and resource management.
 * 
 * Key principles:
 * - Single source of truth for recording state
 * - Explicit resource lifecycle management
 * - Graceful degradation on errors
 * - No silent failures
 */

import { useState, useRef, useEffect, useCallback } from "react";
import { Audio } from "expo-av";
import { Alert, AppState } from "react-native";
import { activateKeepAwakeAsync, deactivateKeepAwake } from "expo-keep-awake";

// ============================================================================
// Global State Management
// ============================================================================
// We use a global singleton to prevent multiple recording instances
// This is critical because iOS/Android only allow ONE active recording at a time

let globalRecordingInstance: Audio.Recording | null = null;
let globalIsPreparingRecording = false;

/**
 * Safely cleanup a recording instance
 * This is the ONLY way to properly release native audio resources
 */
async function safeCleanupRecording(recording: Audio.Recording | null): Promise<void> {
  if (!recording) return;
  
  try {
    // stopAndUnloadAsync is the ONLY correct method for Recording objects
    // It stops recording (if active) AND releases native resources
    await recording.stopAndUnloadAsync();
    console.log("✅ Recording instance cleaned up successfully");
  } catch (error) {
    // This is expected if recording was never started or already cleaned up
    console.log("💡 Recording cleanup completed (was already stopped)");
  }
}

/**
 * Force reset global state
 * Use this as a last resort when things go wrong
 */
async function forceResetGlobalState(): Promise<void> {
  console.log("🔄 Force resetting global recording state...");
  
  if (globalRecordingInstance) {
    await safeCleanupRecording(globalRecordingInstance);
    globalRecordingInstance = null;
  }
  
  globalIsPreparingRecording = false;
  
  // Reset audio mode to default
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
    });
  } catch (error) {
    console.log("Could not reset audio mode:", error);
  }
  
  console.log("✅ Global state reset complete");
}

// ============================================================================
// Hook Interface
// ============================================================================

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

  // ============================================================================
  // State
  // ============================================================================
  
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [duration, setDuration] = useState(0);
  const [isStarting, setIsStarting] = useState(false);
  const [nearLimit, setNearLimit] = useState(false);

  // ============================================================================
  // Refs (for values that shouldn't trigger re-renders)
  // ============================================================================
  
  const recordingRef = useRef<Audio.Recording | null>(null);
  const durationIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const hasShownWarningRef = useRef(false);
  const isCleaningUpRef = useRef(false); // Prevent concurrent cleanup

  // ============================================================================
  // Duration Timer
  // ============================================================================

  const startDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
    }
    
    durationIntervalRef.current = setInterval(async () => {
      if (recordingRef.current) {
        try {
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
        } catch (error) {
          console.log("Error getting recording status:", error);
        }
      }
    }, 1000);
  }, [maxDurationSeconds]);

  const stopDurationTimer = useCallback(() => {
    if (durationIntervalRef.current) {
      clearInterval(durationIntervalRef.current);
      durationIntervalRef.current = null;
    }
  }, []);

  // ============================================================================
  // Cleanup on unmount
  // ============================================================================

  useEffect(() => {
    return () => {
      // Component unmounting - clean up everything
      (async () => {
        if (recordingRef.current) {
          await safeCleanupRecording(recordingRef.current);
          if (globalRecordingInstance === recordingRef.current) {
            globalRecordingInstance = null;
          }
        }
        stopDurationTimer();
        try {
          await deactivateKeepAwake(KEEP_AWAKE_TAG);
        } catch (e) {
          // Ignore
        }
      })();
    };
  }, []);

  // ============================================================================
  // App state handling (background/foreground)
  // ============================================================================

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
        console.log("Error restoring recording state:", error);
      }
    });

    return () => subscription.remove();
  }, [startDurationTimer]);

  // ============================================================================
  // Audio Mode Configuration
  // ============================================================================

  const configureAudioMode = async (): Promise<void> => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
        staysActiveInBackground: true,
        interruptionModeIOS: 1, // DoNotMix - stop other audio
        interruptionModeAndroid: 1,
        shouldDuckAndroid: true,
        playThroughEarpieceAndroid: false,
      });
      
      // Give the system time to apply the mode
      await new Promise(resolve => setTimeout(resolve, 100));
    } catch (error) {
      console.error("Failed to configure audio mode:", error);
      throw error;
    }
  };

  // ============================================================================
  // Permission Request
  // ============================================================================

  const requestPermission = async (): Promise<boolean> => {
    try {
      const { granted } = await Audio.requestPermissionsAsync();
      if (!granted) {
        Alert.alert("需要麦克风权限", "请在设置中允许访问麦克风");
        return false;
      }
      return true;
    } catch (error) {
      console.error("Permission request failed:", error);
      return false;
    }
  };

  // ============================================================================
  // START RECORDING
  // ============================================================================

  const startRecording = async (): Promise<void> => {
    // Guard: Prevent concurrent start attempts
    if (isStarting) {
      console.log("⚠️ Recording start already in progress, ignoring");
      return;
    }

    // Guard: Check if already recording
    if (isRecording) {
      console.log("⚠️ Already recording, ignoring start request");
      return;
    }

    setIsStarting(true);
    console.log("🎤 Starting recording flow...");

    try {
      // Step 1: Check permissions
      const hasPermission = await requestPermission();
      if (!hasPermission) {
        throw new Error("Microphone permission denied");
      }

      // Step 2: Clean up any existing recording
      console.log("🧹 Cleaning up previous recording instances...");
      
      // Clean local ref
      if (recordingRef.current) {
        await safeCleanupRecording(recordingRef.current);
        recordingRef.current = null;
      }

      // Clean global ref
      if (globalRecordingInstance) {
        await safeCleanupRecording(globalRecordingInstance);
        globalRecordingInstance = null;
      }

      // Wait for native cleanup
      await new Promise(resolve => setTimeout(resolve, 300));

      // Step 3: Wait for any concurrent preparation to finish
      let waitCount = 0;
      while (globalIsPreparingRecording && waitCount < 20) {
        console.log(`⏳ Waiting for concurrent preparation to finish... (${waitCount + 1}/20)`);
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }

      if (globalIsPreparingRecording) {
        console.warn("⚠️ Concurrent preparation timeout, forcing reset");
        await forceResetGlobalState();
      }

      // Step 4: Mark as preparing
      globalIsPreparingRecording = true;

      // Step 5: Stop duration timer
      stopDurationTimer();

      // Step 6: Configure audio mode
      console.log("🔧 Configuring audio mode...");
      await configureAudioMode();
      await new Promise(resolve => setTimeout(resolve, 200));

      // Step 7: Activate keep awake
      await activateKeepAwakeAsync(KEEP_AWAKE_TAG);

      // Step 8: Create recording instance
      console.log("📱 Creating recording instance...");
      
      const recordingOptions: Audio.RecordingOptions = {
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
      };

      // Try up to 2 times (not 3, to fail faster)
      let recording: Audio.Recording | null = null;
      let lastError: Error | null = null;

      for (let attempt = 1; attempt <= 2; attempt++) {
        console.log(`📡 Recording attempt ${attempt}/2...`);
        
        const tempRecording = new Audio.Recording();
        
        try {
          await tempRecording.prepareToRecordAsync(recordingOptions);
          await tempRecording.startAsync();
          
          // Verify it's actually recording
          const status = await tempRecording.getStatusAsync();
          if (!status.isRecording) {
            throw new Error("Recording created but not in recording state");
          }
          
          recording = tempRecording;
          console.log("✅ Recording started successfully");
          break;
        } catch (error: any) {
          lastError = error;
          console.warn(`⚠️ Attempt ${attempt} failed:`, error.message);
          
          // CRITICAL: Clean up the failed instance
          await safeCleanupRecording(tempRecording);
          
          // If this is the "Only one Recording" error and we have attempts left
          if (error.message?.includes("Only one Recording") && attempt < 2) {
            console.log("🔄 Attempting aggressive reset...");
            await forceResetGlobalState();
            await new Promise(resolve => setTimeout(resolve, 500));
            await configureAudioMode();
            await new Promise(resolve => setTimeout(resolve, 300));
          }
        }
      }

      // If all attempts failed, throw the last error
      if (!recording) {
        throw lastError || new Error("Failed to create recording");
      }

      // Step 9: Save references
      recordingRef.current = recording;
      globalRecordingInstance = recording;

      // Step 10: Update state
      setIsRecording(true);
      setIsPaused(false);
      setDuration(0);
      setNearLimit(false);
      hasShownWarningRef.current = false;

      // Step 11: Start duration timer
      startDurationTimer();

      console.log("✅ Recording flow completed successfully");
    } catch (error: any) {
      console.error("❌ Recording start failed:", error);

      // Clean up on error
      if (globalRecordingInstance) {
        await safeCleanupRecording(globalRecordingInstance);
        globalRecordingInstance = null;
      }

      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);

      try {
        await deactivateKeepAwake(KEEP_AWAKE_TAG);
      } catch (e) {
        // Ignore
      }

      // Show user-friendly error
      const errorMessage = error.message?.includes("Only one Recording")
        ? "麦克风正被其他应用占用。请关闭其他正在使用麦克风的应用（如微信、电话等），然后重试。"
        : "无法启动录音。请检查麦克风权限并重试。";

      Alert.alert("录音失败", errorMessage);
    } finally {
      globalIsPreparingRecording = false;
      setIsStarting(false);
    }
  };

  // ============================================================================
  // PAUSE RECORDING
  // ============================================================================

  const pauseRecording = async (): Promise<void> => {
    if (!recordingRef.current || !isRecording || isPaused) {
      console.log("⚠️ Cannot pause: invalid state");
      return;
    }

    try {
      await recordingRef.current.pauseAsync();
      setIsPaused(true);
      stopDurationTimer();
      console.log("⏸️ Recording paused");
    } catch (error) {
      console.error("Failed to pause recording:", error);
    }
  };

  // ============================================================================
  // RESUME RECORDING
  // ============================================================================

  const resumeRecording = async (): Promise<void> => {
    if (!recordingRef.current || !isRecording || !isPaused) {
      console.log("⚠️ Cannot resume: invalid state");
      return;
    }

    try {
      await configureAudioMode();
      await recordingRef.current.startAsync();
      setIsPaused(false);
      startDurationTimer();
      console.log("▶️ Recording resumed");
    } catch (error) {
      console.error("Failed to resume recording:", error);
    }
  };

  // ============================================================================
  // STOP RECORDING
  // ============================================================================

  const stopRecording = async (): Promise<string | null> => {
    if (!recordingRef.current) {
      console.log("⚠️ No recording to stop");
      return null;
    }

    try {
      console.log("⏹️ Stopping recording...");
      
      const uri = recordingRef.current.getURI();
      await recordingRef.current.stopAndUnloadAsync();
      
      // Clean up references
      if (globalRecordingInstance === recordingRef.current) {
        globalRecordingInstance = null;
      }
      recordingRef.current = null;

      // Stop timer
      stopDurationTimer();

      // Update state
      setIsRecording(false);
      setIsPaused(false);

      // Deactivate keep awake
      try {
        await deactivateKeepAwake(KEEP_AWAKE_TAG);
      } catch (e) {
        // Ignore
      }

      console.log("✅ Recording stopped successfully");
      return uri;
    } catch (error) {
      console.error("Failed to stop recording:", error);
      return null;
    }
  };

  // ============================================================================
  // CANCEL RECORDING
  // ============================================================================

  const cancelRecording = async (): Promise<void> => {
    // Prevent concurrent cleanup
    if (isCleaningUpRef.current) {
      console.log("⚠️ Cleanup already in progress");
      return;
    }

    isCleaningUpRef.current = true;
    console.log("🧹 Canceling recording...");

    try {
      // Clean up recording
      if (recordingRef.current) {
        await safeCleanupRecording(recordingRef.current);
        if (globalRecordingInstance === recordingRef.current) {
          globalRecordingInstance = null;
        }
        recordingRef.current = null;
      } else if (globalRecordingInstance) {
        await safeCleanupRecording(globalRecordingInstance);
        globalRecordingInstance = null;
      }

      // Reset global flag
      globalIsPreparingRecording = false;

      // Stop timer
      stopDurationTimer();

      // Reset state
      setIsRecording(false);
      setIsPaused(false);
      setDuration(0);
      setIsStarting(false);
      hasShownWarningRef.current = false;

      // Deactivate keep awake
      try {
        await deactivateKeepAwake(KEEP_AWAKE_TAG);
      } catch (e) {
        // Ignore
      }

      console.log("✅ Recording canceled successfully");
    } catch (error) {
      console.error("Error during cancel:", error);
    } finally {
      isCleaningUpRef.current = false;
    }
  };

  // ============================================================================
  // Return
  // ============================================================================

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
