// src/app/search/page.tsx
// Search view: query arXiv and OpenAlex papers, show results with direct links

'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { SearchResults } from '@/components/search-results';
import { Search, Sparkles, AlertCircle, Info } from 'lucide-react';
import type { MergedSearchResult } from '@/types';

export default function SearchPage() {
  const router = useRouter();
  const { user, loading, idToken } = useAuth();

  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<MergedSearchResult[]>([]);
  const [hasSearched, setHasSearched] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim() || query.trim().length < 2 || !idToken) return;

    setSearching(true);
    setError(null);
    setHasSearched(true);

    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(query.trim())}`, {
        headers: { Authorization: `Bearer ${idToken}` },
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Search failed');
      }

      const data = await res.json();
      setResults(data.results || []);
    } catch (err: any) {
      setError(err.message || 'Error executing search');
    } finally {
      setSearching(false);
    }
  };

  if (loading || !user) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
      {/* Header */}
      <div className="pb-6 border-b border-slate-200/80">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
          <Search className="h-4 w-4" />
          <span>Academic Corpus Explorer</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Search arXiv &amp; OpenAlex Papers
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
          Search millions of peer-reviewed open-access preprints and journals.
          Find a paper, visit its source to download, then upload into ReadRecall for an active recall session.
        </p>
      </div>

      {/* How it works hint */}
      <div className="flex items-start gap-3 rounded-xl border border-indigo-100 bg-indigo-50/50 p-4">
        <Info className="h-4 w-4 shrink-0 text-indigo-600 mt-0.5" />
        <div className="text-xs text-indigo-800 leading-relaxed space-y-1">
          <p className="font-semibold">How it works</p>
          <p>
            1. Search for a topic → 2. Click the paper link to visit the source website →
            3. Download the PDF/document → 4. Upload it via the <strong>Upload</strong> page to start a timed reading session.
          </p>
        </div>
      </div>

      {/* Search Input Bar */}
      <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search papers (e.g., 'attention is all you need', 'raft consensus')..."
            className="w-full rounded-2xl border border-slate-200 bg-white pl-12 pr-4 py-3.5 text-sm text-slate-900 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 shadow-xs transition"
          />
        </div>

        <button
          type="submit"
          disabled={searching || query.trim().length < 2}
          className={`inline-flex w-full sm:w-auto justify-center items-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-semibold text-white shadow-sm transition ${
            searching || query.trim().length < 2
              ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800 cursor-pointer'
          }`}
        >
          {searching ? (
            <>
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              <span>Searching...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4 text-indigo-400" />
              <span>Search</span>
            </>
          )}
        </button>
      </form>

      {/* Error alert */}
      {error && (
        <div className="flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Results List */}
      {hasSearched && <SearchResults results={results} />}
    </div>
  );
}
