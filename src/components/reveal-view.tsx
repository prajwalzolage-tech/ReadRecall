// src/components/reveal-view.tsx
// Reveal view: highlights missed key points and enables revise & resubmit with comparative recall analysis

'use client';

import React, { useState } from 'react';
import { Eye, EyeOff, RotateCcw, CheckCircle2, XCircle, FileText, BookOpen } from 'lucide-react';
import { DocumentReader } from '@/components/document-reader';
import type { KeyPoint } from '@/types';

interface RevealViewProps {
  articleTitle: string;
  articleText: string;
  keyPoints: KeyPoint[];
  jevResults?: Record<string, any>;
  userSummary?: string;
  onRetry: () => void;
}

export function RevealView({
  articleTitle,
  articleText,
  keyPoints,
  jevResults = {},
  userSummary,
  onRetry,
}: RevealViewProps) {
  const [isRevealed, setIsRevealed] = useState(false);
  const [compareMode, setCompareMode] = useState<'split' | 'source-only'>('split');

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
    <div className="rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-100 pb-5">
        <div>
          <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">Review &amp; Key Point Analysis</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Compare your active recall against verified key ideas and identify blind spots
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 sm:gap-3 w-full sm:w-auto">
          <button
            type="button"
            onClick={() => setIsRevealed(!isRevealed)}
            className="inline-flex justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-[0.99]"
          >
            {isRevealed ? (
              <>
                <EyeOff className="h-4 w-4 text-slate-500" />
                <span>Hide Source Article</span>
              </>
            ) : (
              <>
                <Eye className="h-4 w-4 text-slate-500" />
                <span>Reveal Source Text</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onRetry}
            className="inline-flex justify-center items-center gap-2 rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition active:scale-[0.99]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>Revise &amp; Resubmit</span>
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

      {/* Revealed Source Article Text & Side-by-Side Comparison */}
      {isRevealed && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-6 sm:p-8">
          <div className="mb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200 pb-3">
            <div>
              <div className="flex items-center gap-2">
                <h4 className="font-sans text-base font-bold text-slate-900">
                  {articleTitle}
                </h4>
                <span className="text-[11px] font-semibold text-amber-800 bg-amber-100/70 border border-amber-200 rounded-md px-2.5 py-0.5">
                  Source Text Reference
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Cross-examine your recall synthesis against the ground-truth text
              </p>
            </div>

            {userSummary ? (
              <div className="flex items-center rounded-xl border border-slate-200 bg-white p-1 text-xs shadow-sm">
                <button
                  type="button"
                  onClick={() => setCompareMode('split')}
                  className={`rounded-lg px-3 py-1 font-semibold transition ${
                    compareMode === 'split'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Side-by-Side Comparison
                </button>
                <button
                  type="button"
                  onClick={() => setCompareMode('source-only')}
                  className={`rounded-lg px-3 py-1 font-semibold transition ${
                    compareMode === 'source-only'
                      ? 'bg-slate-900 text-white shadow-sm'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Source Document Only
                </button>
              </div>
            ) : null}
          </div>

          {compareMode === 'split' && userSummary ? (
            <div className="grid gap-6 lg:grid-cols-2 pt-2">
              {/* Left Column: Your Recall Summary */}
              <div className="flex flex-col rounded-xl border border-indigo-200/90 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b border-indigo-50 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-indigo-900 flex items-center gap-1.5">
                    <FileText className="h-3.5 w-3.5 text-indigo-600" />
                    Your Recall Summary
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                    What You Wrote
                  </span>
                </div>
                <div className="whitespace-pre-wrap font-sans text-sm text-slate-800 leading-relaxed max-h-[550px] overflow-y-auto pr-2 selection:bg-indigo-100">
                  {userSummary}
                </div>
              </div>

              {/* Right Column: Source Document */}
              <div className="flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
                <div className="mb-3 flex items-center justify-between border-b border-slate-100 pb-2.5">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                    <BookOpen className="h-3.5 w-3.5 text-slate-600" />
                    Source Article Reference
                  </span>
                  <span className="text-[10px] font-mono font-semibold text-amber-800 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Ground Truth
                  </span>
                </div>
                <div className="max-h-[550px] overflow-y-auto pr-1">
                  <DocumentReader content={articleText} title={articleTitle} />
                </div>
              </div>
            </div>
          ) : (
            <div className="pt-2">
              <DocumentReader content={articleText} title={articleTitle} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

