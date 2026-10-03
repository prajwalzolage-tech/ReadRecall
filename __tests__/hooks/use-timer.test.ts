// __tests__/hooks/use-timer.test.ts

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTimer } from '@/hooks/use-timer';

describe('useTimer hook', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('initializes with totalSeconds when autoStart is false and does not decrement', () => {
    const { result } = renderHook(() =>
      useTimer({ totalSeconds: 105, autoStart: false })
    );

    expect(result.current.timeLeft).toBe(105);
    expect(result.current.isRunning).toBe(false);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(result.current.timeLeft).toBe(105);
  });

  it('starts countdown dynamically when autoStart transitions from false to true with updated totalSeconds', () => {
    let autoStart = false;
    let totalSeconds = 105;

    const { result, rerender } = renderHook(
      ({ auto, sec }) => useTimer({ totalSeconds: sec, autoStart: auto }),
      { initialProps: { auto: autoStart, sec: totalSeconds } }
    );

    expect(result.current.isRunning).toBe(false);
    expect(result.current.timeLeft).toBe(105);

    // Article loads: auto becomes true, sec becomes 82
    rerender({ auto: true, sec: 82 });

    expect(result.current.isRunning).toBe(true);
    expect(result.current.timeLeft).toBe(82);

    // Advance 5 seconds
    act(() => {
      vi.advanceTimersByTime(5000);
    });

    expect(result.current.timeLeft).toBe(77);
    expect(result.current.isRunning).toBe(true);
  });

  it('triggers onExpire automatically when time reaches 0', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() =>
      useTimer({ totalSeconds: 3, autoStart: true, onExpire })
    );

    expect(result.current.isRunning).toBe(true);

    act(() => {
      vi.advanceTimersByTime(3500);
    });

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isExpired).toBe(true);
    expect(result.current.isRunning).toBe(false);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });

  it('triggers onExpire and sets timeLeft to 0 when finish() is called', () => {
    const onExpire = vi.fn();
    const { result } = renderHook(() =>
      useTimer({ totalSeconds: 60, autoStart: true, onExpire })
    );

    act(() => {
      result.current.finish();
    });

    expect(result.current.timeLeft).toBe(0);
    expect(result.current.isRunning).toBe(false);
    expect(onExpire).toHaveBeenCalledTimes(1);
  });
});
