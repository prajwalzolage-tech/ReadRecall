// src/app/write/[articleId]/page.tsx
// Summary writing view: user writes summary from memory (article text is strictly hidden)

'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { SummaryEditor } from '@/components/summary-editor';
import { countWords } from '@/hooks/use-word-count';
import { SUMMARY_MIN_WORDS } from '@/lib/constants';
import { Brain, ArrowRight, Sparkles, AlertCircle } from 'lucide-react';

interface PageProps {
  params: Promise<{ articleId: string }>;
}

interface ArticleMetadata {
  id: string;
  title: string;
  wordCount: number;
  source: string;
  authors?: string[];
  year?: number;
}

export default function WritePage({ params }: PageProps) {
  const { articleId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionTitle = searchParams.get('section') ?? undefined;
  const retryOf = searchParams.get('retry') ?? undefined;

  const { user, loading, idToken } = useAuth();
  const [metadata, setMetadata] = useState<ArticleMetadata | null>(null);
  const [summary, setSummary] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Authentication check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Fetch article metadata only (strict hiding: text is not loaded)
  useEffect(() => {
    if (!idToken || !articleId) return;

    const fetchMeta = async () => {
      try {
        const res = await fetch(`/api/articles/${articleId}?metadataOnly=true`, {
          headers: { Authorization: `Bearer ${idToken}` },
        });
        if (!res.ok) throw new Error('Failed to load article details');
        const data = await res.json();
        setMetadata(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading details');
      }
    };

    fetchMeta();
  }, [idToken, articleId]);

  const wordCount = countWords(summary);
  const canSubmit = wordCount >= SUMMARY_MIN_WORDS && !submitting;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!canSubmit || !idToken) return;

    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          articleId,
          summary,
          section: sectionTitle,
          retryOf,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || 'Evaluation failed. Please try again.');
      }

      const data = await res.json();
      router.push(`/results/${data.attemptId}`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Evaluation failed');
      setSubmitting(false);
    }
  };

  if (loading || (!metadata && !error)) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-900 border-t-transparent" />
        <p className="text-sm text-slate-500">Loading recall session...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6">
      {/* Header */}
      <div className="mb-8 pb-6 border-b border-slate-200/80">
        <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
          <Brain className="h-4 w-4" />
          <span>Active Recall Phase</span>
          {retryOf && (
            <span className="ml-2 rounded-md bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-800">
              Revision Session
            </span>
          )}
        </div>

        <h1 className="mt-2 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Summarize &apos;{metadata?.title}&apos;
        </h1>

        {sectionTitle && (
          <p className="mt-1 text-sm text-slate-600">
            Target section: <span className="text-indigo-600 font-semibold">{sectionTitle}</span>
          </p>
        )}

        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          The source text is now hidden. In your own words, synthesize the core thesis, supporting arguments, and practical significance.
        </p>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 flex items-center gap-3 rounded-2xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          <AlertCircle className="h-5 w-5 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-6">
        <SummaryEditor
          value={summary}
          onChange={setSummary}
          disabled={submitting}
        />

        <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-2">
          <p className="text-xs text-slate-500 max-w-md">
            Instant 1–10 multidimensional evaluation evaluated by Jev with streamed AI tutor coaching.
          </p>

          <button
            type="submit"
            disabled={!canSubmit}
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold transition shadow-sm ${
              canSubmit
                ? 'bg-slate-900 text-white hover:bg-slate-800 cursor-pointer'
                : 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
            }`}
          >
            {submitting ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Evaluating with Jev...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>Submit Recall Summary</span>
                <ArrowRight className="h-4 w-4" />
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
