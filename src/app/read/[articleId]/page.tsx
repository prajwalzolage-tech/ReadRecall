// src/app/read/[articleId]/page.tsx
// Timed reading view: presents article with countdown timer, anti-copy guards, and hide transition

'use client';

import React, { useEffect, useState, use, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ReadingTimer } from '@/components/reading-timer';
import { useTimer } from '@/hooks/use-timer';
import { WORDS_PER_MINUTE, TIMER_BUFFER_SECONDS } from '@/lib/constants';
import { BookOpen, ShieldAlert, ArrowRight } from 'lucide-react';
import type { Article, Section } from '@/types';

interface PageProps {
  params: Promise<{ articleId: string }>;
}

function computeReadingDuration(wordCount: number): number {
  return Math.max(30, Math.ceil((wordCount / WORDS_PER_MINUTE) * 60) + TIMER_BUFFER_SECONDS);
}

export default function ReadPage({ params }: PageProps) {
  const { articleId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const sectionTitle = searchParams.get('section');

  const { user, loading, idToken } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  // Compute reading duration based on actual article data
  // Use a stable value: only compute once when article loads
  const [readingDuration, setReadingDuration] = useState(105); // default ~1:45 for 300 words

  // Authentication check
  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  // Fetch article after auth loads
  useEffect(() => {
    if (!articleId || loading) return;

    let isCancelled = false;
    const fetchArticle = async () => {
      setFetching(true);
      setError(null);
      try {
        // Don't require auth for reading articles (articles route is public)
        const headers: Record<string, string> = {};
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
        const res = await fetch(`/api/articles/${articleId}`, { headers });
        if (!res.ok) {
          throw new Error('Failed to load article');
        }
        const data = await res.json();
        if (!isCancelled) {
          setArticle(data);

          // Set reading duration once based on actual word count
          let targetWords = data.wordCount ?? 300;
          let matchedSection: Section | null = null;

          if (sectionTitle && data.sections) {
            matchedSection = data.sections.find((s: Section) => s.title === sectionTitle) || null;
            if (matchedSection) {
              setActiveSection(matchedSection);
              targetWords = matchedSection.wordCount;
            }
          }

          setReadingDuration(computeReadingDuration(targetWords));
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Error fetching article');
        }
      } finally {
        if (!isCancelled) {
          setFetching(false);
        }
      }
    };

    fetchArticle();

    return () => {
      isCancelled = true;
    };
  }, [articleId, sectionTitle, idToken, loading]);

  const handleFinishReading = useCallback(() => {
    if (isNavigating) return; // prevent double navigation
    setIsNavigating(true);
    // Navigate to write page. DO NOT store article text anywhere.
    const query = sectionTitle ? `?section=${encodeURIComponent(sectionTitle)}` : '';
    router.push(`/write/${articleId}${query}`);
  }, [articleId, sectionTitle, router, isNavigating]);

  const timer = useTimer({
    totalSeconds: readingDuration,
    autoStart: !fetching && !!article,
    onExpire: handleFinishReading,
  });

  // Guard against copying
  const handleCopyPrevent = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  if (loading || fetching) {
    return (
      <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4">
        <div className="h-8 w-8 animate-spin rounded-full border-3 border-slate-900 border-t-transparent" />
        <p className="text-sm text-slate-500">Preparing reading session...</p>
      </div>
    );
  }

  if (error || !article) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-16 text-center">
        <div className="rounded-2xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700">
          {error || 'Article not found.'}
        </div>
        <button
          onClick={() => router.push('/')}
          className="mt-6 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
        >
          Return to Articles
        </button>
      </div>
    );
  }

  const displayText = activeSection ? activeSection.text : article.text;
  const displayTitle = activeSection ? `${article.title} — ${activeSection.title}` : article.title;
  const targetWordCount = activeSection ? activeSection.wordCount : article.wordCount;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 select-none">
      {/* Expiry / completion transition overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl text-center">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-slate-900 border-t-transparent" />
            <p className="text-base font-semibold text-slate-900">Time is up! Opening summary page...</p>
            <p className="text-xs text-slate-500">Prepare to summarize key concepts from memory.</p>
          </div>
        </div>
      )}
      {/* Top sticky bar with timer */}
      <div className="sticky top-20 z-20 mb-8 flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-slate-200/90 bg-white/90 p-4 backdrop-blur-md shadow-sm">
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-slate-700">
            <BookOpen className="h-4 w-4" />
          </div>
          <div>
            <h1 className="text-sm font-semibold text-slate-900 line-clamp-1 max-w-[280px] sm:max-w-md">
              {displayTitle}
            </h1>
            <span className="text-xs text-slate-500 font-medium">
              {targetWordCount} words • ~{Math.ceil(readingDuration / 60)} min read
            </span>
          </div>
        </div>

        <ReadingTimer
          timeLeft={timer.timeLeft}
          totalDuration={readingDuration}
          onFinishEarly={timer.finish}
        />
      </div>

      {/* Gentle educational disclaimer */}
      <div className="mb-6 flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-4 text-xs text-amber-900 leading-relaxed">
        <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
        <div>
          <span className="font-semibold">Active Recall Training:</span> When time runs out, the text will be hidden and you&apos;ll summarize key concepts from memory. Text copying is disabled to stimulate genuine cognitive retention.
        </div>
      </div>

      {/* Article Content Area */}
      <article
        onCopy={handleCopyPrevent}
        onContextMenu={(e) => e.preventDefault()}
        className="rounded-2xl border border-slate-200/90 bg-white p-8 sm:p-12 text-slate-800 shadow-sm leading-relaxed font-serif text-lg selection:bg-indigo-50"
      >
        <header className="mb-8 border-b border-slate-100 pb-6 font-sans">
          <h1 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl font-sans">
            {article.title}
          </h1>
          {activeSection && (
            <p className="mt-2 text-indigo-600 font-medium text-sm">
              Section: {activeSection.title}
            </p>
          )}
          {article.authors && article.authors.length > 0 && (
            <p className="mt-2 text-xs text-slate-500 font-sans">
              By {article.authors.join(', ')} {article.year ? `(${article.year})` : ''}
            </p>
          )}
        </header>

        <div className="space-y-6 whitespace-pre-line text-slate-800 text-justify font-serif">
          {displayText}
        </div>
      </article>

      {/* Bottom Action */}
      <div className="mt-8 flex justify-end">
        <button
          onClick={timer.finish}
          className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-sm hover:bg-slate-800 transition"
        >
          Finished Reading — Write Summary
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
