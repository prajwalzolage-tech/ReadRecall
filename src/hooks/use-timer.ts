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
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const onExpireRef = useRef(onExpire);
  const endTimeRef = useRef<number | null>(null);
  const expiredFiredRef = useRef(false);
  const initializedRef = useRef(false);
  const totalSecondsRef = useRef(totalSeconds);

  // Keep callback ref updated
  useEffect(() => {
    onExpireRef.current = onExpire;
  }, [onExpire]);

  // Track latest totalSeconds for reset
  totalSecondsRef.current = totalSeconds;

  // Initialize/start the timer when autoStart transitions to true
  // This only fires ONCE per mount (or when autoStart first becomes true)
  useEffect(() => {
    if (!autoStart || initializedRef.current) return;

    initializedRef.current = true;
    expiredFiredRef.current = false;
    const duration = totalSecondsRef.current;
    endTimeRef.current = Date.now() + duration * 1000;
    setTimeLeft(duration);
    setIsRunning(true);
  }, [autoStart]);

  // Handle countdown with drift-free Date.now()
  useEffect(() => {
    if (!isRunning) return;

    if (!endTimeRef.current) {
      endTimeRef.current = Date.now() + timeLeft * 1000;
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isRunning]);

  const start = useCallback(() => {
    expiredFiredRef.current = false;
    endTimeRef.current = Date.now() + totalSecondsRef.current * 1000;
    setTimeLeft(totalSecondsRef.current);
    setIsRunning(true);
  }, []);

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
      const duration = newTotal ?? totalSecondsRef.current;
      initializedRef.current = autoStart;
      expiredFiredRef.current = false;
      endTimeRef.current = autoStart ? Date.now() + duration * 1000 : null;
      setTimeLeft(duration);
      setIsRunning(autoStart);
    },
    [autoStart]
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
