// src/components/engagement-card.tsx
// Displays REAL engagement monitoring results: focus %, emotion breakdown, and timeline chart.
// All signals are labeled as estimates — never stated as fact.
// Handles edge cases: camera was off, very short sessions, missing fields.

'use client';

import React from 'react';
import { Eye, AlertCircle, CameraOff } from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';
import type { EngagementSummary } from '@/types';

interface EngagementCardProps {
  engagement: EngagementSummary;
}

const EMOTION_COLORS: Record<string, string> = {
  enjoying: '#10B981', // emerald-500
  confused: '#F59E0B', // amber-500
  bored: '#EF4444', // red-500
  neutral: '#94A3B8', // slate-400
};

const EMOTION_LABELS: Record<string, string> = {
  enjoying: 'Enjoying',
  confused: 'Confused',
  bored: 'Bored',
  neutral: 'Neutral',
};

function formatTime(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${s < 10 ? '0' : ''}${s}`;
}

export function EngagementCard({ engagement }: EngagementCardProps) {
  // Safely extract fields with defaults for any missing data
  const focusPercent = typeof engagement.focusPercent === 'number' ? engagement.focusPercent : 0;
  const distractedSeconds = typeof engagement.distractedSeconds === 'number' ? engagement.distractedSeconds : 0;
  const confusedMoments = typeof engagement.confusedMoments === 'number' ? engagement.confusedMoments : 0;
  const boredMoments = typeof engagement.boredMoments === 'number' ? engagement.boredMoments : 0;

  const emotionPercent = {
    enjoying: engagement.emotionPercent?.enjoying ?? 0,
    confused: engagement.emotionPercent?.confused ?? 0,
    bored: engagement.emotionPercent?.bored ?? 0,
    neutral: engagement.emotionPercent?.neutral ?? 0,
  };

  const timeline = Array.isArray(engagement.timeline) ? engagement.timeline : [];

  // Determine if we have meaningful data (user had camera on long enough to capture frames)
  const hasEmotionData = emotionPercent.enjoying + emotionPercent.confused + emotionPercent.bored + emotionPercent.neutral > 0;
  const hasMeaningfulData = hasEmotionData || focusPercent > 0 || distractedSeconds > 0;

  // If engagement was captured but has no real data (camera was off the whole time)
  if (!hasMeaningfulData) {
    return (
      <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-100">
            <CameraOff className="h-4 w-4 text-slate-400" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900">
              Engagement Monitoring
            </h3>
            <p className="text-xs text-slate-500">
              Camera was off during this session — no focus data captured
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Prepare chart data if timeline exists and has enough points
  const chartData = timeline.length > 2
    ? timeline.map((pt) => ({
        time: formatTime(pt.tSec),
        tSec: pt.tSec,
        focused: pt.focused ? 1 : 0,
        emotion: pt.emotion,
      }))
    : null;

  const focusColor =
    focusPercent >= 80
      ? 'text-emerald-600'
      : focusPercent >= 50
        ? 'text-amber-600'
        : 'text-rose-600';

  const focusBg =
    focusPercent >= 80
      ? 'bg-emerald-50 border-emerald-200'
      : focusPercent >= 50
        ? 'bg-amber-50 border-amber-200'
        : 'bg-rose-50 border-rose-200';

  const focusLabel =
    focusPercent >= 80
      ? 'Excellent Focus'
      : focusPercent >= 60
        ? 'Good Focus'
        : focusPercent >= 40
          ? 'Moderate Focus'
          : 'Low Focus';

  // Compute total tracked time from timeline
  const totalTrackedSec = timeline.length > 0 ? timeline[timeline.length - 1].tSec + 1 : distractedSeconds;

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
          <Eye className="h-4 w-4 text-indigo-600" />
        </div>
        <div>
          <h3 className="text-sm font-bold text-slate-900">
            Engagement Estimates
          </h3>
          <p className="text-xs text-slate-500">
            Webcam-based signals — approximate, not definitive
          </p>
        </div>
      </div>

      {/* Focus & distraction summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div
          className={`rounded-xl border p-3.5 text-center ${focusBg}`}
        >
          <p className="text-xs font-medium text-slate-500 mb-0.5">Focus</p>
          <p className={`text-xl font-bold ${focusColor}`}>
            {focusPercent}%
          </p>
          <p className={`text-[10px] font-medium mt-0.5 ${focusColor}`}>
            {focusLabel}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center">
          <p className="text-xs font-medium text-slate-500 mb-0.5">
            Distracted
          </p>
          <p className="text-xl font-bold text-slate-700">
            {distractedSeconds}s
          </p>
          {totalTrackedSec > 0 && (
            <p className="text-[10px] text-slate-400 mt-0.5">
              of {formatTime(totalTrackedSec)} tracked
            </p>
          )}
        </div>
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-center">
          <p className="text-xs font-medium text-slate-500 mb-0.5">
            Confused Moments
          </p>
          <p className="text-xl font-bold text-amber-600">
            {confusedMoments}
          </p>
          <p className="text-[10px] text-amber-500 mt-0.5">
            {confusedMoments === 0 ? 'None detected' : confusedMoments === 1 ? 'episode' : 'episodes'}
          </p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 text-center">
          <p className="text-xs font-medium text-slate-500 mb-0.5">
            Bored Moments
          </p>
          <p className="text-xl font-bold text-slate-600">
            {boredMoments}
          </p>
          <p className="text-[10px] text-slate-400 mt-0.5">
            {boredMoments === 0 ? 'None detected' : boredMoments === 1 ? 'episode' : 'episodes'}
          </p>
        </div>
      </div>

      {/* Emotion breakdown bar */}
      {hasEmotionData && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">
            Estimated Emotion Breakdown
          </p>
          <div className="flex h-3 w-full overflow-hidden rounded-full">
            {(['enjoying', 'confused', 'bored', 'neutral'] as const).map(
              (em) => {
                const pct = emotionPercent[em];
                if (pct <= 0) return null;
                return (
                  <div
                    key={em}
                    style={{
                      width: `${pct}%`,
                      backgroundColor: EMOTION_COLORS[em],
                    }}
                    className="transition-all"
                    title={`${EMOTION_LABELS[em]}: ${pct}%`}
                  />
                );
              }
            )}
          </div>
          <div className="flex flex-wrap gap-3 text-xs text-slate-500">
            {(['enjoying', 'confused', 'bored', 'neutral'] as const).map(
              (em) => (
                <span key={em} className="flex items-center gap-1.5">
                  <span
                    className="inline-block h-2.5 w-2.5 rounded-full"
                    style={{ backgroundColor: EMOTION_COLORS[em] }}
                  />
                  {EMOTION_LABELS[em]} {emotionPercent[em]}%
                </span>
              )
            )}
          </div>
        </div>
      )}

      {/* Timeline chart */}
      {chartData && chartData.length > 2 && (
        <div className="space-y-2">
          <p className="text-xs font-semibold text-slate-700">
            Focus Timeline
          </p>
          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E2E8F0" />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 10, fill: '#94A3B8' }}
                  interval={Math.max(1, Math.floor(chartData.length / 8))}
                />
                <YAxis
                  domain={[0, 1]}
                  ticks={[0, 1]}
                  tickFormatter={(v: number) =>
                    v === 1 ? 'Focused' : 'Distracted'
                  }
                  tick={{ fontSize: 9, fill: '#94A3B8' }}
                />
                <Tooltip
                  formatter={(value: any) =>
                    Number(value) === 1 ? 'Focused' : 'Distracted'
                  }
                  labelFormatter={(label: any) => `Time: ${label}`}
                  contentStyle={{
                    fontSize: 11,
                    borderRadius: 8,
                    border: '1px solid #E2E8F0',
                  }}
                />
                <Area
                  type="stepAfter"
                  dataKey="focused"
                  stroke="#6366F1"
                  fill="#EEF2FF"
                  strokeWidth={1.5}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Privacy disclaimer */}
      <div className="flex items-start gap-2 rounded-lg bg-slate-50 p-3 text-xs text-slate-500 leading-relaxed">
        <AlertCircle className="h-3.5 w-3.5 shrink-0 text-slate-400 mt-0.5" />
        <span>
          These engagement signals are rough estimates based on facial
          expressions and head position. They may be inaccurate due to
          lighting, camera angle, glasses, or natural resting expressions.
          No video or image data was stored or transmitted.
        </span>
      </div>
    </div>
  );
}
