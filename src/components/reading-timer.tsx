// src/components/reading-timer.tsx
// Visual countdown timer with warning colors and accessibility support

'use client';

import React from 'react';
import { Clock } from 'lucide-react';

interface ReadingTimerProps {
  timeLeft: number;
  totalDuration: number;
  onFinishEarly?: () => void;
  className?: string;
}

export function ReadingTimer({
  timeLeft,
  totalDuration,
  onFinishEarly,
  className = '',
}: ReadingTimerProps) {
  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const formattedTime = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  const percentage = Math.max(0, Math.min(100, (timeLeft / (totalDuration || 1)) * 100));

  // Determine light status colors
  let statusColor = 'text-slate-900 border-slate-200 bg-slate-50/70';
  let progressColor = 'stroke-slate-900';
  if (timeLeft <= 10) {
    statusColor = 'text-rose-700 border-rose-200 bg-rose-50 animate-pulse';
    progressColor = 'stroke-rose-600';
  } else if (timeLeft <= 30) {
    statusColor = 'text-amber-800 border-amber-200 bg-amber-50';
    progressColor = 'stroke-amber-600';
  }

  // Circular radius calculation
  const size = 52;
  const strokeWidth = 4;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div
      className={`flex items-center gap-3.5 rounded-xl border px-3.5 py-2 transition-all shadow-xs ${statusColor} ${className}`}
      role="timer"
      aria-label={`Time remaining: ${minutes} minutes and ${seconds} seconds`}
      aria-live="polite"
    >
      <div className="relative flex items-center justify-center">
        <svg
          width={size}
          height={size}
          className="-rotate-90 transform"
          aria-hidden="true"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-slate-200"
            strokeWidth={strokeWidth}
            fill="transparent"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className={`transition-all duration-1000 ease-linear ${progressColor}`}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="transparent"
          />
        </svg>
        <Clock className="absolute h-4 w-4 opacity-60 text-slate-700" aria-hidden="true" />
      </div>

      <div className="flex flex-col">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
          Remaining
        </span>
        <span className="font-mono text-xl font-bold tracking-tight text-slate-900">
          {formattedTime}
        </span>
      </div>

      {onFinishEarly && (
        <button
          type="button"
          onClick={onFinishEarly}
          className="ml-auto rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
        >
          Done Early
        </button>
      )}
    </div>
  );
}
