// src/components/reveal-view.tsx
// Reveal view: highlights missed key points and enables revise & resubmit

'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, RotateCcw, CheckCircle2, XCircle } from 'lucide-react';
import type { KeyPoint } from '@/types';

interface RevealViewProps {
  articleTitle: string;
  articleText: string;
  keyPoints: KeyPoint[];
  jevResults?: Record<string, any>;
  onRetry: () => void;
}

export function RevealView({
  articleTitle,
  articleText,
  keyPoints,
  jevResults = {},
  onRetry,
}: RevealViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  // Identify which key points were missed based on jevResults
  const pointStatuses = keyPoints.map((kp, idx) => {
    const res = jevResults[`kp_${idx}`];
    const prob = res?.probability ?? 0.5;
    const isCaptured = prob >= 0.5;
    return {
      text: kp.text,
      isCaptured,
      confidence: res?.confidence,
    };
  });

  return (
    <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-lg font-bold text-slate-900 tracking-tight">Review & Key Point Analysis</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare your active recall against verified key ideas and identify blind spots
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setIsRevealed(!isRevealed)}
            className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition"
          >
            {isRevealed ? (
              <>
                <EyeOff className="h-4 w-4 text-slate-500" />
                Hide Source Article
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 text-slate-500" />
                Reveal Source Text
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            <RotateCcw className="h-4 w-4" />
            Revise & Resubmit
          </button>
        </div>
      </div>

      {/* Key Points Status Cards */}
      <div className="mt-6 space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-500">
          Key Point Retention Map
        </h4>
        <div className="grid gap-3 sm:grid-cols-2">
          {pointStatuses.map((pt, idx) => (
            <div
              key={idx}
              className={`flex items-start gap-3 rounded-xl border p-4 text-xs transition ${
                pt.isCaptured
                  ? 'border-emerald-200 bg-emerald-50/70 text-emerald-900'
                  : 'border-amber-200 bg-amber-50/70 text-amber-900'
              }`}
            >
              {pt.isCaptured ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600 mt-0.5" />
              ) : (
                <XCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
              )}
              <div>
                <span className="font-semibold block mb-0.5">
                  {pt.isCaptured ? 'Captured Accurately' : 'Missed or Weakly Stated'}
                </span>
                <p className="leading-relaxed opacity-90">{pt.text}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Revealed Source Article Text */}
      {isRevealed && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8">
          <div className="mb-4 flex items-center justify-between border-b border-slate-200 pb-3">
            <h4 className="font-sans text-base font-bold text-slate-900">
              {articleTitle}
            </h4>
            <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 border border-amber-200 rounded-md px-2.5 py-0.5">
              Source Text Reference
            </span>
          </div>

          <div className="font-serif text-slate-700 text-base leading-relaxed whitespace-pre-line text-justify">
            {articleText}
          </div>
        </div>
      )}
    </div>
  );
}
