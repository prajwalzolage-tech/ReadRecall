// src/components/search-results.tsx
// Component displaying merged research search results with full-text indicator and action buttons

'use client';

import React, { useState } from 'react';
import type { MergedSearchResult } from '@/types';
import {
  ExternalLink,
  BookOpen,
  Download,
  UploadCloud,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SearchResultsProps {
  results: MergedSearchResult[];
  onSelectFullText: (result: MergedSearchResult) => void;
  onSelectLinkOnly: (result: MergedSearchResult) => void;
  processingId?: string | null;
}

export function SearchResults({
  results,
  onSelectFullText,
  onSelectLinkOnly,
  processingId,
}: SearchResultsProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (results.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-12 text-center">
        <BookOpen className="mx-auto h-8 w-8 text-slate-400 mb-3" />
        <p className="text-sm font-semibold text-slate-700">No papers found</p>
        <p className="mt-1 text-xs text-slate-500">
          Try searching for topics like &quot;transformer attention&quot;, &quot;distributed consensus&quot;, or &quot;zero-knowledge proofs&quot;.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result) => {
        const isExpanded = expandedId === result.id;
        const isProcessing = processingId === result.id;

        return (
          <div
            key={result.id}
            className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:border-slate-300 transition"
          >
            {/* Top row */}
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <div className="flex flex-wrap items-center gap-2">
                {result.sources.map((src) => (
                  <span
                    key={src}
                    className="rounded-md bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold uppercase text-slate-600"
                  >
                    {src}
                  </span>
                ))}

                {result.fullTextAvailable ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <Download className="h-3 w-3" />
                    Full Text Available
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-medium text-slate-700">
                    <ExternalLink className="h-3 w-3" />
                    Citation Only
                  </span>
                )}
              </div>

              <span className="font-mono text-xs text-slate-400 font-medium">
                {result.year}
              </span>
            </div>

            {/* Title */}
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-snug tracking-tight">
              {result.title}
            </h3>

            {/* Authors */}
            {result.authors.length > 0 && (
              <p className="mt-1 text-xs text-slate-500 font-medium line-clamp-1">
                By {result.authors.slice(0, 4).join(', ')}
                {result.authors.length > 4 ? ' et al.' : ''}
              </p>
            )}

            {/* Abstract */}
            {result.abstract && (
              <div className="mt-3 text-xs leading-relaxed text-slate-600">
                <p className={isExpanded ? '' : 'line-clamp-2'}>
                  {result.abstract}
                </p>
                {result.abstract.length > 180 && (
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedId(isExpanded ? null : result.id)
                    }
                    className="mt-1.5 inline-flex items-center gap-1 text-[11px] text-indigo-600 hover:text-indigo-800 font-semibold"
                  >
                    {isExpanded ? (
                      <>
                        <span>Show less</span>
                        <ChevronUp className="h-3 w-3" />
                      </>
                    ) : (
                      <>
                        <span>Read full abstract</span>
                        <ChevronDown className="h-3 w-3" />
                      </>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* Actions */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              <div className="flex items-center gap-3">
                {result.doi && (
                  <a
                    href={`https://doi.org/${result.doi}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-xs font-medium text-slate-500 hover:text-slate-800"
                  >
                    <span>DOI</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>

              {result.fullTextAvailable ? (
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={() => onSelectFullText(result)}
                  className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
                >
                  {isProcessing ? (
                    <>
                      <div className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Downloading & Analyzing...</span>
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-3.5 w-3.5" />
                      <span>Read Paper with Recall</span>
                    </>
                  )}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => onSelectLinkOnly(result)}
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
                >
                  <UploadCloud className="h-3.5 w-3.5 text-slate-500" />
                  <span>Manual Upload Fallback</span>
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
