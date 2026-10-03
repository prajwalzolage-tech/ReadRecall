// src/hooks/use-timer.ts
// Hook for countdown timer with timestamp-based accuracy, dynamic autoStart support, and expiry callback

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
  const endTimeRef = useRef<number | null>(null);
  const hasStartedRef = useRef(false);
  const expiredFiredRef = useRef(false);

  // Keep callback ref updated
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // When autoStart becomes true (or on initial mount if already true) and hasn't started yet
  useEffect(() => {
    if (autoStart && !hasStartedRef.current) {
      hasStartedRef.current = true;
      expiredFiredRef.current = false;
      endTimeRef.current = Date.now() + totalSeconds * 1000;
      setTimeLeft(totalSeconds);
      setIsRunning(true);
    }
  }, [autoStart, totalSeconds]);

  const timeLeftRef = useRef(timeLeft);
  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Handle countdown with drift-free Date.now()
  useEffect(() => {
    if (!isRunning) return;

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + timeLeftRef.current * 1000;
    }

    const tick = () => {
      if (!endTimeRef.current) return;
      const remainingMs = endTimeRef.current - Date.now();
      const remainingSec = Math.max(0, Math.ceil(remainingMs / 1000));

      setTimeLeft(remainingSec);

      if (remainingSec <= 0) {
        setIsRunning(false);
        endTimeRef.current = null;
        if (!expiredFiredRef.current) {
          expiredFiredRef.current = true;
          onExpireRef.current?.();
        }
      }
    };

    tick();
    const interval = setInterval(tick, 500);

    return () => clearInterval(interval);
  }, [isRunning]);

  const start = useCallback(() => {
    expiredFiredRef.current = false;
    endTimeRef.current = Date.now() + timeLeft * 1000;
    setIsRunning(true);
  }, [timeLeft]);

  const pause = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
  }, []);

  const finish = useCallback(() => {
    setIsRunning(false);
    endTimeRef.current = null;
    setTimeLeft(0);
    if (!expiredFiredRef.current) {
      expiredFiredRef.current = true;
      onExpireRef.current?.();
    }
  }, []);

  const reset = useCallback(
    (newTotal?: number) => {
      const duration = newTotal ?? totalSeconds;
      hasStartedRef.current = autoStart;
      expiredFiredRef.current = false;
      endTimeRef.current = autoStart ? Date.now() + duration * 1000 : null;
      setTimeLeft(duration);
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
