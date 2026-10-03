// src/hooks/use-timer.ts
// Hook for countdown timer with controls and expiry callback

'use client';

import { useState, useEffect, useRef, useCallback } from 'react';

interface UseTimerOptions {
  totalSeconds: number;
  autoStart?: boolean;
  onExpire?: () => void;
}

export function useTimer({
  totalSeconds,
  autoStart = true,
  onExpire,
}: UseTimerOptions) {
  const [timeLeft, setTimeLeft] = useState<number>(totalSeconds);
  const [isRunning, setIsRunning] = useState<boolean>(autoStart);
  const onExpireRef = useRef(onExpire);

  // Update ref inside effect to satisfy React 19 render purity rules
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Handle countdown interval
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setIsRunning(false);
          onExpireRef.current?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => setIsRunning(true), []);
  const pause = useCallback(() => setIsRunning(false), []);
  const finish = useCallback(() => {
    setTimeLeft(0);
    setIsRunning(false);
    onExpireRef.current?.();
  }, []);
  const reset = useCallback(
    (newTotal?: number) => {
      setTimeLeft(newTotal ?? totalSeconds);
      setIsRunning(autoStart);
    },
    [autoStart, totalSeconds]
  );

  return {
    timeLeft,
    isExpired: timeLeft <= 0,
    isRunning,
    start,
    pause,
    finish,
    reset,
  };
}
