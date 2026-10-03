// src/components/summary-editor.tsx
// Summary textarea editor with live word count, length guards, and range guidance

'use client';

import React from 'react';
import { useWordCount } from '@/hooks/use-word-count';
import { SUMMARY_MAX_CHARS } from '@/lib/constants';
import { CheckCircle2, AlertCircle } from 'lucide-react';

interface SummaryEditorProps {
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function SummaryEditor({
  value,
  onChange,
  disabled = false,
  placeholder = 'Write your summary from memory... Explain the main idea, key concepts, and practical significance.',
}: SummaryEditorProps) {
  const { count, isAboveMin, isInRange, minWords, suggestedMin, suggestedMax } =
    useWordCount(value);

  const charCount = value.length;
  const isOverCharLimit = charCount > SUMMARY_MAX_CHARS;

  return (
    <div className="flex flex-col gap-2.5">
      <div className="relative">
        <textarea
          id="summary-input"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          placeholder={placeholder}
          rows={9}
          aria-label="Article summary"
          aria-describedby="summary-counter-help"
          className="w-full resize-y rounded-2xl border border-slate-200 bg-white p-5 text-base text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 shadow-sm disabled:opacity-50 transition leading-relaxed font-sans"
        />
      </div>

      {/* Status Bar */}
      <div
        id="summary-counter-help"
        className="flex flex-wrap items-center justify-between gap-3 text-xs"
      >
        <div className="flex items-center gap-2.5">
          {/* Word count badge */}
          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold border transition ${
              isInRange
                ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : isAboveMin
                  ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                  : 'bg-slate-100 text-slate-600 border-slate-200'
            }`}
          >
            {isAboveMin ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
            ) : (
              <AlertCircle className="h-3.5 w-3.5 text-slate-500" />
            )}
            {count} {count === 1 ? 'word' : 'words'}
          </span>

          {/* Guide notes */}
          <span className="text-slate-500 font-medium">
            Min: {minWords} words • Recommended: {suggestedMin}–{suggestedMax} words
          </span>
        </div>

        {/* Character count */}
        <div
          className={`font-mono text-xs ${
            isOverCharLimit ? 'text-rose-600 font-bold' : 'text-slate-400'
          }`}
        >
          {charCount}/{SUMMARY_MAX_CHARS} chars
        </div>
      </div>

      {/* Helpful hint when below minimum */}
      {!isAboveMin && value.trim().length > 0 && (
        <p className="text-xs text-amber-700 font-medium">
          Write at least {minWords - count} more {minWords - count === 1 ? 'word' : 'words'} to meet the recall threshold.
        </p>
      )}
    </div>
  );
}
