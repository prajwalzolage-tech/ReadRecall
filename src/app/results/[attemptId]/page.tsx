// src/app/results/[attemptId]/page.tsx
// Comprehensive results view with score reveal, delta comparison, streamed feedback, and reveal view

'use client';

import React, { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { RatingDisplay } from '@/components/rating-display';
import { FeedbackStream } from '@/components/feedback-stream';
import { RevealView } from '@/components/reveal-view';
import { computeDelta } from '@/lib/rating';
import { ArrowLeft, TrendingUp, Sparkles, BookOpen } from 'lucide-react';
import type { Attempt, Article } from '@/types';

interface PageProps {
  params: Promise<{ attemptId: string }>;
}

export default function ResultsPage({ params }: PageProps) {
  const { attemptId } = use(params);
  const router = useRouter();
  const { user, loading, idToken } = useAuth();

  const [attempt, setAttempt] = useState<Attempt | null>(null);
  const [originalAttempt, setOriginalAttempt] = useState<Attempt | null>(null);
  const [article, setArticle] = useState<Article | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    if (!attemptId) return;

    const loadData = async () => {
      setFetching(true);
      setError(null);
      try {
        // 1. Fetch current attempt (try server first if token available)
        let attemptData: Attempt | null = null;
        if (idToken) {
          try {
            const attemptRes = await fetch(`/api/attempts/${attemptId}`, {
              headers: { Authorization: `Bearer ${idToken}` },
            });
            if (attemptRes.ok) {
              attemptData = await attemptRes.json();
            }
          } catch {
            // ignore network failure, fallback to client storage
          }
        }

        // 2. Client-side resilience fallback for serverless environments
        if (!attemptData) {
          try {
            const cached =
              sessionStorage.getItem(`readrecall_attempt_${attemptId}`) ||
              sessionStorage.getItem('readrecall_current_attempt');
            if (cached) {
              const parsed = JSON.parse(cached);
              if (parsed.id === attemptId) {
                attemptData = parsed;
              }
            }
            if (!attemptData) {
              const all = JSON.parse(
                localStorage.getItem('readrecall_user_attempts') || '[]'
              );
              attemptData =
                all.find((a: any) => a.id === attemptId) || null;
            }
          } catch {
            // ignore storage failure
          }
        }

        if (!attemptData) {
          throw new Error('Attempt not found');
        }

        setAttempt(attemptData);

        // 3. Re-sync to server in background if recovered from client storage
        if (idToken) {
          fetch('/api/attempts', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${idToken}`,
            },
            body: JSON.stringify(attemptData),
          }).catch(() => null);
        }

        // 4. Fetch article
        const articleHeaders: Record<string, string> = {};
        if (idToken) articleHeaders['Authorization'] = `Bearer ${idToken}`;
        const articleRes = await fetch(`/api/articles/${attemptData.articleId}`, {
          headers: articleHeaders,
        });
        if (articleRes.ok) {
          const articleData: Article = await articleRes.json();
          setArticle(articleData);
        }

        // 5. If retry, fetch original attempt for improvement delta
        if (attemptData.retryOf) {
          try {
            let origData: Attempt | null = null;
            if (idToken) {
              const originalRes = await fetch(
                `/api/attempts/${attemptData.retryOf}`,
                {
                  headers: { Authorization: `Bearer ${idToken}` },
                }
              );
              if (originalRes.ok) {
                origData = await originalRes.json();
              }
            }
            if (!origData) {
              const all = JSON.parse(
                localStorage.getItem('readrecall_user_attempts') || '[]'
              );
              origData =
                all.find((a: any) => a.id === attemptData.retryOf) || null;
            }
            if (origData) setOriginalAttempt(origData);
          } catch {
            // ignore
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error loading results');
      } finally {
        setFetching(false);
      }
    };

    loadData();
  }, [idToken, attemptId]);

  if (loading || fetching) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-3">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-indigo-500 border-t-transparent" />
        <p className="text-slate-400">Loading evaluation results...</p>
      </div>
    );
  }

  if (error || !attempt) {
    return (
      <div className="mx-auto max-w-xl px-4 py-16 text-center">
        <div className="rounded-xl border border-rose-800/40 bg-rose-950/20 p-6 text-rose-300">
          {error || 'Attempt could not be found'}
        </div>
        <button
          onClick={() => router.push('/')}
          className="mt-6 rounded-lg bg-slate-800 px-4 py-2 text-sm text-white"
        >
          Return Home
        </button>
      </div>
    );
  }

  const delta = originalAttempt ? computeDelta(originalAttempt, attempt) : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200/80">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900 transition"
        >
          <ArrowLeft className="h-4 w-4 text-slate-500" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push('/profile')}
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
            Learning Profile & Analytics
          </button>
        </div>
      </div>

      {/* Delta Banner for Retries */}
      {delta && (
        <div className="flex items-center gap-3.5 rounded-2xl border border-emerald-200 bg-emerald-50/80 p-4.5 text-emerald-900 shadow-sm">
          <Sparkles className="h-5 w-5 text-emerald-600 shrink-0" />
          <div className="text-xs sm:text-sm leading-relaxed">
            <span className="font-bold">
              Revision Improvement: {delta.ratingDelta >= 0 ? `+${delta.ratingDelta}` : delta.ratingDelta} Rating Points!
            </span>{' '}
            Coverage shifted by {delta.dimensionDeltas.coverage >= 0 ? `+` : ''}
            {Math.round(delta.dimensionDeltas.coverage * 100)}% and factual faithfulness by{' '}
            {delta.dimensionDeltas.faithfulness >= 0 ? `+` : ''}
            {Math.round(delta.dimensionDeltas.faithfulness * 100)}%.
          </div>
        </div>
      )}

      {/* 1. Rating & Dimension Breakdown Display */}
      <RatingDisplay
        rating={attempt.rating}
        dimensionScores={attempt.dimensionScores}
        guards={attempt.guards}
        flags={attempt.flags}
      />

      {/* 2. Streamed AI Tutor Coaching Feedback */}
      {idToken && (
        <FeedbackStream
          articleId={attempt.articleId}
          summary={attempt.summary || ''}
          jevResults={(attempt as any).jevResults || {}}
          rating={attempt.rating}
          idToken={idToken}
        />
      )}

      {/* 3. Reveal View & Revise Option */}
      {article && (
        <RevealView
          articleTitle={article.title}
          articleText={article.text}
          keyPoints={article.keyPoints}
          jevResults={(attempt as any).jevResults}
          onRetry={() => router.push(`/write/${article.id}?retry=${attempt.id}`)}
        />
      )}

      {/* Bottom Actions */}
      <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-200/80">
        <button
          onClick={() => router.push('/')}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-700 shadow-sm hover:bg-slate-50 transition"
        >
          <BookOpen className="h-4 w-4 text-slate-500" />
          Choose Another Paper
        </button>

        {article && (
          <button
            onClick={() => router.push(`/read/${article.id}`)}
            className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
          >
            Re-read Article from Start
          </button>
        )}
      </div>
    </div>
  );
}
