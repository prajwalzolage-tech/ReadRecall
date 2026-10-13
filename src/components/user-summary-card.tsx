// src/components/user-summary-card.tsx
// Displays the student's submitted recall summary alongside metrics and actions

'use client';

import React, { useState } from 'react';
import { FileText, Copy, Check, ChevronDown, ChevronUp, Clock, Bookmark, RotateCcw } from 'lucide-react';
import { countWords } from '@/hooks/use-word-count';

interface UserSummaryCardProps {
  summary?: string;
  section?: string;
  isRevision?: boolean;
  className?: string;
}

export function UserSummaryCard({
  summary = '',
  section,
  isRevision = false,
  className = '',
}: UserSummaryCardProps) {
  const [copied, setCopied] = useState(false);
  const [isExpanded, setIsExpanded] = useState(true);

  const trimmedSummary = summary?.trim() || '';
  const wordCount = countWords(trimmedSummary);
  const charCount = trimmedSummary.length;
  // Estimated reading time: avg 200 wpm
  const readingTimeSec = Math.max(1, Math.round((wordCount / 200) * 60));

  const handleCopy = async () => {
    if (!trimmedSummary) return;
    try {
      if (navigator?.clipboard?.writeText) {
        await navigator.clipboard.writeText(trimmedSummary);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = trimmedSummary;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore copy failure
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-5 sm:p-8 shadow-sm transition ${className}`}
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 sm:gap-4 border-b border-slate-100 pb-4 sm:pb-5">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-50 text-indigo-700 border border-indigo-100 shrink-0">
              <FileText className="h-4 w-4" />
            </span>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
              Your Recall Summary
            </h3>
            {isRevision && (
              <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
                <RotateCcw className="h-3 w-3" />
                Revision
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Synthesized from memory during active recall without referencing the original text
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-start sm:self-auto">
          {trimmedSummary && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 hover:text-slate-900 transition active:scale-95"
              title="Copy summary to clipboard"
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-slate-500" />
                  <span>Copy Text</span>
                </>
              )}
            </button>
          )}

          {trimmedSummary && wordCount > 120 && (
            <button
              type="button"
              onClick={() => setIsExpanded(!isExpanded)}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 shadow-2xs hover:bg-slate-50 transition active:scale-95"
            >
              {isExpanded ? (
                <>
                  <span>Collapse</span>
                  <ChevronUp className="h-3.5 w-3.5" />
                </>
              ) : (
                <>
                  <span>Expand</span>
                  <ChevronDown className="h-3.5 w-3.5" />
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Metrics & Context Bar */}
      {trimmedSummary ? (
        <div className="mt-4 flex flex-wrap items-center gap-2 text-xs text-slate-600">
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 font-mono font-medium text-slate-700">
            {wordCount} {wordCount === 1 ? 'word' : 'words'}
          </span>
          <span className="inline-flex items-center rounded-lg bg-slate-100 px-2.5 py-1 font-mono font-medium text-slate-700">
            {charCount} chars
          </span>
          <span className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1 font-medium text-slate-600">
            <Clock className="h-3 w-3 text-slate-400" />
            ~{readingTimeSec}s read
          </span>
          {section && (
            <span className="inline-flex items-center gap-1 rounded-lg bg-indigo-50 border border-indigo-100 px-2.5 py-1 font-medium text-indigo-700">
              <Bookmark className="h-3 w-3 text-indigo-500" />
              Target: {section}
            </span>
          )}
        </div>
      ) : null}

      {/* Content Area */}
      <div className="mt-4">
        {trimmedSummary ? (
          <div
            className={`relative rounded-xl border border-slate-200/80 bg-slate-50/60 p-5 sm:p-6 transition-all ${
              !isExpanded ? 'max-h-36 overflow-hidden' : ''
            }`}
          >
            <div className="whitespace-pre-wrap font-sans text-sm sm:text-base leading-relaxed text-slate-800 selection:bg-indigo-100 selection:text-indigo-900">
              {trimmedSummary}
            </div>

            {/* Gradient overlay when collapsed */}
            {!isExpanded && (
              <div
                onClick={() => setIsExpanded(true)}
                className="absolute inset-x-0 bottom-0 flex h-20 cursor-pointer items-end justify-center bg-gradient-to-t from-slate-50 via-slate-50/80 to-transparent pb-3"
              >
                <span className="rounded-lg bg-white/90 px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm border border-slate-200">
                  Click to show full summary
                </span>
              </div>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50/50 p-6 text-center text-xs text-slate-500">
            <FileText className="mx-auto h-6 w-6 text-slate-300 mb-2" />
            <p className="font-semibold text-slate-700">No summary text recorded for this session.</p>
            <p className="mt-1 text-slate-400">
              If Strict Privacy Mode was active when submitting, raw summary text is withheld from persistent storage.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
