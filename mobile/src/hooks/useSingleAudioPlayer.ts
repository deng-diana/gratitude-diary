import { useCallback, useEffect, useRef, useState } from "react";
import {
  createAudioPlayer,
  type AudioPlayer as ExpoAudioPlayer,
} from "expo-audio";

type UseSingleAudioPlayerParams = {
  audioUrl?: string;
  audioDuration?: number;
};

type UseSingleAudioPlayerResult = {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  hasPlayedOnce: boolean;
  playPause: () => Promise<void>;
  seekTo: (seconds: number) => Promise<void>;
  stop: () => void;
};

export function useSingleAudioPlayer({
  audioUrl,
  audioDuration,
}: UseSingleAudioPlayerParams): UseSingleAudioPlayerResult {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [hasPlayedOnce, setHasPlayedOnce] = useState(false);

  const playerRef = useRef<ExpoAudioPlayer | null>(null);
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null
  );
  const playbackSubscriptionRef = useRef<{ remove: () => void } | null>(null);
  const audioActionRef = useRef(false);
  const isSeekingRef = useRef(false);
  const audioUrlRef = useRef<string | undefined>(audioUrl);

  const resetPlaybackUi = useCallback(() => {
    setIsPlaying(false);
    setCurrentTime(0);
    setDuration(0);
    setHasPlayedOnce(false);
  }, []);

  const clearProgressTimer = useCallback(() => {
    if (progressIntervalRef.current) {
      clearInterval(progressIntervalRef.current);
      progressIntervalRef.current = null;
    }
  }, []);

  const cleanupSubscription = useCallback(() => {
    if (playbackSubscriptionRef.current) {
      playbackSubscriptionRef.current.remove();
      playbackSubscriptionRef.current = null;
    }
  }, []);

  const stop = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pause();
      playerRef.current.remove();
      playerRef.current = null;
    }
    cleanupSubscription();
    clearProgressTimer();
    resetPlaybackUi();
  }, [cleanupSubscription, clearProgressTimer, resetPlaybackUi]);

  useEffect(() => {
    if (audioUrlRef.current !== audioUrl) {
      stop();
      audioUrlRef.current = audioUrl;
    }
  }, [audioUrl, stop]);

  useEffect(() => {
    return () => stop();
  }, [stop]);

  const playPause = useCallback(async () => {
    if (!audioUrl) return;
    if (audioActionRef.current) return;
    audioActionRef.current = true;

    try {
      const existingPlayer = playerRef.current;

      if (isPlaying) {
        if (existingPlayer) {
          existingPlayer.pause();
          setIsPlaying(false);

          if (
            existingPlayer.isLoaded &&
            existingPlayer.duration > 0 &&
            existingPlayer.currentTime >= existingPlayer.duration - 0.5
          ) {
            cleanupSubscription();
            existingPlayer.remove();
            playerRef.current = null;
            resetPlaybackUi();
          }
        }

        clearProgressTimer();
        return;
      }

      let player = existingPlayer;
      let isResuming = false;

      if (player && player.isLoaded) {
        isResuming = true;
      } else {
        if (player) {
          player.pause();
          player.remove();
        }
        cleanupSubscription();
        player = createAudioPlayer(audioUrl, {
          updateInterval: 100,
        });
        playerRef.current = player;
        setHasPlayedOnce(true);
      }

      if (!playbackSubscriptionRef.current) {
        playbackSubscriptionRef.current = player.addListener(
          "playbackStatusUpdate",
          (status) => {
            if (!status?.didJustFinish) return;
            if (!playerRef.current || status.id !== playerRef.current.id) {
              return;
            }
            clearProgressTimer();
            cleanupSubscription();
            resetPlaybackUi();
            playerRef.current.remove();
            playerRef.current = null;
          }
        );
      }

      player.play();
      setIsPlaying(true);

      const initialDuration =
        player.isLoaded && player.duration > 0
          ? player.duration
          : audioDuration || 0;
      if (initialDuration > 0) {
        setDuration(initialDuration);
      }

      if (!isResuming && currentTime === 0) {
        setCurrentTime(0);
      }

      clearProgressTimer();
      progressIntervalRef.current = setInterval(() => {
        const currentPlayer = playerRef.current;
        if (!currentPlayer) {
          clearProgressTimer();
          return;
        }

        if (isSeekingRef.current) {
          return;
        }

        if (
          currentPlayer.isLoaded &&
          currentPlayer.playing &&
          !currentPlayer.paused
        ) {
          const currentSeconds = currentPlayer.currentTime;
          const durationSeconds = currentPlayer.duration;

          setCurrentTime((prev) =>
            Math.abs(prev - currentSeconds) > 0.001 ? currentSeconds : prev
          );
          if (durationSeconds > 0) {
            setDuration((prev) =>
              prev !== durationSeconds ? durationSeconds : prev
            );
          }
        }

        if (
          currentPlayer.isLoaded &&
          !currentPlayer.playing &&
          currentPlayer.currentTime > 0 &&
          currentPlayer.duration > 0 &&
          Math.abs(currentPlayer.currentTime - currentPlayer.duration) < 0.5
        ) {
          clearProgressTimer();
          cleanupSubscription();
          resetPlaybackUi();
          currentPlayer.remove();
          playerRef.current = null;
        }
      }, 50);
    } finally {
      audioActionRef.current = false;
    }
  }, [
    audioUrl,
    audioDuration,
    cleanupSubscription,
    clearProgressTimer,
    currentTime,
    isPlaying,
    resetPlaybackUi,
  ]);

  const seekTo = useCallback(
    async (seconds: number) => {
      if (!playerRef.current) return;
      isSeekingRef.current = true;
      // 先乐观更新 UI，避免进度条回弹
      setCurrentTime(seconds);
      setHasPlayedOnce(true);
      try {
        const wasPlaying =
          playerRef.current.playing && !playerRef.current.paused;
        if (wasPlaying) {
          playerRef.current.pause();
        }

        // seekTo 是异步的，但实际位置更新可能有延迟
        await playerRef.current.seekTo(seconds);

        if (wasPlaying) {
          playerRef.current.play();
        }
      } finally {
        setTimeout(() => {
          isSeekingRef.current = false;
        }, 200);
      }
    },
    [setCurrentTime]
  );

  return {
    isPlaying,
    currentTime,
    duration,
    hasPlayedOnce,
    playPause,
    seekTo,
    stop,
  };
}
