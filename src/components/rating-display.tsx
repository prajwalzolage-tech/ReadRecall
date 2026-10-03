// src/components/rating-display.tsx
// Animated 1-10 rating reveal, color tiers, dimension score breakdown, and guard badges

'use client';

import React, { useEffect, useState } from 'react';
import type { DimensionScores, Guards, Flags } from '@/types';
import { ShieldAlert, AlertTriangle, Award } from 'lucide-react';

interface RatingDisplayProps {
  rating: number;
  rawScore?: number;
  dimensionScores: DimensionScores;
  guards: Guards;
  flags: Flags;
  className?: string;
}

export function RatingDisplay({
  rating,
  rawScore: _rawScore,
  dimensionScores,
  guards,
  flags,
  className = '',
}: RatingDisplayProps) {
  const [animatedRating, setAnimatedRating] = useState(0);

  useEffect(() => {
    let current = 0;
    const interval = setInterval(() => {
      current += 1;
      if (current >= rating) {
        setAnimatedRating(rating);
        clearInterval(interval);
      } else {
        setAnimatedRating(current);
      }
    }, 80);
    return () => clearInterval(interval);
  }, [rating]);

  // Color tier styles for clean light theme
  let tierStyle = {
    badge: 'border-rose-200 bg-rose-50 text-rose-700',
    text: 'text-rose-600',
    glow: 'from-rose-500/10 to-transparent',
    label: 'Needs Review',
  };

  if (rating >= 9) {
    tierStyle = {
      badge: 'border-indigo-200 bg-indigo-50 text-indigo-700',
      text: 'text-slate-900',
      glow: 'from-indigo-500/10 to-transparent',
      label: 'Exemplary Mastery',
    };
  } else if (rating >= 7) {
    tierStyle = {
      badge: 'border-emerald-200 bg-emerald-50 text-emerald-800',
      text: 'text-emerald-700',
      glow: 'from-emerald-500/10 to-transparent',
      label: 'Proficient Recall',
    };
  } else if (rating >= 4) {
    tierStyle = {
      badge: 'border-amber-200 bg-amber-50 text-amber-800',
      text: 'text-amber-700',
      glow: 'from-amber-500/10 to-transparent',
      label: 'Developing Understanding',
    };
  }

  const dimensions = [
    { label: 'Key Point Coverage', score: dimensionScores?.coverage ?? 0, weight: '35%' },
    { label: 'Central Thesis / Main Idea', score: dimensionScores?.mainIdea ?? 0, weight: '25%' },
    { label: 'Factual Faithfulness', score: dimensionScores?.faithfulness ?? 0, weight: '25%' },
    { label: 'Clarity & Coherence', score: dimensionScores?.clarity ?? 0, weight: '10%' },
    { label: 'Applied Purpose', score: dimensionScores?.appliedPurpose ?? 0, weight: '5%' },
  ];

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm ${className}`}
    >
      {/* Top Header & Score Reveal */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-6 border-b border-slate-100 pb-6">
        <div className="text-center sm:text-left">
          <div className="flex items-center justify-center sm:justify-start gap-2">
            <span
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wider ${tierStyle.badge}`}
            >
              <Award className="h-3.5 w-3.5" />
              {tierStyle.label}
            </span>
            {flags?.lowConfidence && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-800">
                <AlertTriangle className="h-3 w-3" />
                Low Confidence
              </span>
            )}
          </div>
          <h2 className="mt-2 text-xl font-bold text-slate-900 tracking-tight">Comprehension Rating</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Calibrated synthesis of key idea coverage, factual faithfulness, and clarity
          </p>
        </div>

        {/* Big Number Reveal */}
        <div className="relative flex items-center justify-center">
          <div
            className={`absolute -inset-4 rounded-full bg-gradient-to-tr ${tierStyle.glow} blur-xl`}
          />
          <div className="relative flex items-baseline gap-1">
            <span
              className={`font-mono text-6xl sm:text-7xl font-extrabold tracking-tighter ${tierStyle.text}`}
            >
              {animatedRating}
            </span>
            <span className="font-mono text-2xl font-bold text-slate-400">/10</span>
          </div>
        </div>
      </div>

      {/* Safety & Quality Guards Alerts */}
      <div className="my-4 space-y-2">
        {guards?.injectionGuard && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <ShieldAlert className="h-4 w-4 shrink-0 text-rose-600" />
            <span>Prompt injection instructions detected in summary. Rating set to 1.</span>
          </div>
        )}
        {guards?.wordCountGuard && (
          <div className="flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3.5 text-xs text-rose-700">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
            <span>Summary length was below the 15-word minimum threshold.</span>
          </div>
        )}
        {guards?.copyGuard && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>
              Verbatim copy ratio ({Math.round((flags?.copyRatio ?? 0) * 100)}%) exceeded 60%. Rating capped at 4.
            </span>
          </div>
        )}
        {guards?.contradictionGuard && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Contradictory claims identified against the text. Rating capped at 5.</span>
          </div>
        )}
        {guards?.offTopicGuard && (
          <div className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-3.5 text-xs text-amber-800">
            <AlertTriangle className="h-4 w-4 shrink-0 text-amber-600" />
            <span>Off-topic content detected. Rating capped at 2.</span>
          </div>
        )}
      </div>

      {/* Dimension Breakdown Bars */}
      <div className="mt-6 space-y-4">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Multidimensional Breakdown
        </h3>
        <div className="space-y-3.5">
          {dimensions.map((dim) => {
            const pct = Math.round(dim.score * 100);
            let barColor = 'bg-rose-500';
            if (pct >= 80) barColor = 'bg-emerald-600';
            else if (pct >= 60) barColor = 'bg-slate-900';
            else if (pct >= 40) barColor = 'bg-amber-500';

            return (
              <div key={dim.label} className="space-y-1.5">
                <div className="flex justify-between text-xs">
                  <span className="font-semibold text-slate-700">{dim.label}</span>
                  <span className="font-mono text-slate-600 font-medium">
                    {pct}% <span className="text-[10px] text-slate-400">({dim.weight})</span>
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
                  <div
                    className={`h-full transition-all duration-1000 ease-out ${barColor}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
