// src/components/search-results.tsx
// Component displaying merged research search results with direct links to papers

'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import type { MergedSearchResult } from '@/types';
import {
  ExternalLink,
  BookOpen,
  FileText,
  Upload,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface SearchResultsProps {
  results: MergedSearchResult[];
}

export function SearchResults({ results }: SearchResultsProps) {
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

        // Build available links
        const paperLinks: { label: string; url: string; primary?: boolean }[] = [];

        if (result.pdfUrl) {
          paperLinks.push({ label: 'View / Download PDF', url: result.pdfUrl, primary: true });
        }

        if (result.landingUrl && result.landingUrl !== result.pdfUrl) {
          paperLinks.push({ label: 'Paper Page', url: result.landingUrl });
        }

        if (result.doi) {
          const doiUrl = `https://doi.org/${result.doi}`;
          // Don't duplicate if landingUrl is already the DOI
          if (!paperLinks.some((l) => l.url === doiUrl)) {
            paperLinks.push({ label: 'DOI', url: doiUrl });
          }
        }

        return (
          <div
            key={result.id}
            className="rounded-2xl border border-slate-200/90 bg-white p-6 shadow-sm hover:border-slate-300 transition"
          >
            {/* Top row: source badges + year */}
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

                {result.fullTextAvailable && (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-semibold text-emerald-800">
                    <FileText className="h-3 w-3" />
                    Full Text Available
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

            {/* Actions: links to paper + upload CTA */}
            <div className="mt-5 flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-slate-100">
              {/* Paper links */}
              <div className="flex items-center gap-3">
                {paperLinks.map((link) => (
                  <a
                    key={link.url}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`inline-flex items-center gap-1 text-xs font-medium transition ${
                      link.primary
                        ? 'text-indigo-600 hover:text-indigo-800'
                        : 'text-slate-500 hover:text-slate-800'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ExternalLink className="h-3 w-3" />
                  </a>
                ))}
              </div>

              {/* Upload CTA */}
              <Link
                href={`/upload?title=${encodeURIComponent(result.title)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload &amp; Read with Recall</span>
              </Link>
            </div>
          </div>
        );
      })}
    </div>
  );
}
