// src/app/read/[articleId]/page.tsx
// Timed reading view: supports multi-part section picker for long papers & timed reading session
// Engagement monitoring window is ALWAYS visible during reading — user can toggle camera on/off.

'use client';

import React, { useEffect, useState, use, useCallback } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ReadingTimer } from '@/components/reading-timer';
import { SectionPicker } from '@/components/section-picker';
import { DocumentReader } from '@/components/document-reader';
import { WebcamEngagementMonitor } from '@/components/webcam-engagement-monitor';
import { useTimer } from '@/hooks/use-timer';
import { useEngagement } from '@/hooks/useEngagement';
import { WORDS_PER_MINUTE, TIMER_BUFFER_SECONDS } from '@/lib/constants';
import {
  BookOpen,
  ShieldAlert,
  ArrowRight,
  ArrowLeft,
  Layers,
  Sparkles,
  Trash2,
  Loader2,
  AlertTriangle,
} from 'lucide-react';
import type { Article, Section } from '@/types';

interface PageProps {
  params: Promise<{ articleId: string }>;
}

function computeReadingDuration(wordCount: number): number {
  return Math.max(
    30,
    Math.ceil((wordCount / WORDS_PER_MINUTE) * 60) + TIMER_BUFFER_SECONDS
  );
}

export default function ReadPage({ params }: PageProps) {
  const { articleId } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const urlSectionTitle = searchParams.get('section');

  const { user, loading, idToken } = useAuth();
  const [article, setArticle] = useState<Article | null>(null);
  const [activeSection, setActiveSection] = useState<Section | null>(null);
  const [selectedSectionTitle, setSelectedSectionTitle] = useState<string | null>(null);
  const [isSelectingSection, setIsSelectingSection] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isNavigating, setIsNavigating] = useState(false);

  const [readingDuration, setReadingDuration] = useState(105);

  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);

  // Camera toggle — user can turn camera on/off but the monitor window always stays
  const [cameraOn, setCameraOn] = useState(true);

  // Screen size detection for responsive monitor default
  const [isMobileScreen, setIsMobileScreen] = useState(false);
  useEffect(() => {
    const checkMobile = () => {
      setIsMobileScreen(window.innerWidth < 1024);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const isOwner = Boolean(
    article &&
      article.source !== 'curated' &&
      (article.createdBy === user?.uid || !article.createdBy || article.createdBy === 'user')
  );

  const handleDeleteArticle = async () => {
    if (!articleId) return;
    setIsDeleting(true);
    setDeleteError(null);
    try {
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
      const res = await fetch(`/api/articles/${articleId}`, {
        method: 'DELETE',
        headers,
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete article');
      }
      router.push('/');
    } catch (err: any) {
      setDeleteError(err.message || 'Error deleting article');
      setIsDeleting(false);
    }
  };

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
        const headers: Record<string, string> = {};
        if (idToken) headers['Authorization'] = `Bearer ${idToken}`;
        const res = await fetch(`/api/articles/${articleId}`, { headers });
        if (!res.ok) {
          throw new Error('Failed to load article');
        }
        const data = await res.json();
        if (!isCancelled) {
          setArticle(data);

          const hasMultipleSections =
            Array.isArray(data.sections) && data.sections.length > 1;

          if (hasMultipleSections) {
            if (urlSectionTitle && urlSectionTitle !== 'all' && urlSectionTitle !== 'full') {
              // Section specified in URL
              const matched = data.sections.find(
                (s: Section) => s.title === urlSectionTitle
              );
              if (matched) {
                setActiveSection(matched);
                setSelectedSectionTitle(matched.title);
                setIsSelectingSection(false);
                setReadingDuration(computeReadingDuration(matched.wordCount));
              } else {
                // If not found, show section picker
                setIsSelectingSection(true);
                setSelectedSectionTitle(data.sections[0]?.title || null);
              }
            } else if (urlSectionTitle === 'all' || urlSectionTitle === 'full') {
              // User explicitly requested full paper
              setActiveSection(null);
              setIsSelectingSection(false);
              setReadingDuration(computeReadingDuration(data.wordCount ?? 300));
            } else {
              // No section specified -> Present the Section Picker!
              setIsSelectingSection(true);
              const defaultSec =
                data.sections.find((s: Section) => s.isDefault) || data.sections[0];
              setSelectedSectionTitle(defaultSec?.title || null);
            }
          } else {
            // Single section or short article -> proceed straight to reading
            setActiveSection(null);
            setIsSelectingSection(false);
            setReadingDuration(computeReadingDuration(data.wordCount ?? 300));
          }
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
  }, [articleId, urlSectionTitle, idToken, loading]);

  // Reading is active when not fetching, article loaded, and not selecting section
  const isReadingActive = !fetching && !!article && !isSelectingSection;

  // Engagement hook — active when reading is active AND camera is on
  const {
    videoRef: engagementVideoRef,
    status: engagementStatus,
    current: engagementCurrent,
    getSummary: getEngagementSummary,
  } = useEngagement(cameraOn && isReadingActive);

  const handleFinishReading = useCallback(() => {
    if (isNavigating) return;
    setIsNavigating(true);

    // Capture engagement summary before navigating
    try {
      const summary = getEngagementSummary();
      sessionStorage.setItem('readrecall_engagement_summary', JSON.stringify(summary));
    } catch {
      // ignore storage errors
    }

    const targetTitle = activeSection?.title || urlSectionTitle;
    const query = targetTitle && targetTitle !== 'all' && targetTitle !== 'full'
      ? `?section=${encodeURIComponent(targetTitle)}`
      : '';
    router.push(`/write/${articleId}${query}`);
  }, [articleId, activeSection, urlSectionTitle, router, isNavigating, getEngagementSummary]);

  const timer = useTimer({
    totalSeconds: readingDuration,
    autoStart: isReadingActive,
    onExpire: handleFinishReading,
  });

  // Start reading a specific selected section
  const handleStartReadingSection = (titleToStart?: string) => {
    if (!article || !article.sections) return;
    const title = titleToStart || selectedSectionTitle || article.sections[0]?.title;
    const matched = article.sections.find((s: Section) => s.title === title) || article.sections[0];
    if (matched) {
      setActiveSection(matched);
      setSelectedSectionTitle(matched.title);
      setIsSelectingSection(false);
      const dur = computeReadingDuration(matched.wordCount);
      setReadingDuration(dur);
      timer.reset(dur);
      router.replace(`/read/${articleId}?section=${encodeURIComponent(matched.title)}`);
    }
  };

  // Start reading entire paper at once
  const handleStartFullPaper = () => {
    if (!article) return;
    setActiveSection(null);
    setIsSelectingSection(false);
    const dur = computeReadingDuration(article.wordCount);
    setReadingDuration(dur);
    timer.reset(dur);
    router.replace(`/read/${articleId}?section=full`);
  };

  // Switch back to the section picker
  const handleBackToSectionPicker = () => {
    timer.pause();
    setIsSelectingSection(true);
    router.replace(`/read/${articleId}`);
  };

  // Guard against copying
  const handleCopyPrevent = (e: React.ClipboardEvent) => {
    e.preventDefault();
  };

  // Toggle camera on/off
  const handleToggleCamera = () => {
    setCameraOn((prev) => !prev);
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

  // MULTI-PART SECTION PICKER SCREEN
  if (isSelectingSection && article.sections && article.sections.length > 1) {
    const activeSelectedSection =
      article.sections.find((s) => s.title === selectedSectionTitle) ||
      article.sections[0];

    return (
      <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 space-y-8">
        {/* Navigation / Header */}
        <div className="pb-6 border-b border-slate-200/80">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => router.push('/')}
              className="inline-flex items-center gap-2 text-xs font-semibold text-slate-500 hover:text-slate-800 transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Library</span>
            </button>

            {isOwner && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition"
                title="Delete this custom document"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete Document</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-600">
            <Layers className="h-4 w-4" />
            <span>Multi-Part Research Paper ({article.sections.length} Parts)</span>
          </div>

          <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
            {article.title}
          </h1>

          {article.authors && article.authors.length > 0 && (
            <p className="mt-1 text-xs text-slate-500">
              By {article.authors.join(', ')} {article.year ? `(${article.year})` : ''}
            </p>
          )}

          <p className="mt-3 text-sm text-slate-600 max-w-2xl leading-relaxed">
            This paper is <strong>{article.wordCount} words</strong> long. For peak cognitive retention, the system divided it into <strong>{article.sections.length} manageable parts</strong>. Pick a part below to begin your focused timed reading session.
          </p>
        </div>

        {/* Section Picker Card */}
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <SectionPicker
            sections={article.sections}
            selectedSection={selectedSectionTitle}
            onSelectSection={(title) => setSelectedSectionTitle(title)}
          />

          {/* Action Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-6 border-t border-slate-100">
            <button
              onClick={handleStartFullPaper}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 hover:text-slate-900 transition"
            >
              <span>Read Full Paper at Once ({article.wordCount} words)</span>
            </button>

            <button
              onClick={() => handleStartReadingSection()}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition"
            >
              <span>
                Start Reading {activeSelectedSection?.title || 'Selected Part'}
              </span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>

        {/* Delete Confirmation Modal for Multi-part Screen */}
        {showDeleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
            <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
              <div className="flex items-center gap-2.5 text-rose-600 font-bold text-base">
                <AlertTriangle className="h-5 w-5" />
                <span>Delete Document</span>
              </div>
              <p className="text-sm text-slate-600 leading-relaxed">
                Are you sure you want to permanently delete <strong className="text-slate-900">&ldquo;{article.title}&rdquo;</strong>? You will no longer be able to practice active recall on this material.
              </p>
              {deleteError && (
                <p className="text-xs text-rose-600 font-semibold">{deleteError}</p>
              )}
              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setDeleteError(null);
                  }}
                  className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleDeleteArticle}
                  className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Deleting...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="h-3.5 w-3.5" />
                      <span>Delete Document</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // ACTIVE READING SESSION SCREEN
  const displayText = activeSection ? activeSection.text : article.text;
  const displayTitle = activeSection
    ? `${article.title} — ${activeSection.title}`
    : article.title;
  const targetWordCount = activeSection
    ? activeSection.wordCount
    : article.wordCount;



  // Helper to render article content
  const renderArticle = () => (
    <article
      onCopy={handleCopyPrevent}
      onContextMenu={(e) => e.preventDefault()}
      className="rounded-3xl border border-slate-200/90 bg-white p-4 sm:p-8 lg:p-10 text-slate-800 shadow-sm leading-relaxed font-serif text-base sm:text-lg selection:bg-indigo-50"
    >
      <header className="mb-6 sm:mb-8 border-b border-slate-100 pb-5 sm:pb-6 font-sans">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold tracking-tight text-slate-900 font-sans">
            {article.title}
          </h1>
          <div className="flex items-center gap-2 shrink-0 self-start sm:self-auto">
            {isOwner && (
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-500 hover:text-rose-600 hover:border-rose-200 hover:bg-rose-50 transition font-sans"
                title="Delete this custom document"
              >
                <Trash2 className="h-3.5 w-3.5" />
                <span>Delete</span>
              </button>
            )}
            {article.sections && article.sections.length > 1 && (
              <button
                onClick={handleBackToSectionPicker}
                className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1 text-xs font-semibold text-slate-700 shadow-2xs hover:bg-slate-50 transition font-sans"
              >
                <Layers className="h-3.5 w-3.5 text-indigo-600" />
                <span>All Parts</span>
              </button>
            )}
          </div>
        </div>
        {activeSection && (
          <div className="mt-2.5 inline-flex flex-wrap items-center gap-2 rounded-md bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-700 border border-indigo-200/60 font-sans">
            <Sparkles className="h-3 w-3 shrink-0" />
            <span>Current Section: {activeSection.title} ({activeSection.wordCount} words)</span>
          </div>
        )}
        {article.authors && article.authors.length > 0 && (
          <p className="mt-2 text-xs text-slate-500 font-sans">
            By {article.authors.join(', ')} {article.year ? `(${article.year})` : ''}
          </p>
        )}
      </header>

      <DocumentReader
        content={displayText}
        title={article.title}
        sectionTitle={activeSection?.title}
      />
    </article>
  );

  return (
    <div className="mx-auto max-w-7xl px-3 sm:px-6 lg:px-8 py-5 sm:py-8 select-none transition-all duration-300 pb-20 lg:pb-8">
      {/* Delete Confirmation Modal for Active Reading Screen */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center gap-2.5 text-rose-600 font-bold text-base">
              <AlertTriangle className="h-5 w-5" />
              <span>Delete Document</span>
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">
              Are you sure you want to permanently delete <strong className="text-slate-900">&ldquo;{article.title}&rdquo;</strong>? You will no longer be able to practice active recall on this material.
            </p>
            {deleteError && (
              <p className="text-xs text-rose-600 font-semibold">{deleteError}</p>
            )}
            <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeleteError(null);
                }}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={handleDeleteArticle}
                className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-3.5 w-3.5" />
                    <span>Delete Document</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Expiry / completion transition overlay */}
      {isNavigating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-xs p-4">
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-xl text-center max-w-sm">
            <div className="h-7 w-7 animate-spin rounded-full border-3 border-slate-900 border-t-transparent" />
            <p className="text-base font-semibold text-slate-900">
              Time is up! Opening summary page...
            </p>
            <p className="text-xs text-slate-500">
              Prepare to summarize key concepts from memory.
            </p>
          </div>
        </div>
      )}

      {/* 2-COLUMN LAYOUT on desktop / stacked with compact monitor on mobile */}
      <div className="lg:grid lg:grid-cols-12 lg:gap-8 items-start">
        {/* Left Column: Live Webcam Monitor Card (Sticky on desktop, smart compact on mobile) */}
        <div className="lg:col-span-5 xl:col-span-4 mb-5 lg:mb-0 lg:sticky lg:top-24">
          <WebcamEngagementMonitor
            key={`monitor-${isMobileScreen ? 'mobile' : 'desktop'}`}
            videoRef={engagementVideoRef}
            status={engagementStatus}
            current={engagementCurrent}
            articleTitle={displayTitle}
            category={activeSection ? `SECTION: ${activeSection.title}` : 'ACTIVE RECALL SESSION'}
            timeLeft={timer.timeLeft}
            totalDuration={readingDuration}
            cameraOn={cameraOn}
            onToggleCamera={handleToggleCamera}
            onFinishEarly={timer.finish}
            defaultMinimized={isMobileScreen}
          />
        </div>

        {/* Right Column: Reading Document & Quiz Actions */}
        <div className="lg:col-span-7 xl:col-span-8 space-y-5 sm:space-y-6">
          {/* Top article actions / parts picker */}
          <div className="flex items-center justify-between gap-3 border-b border-slate-200/80 pb-3">
            <div className="text-xs text-slate-500 font-medium">
              <span>{targetWordCount} words</span>
              <span className="mx-2">•</span>
              <span>~{Math.ceil(readingDuration / 60)} min read</span>
            </div>
            {article.sections && article.sections.length > 1 && (
              <button
                onClick={handleBackToSectionPicker}
                className="text-xs text-indigo-600 hover:text-indigo-800 font-semibold underline underline-offset-2"
              >
                Switch Part ({article.sections.length} total)
              </button>
            )}
          </div>

          {/* Gentle educational disclaimer */}
          <div className="flex items-start gap-3 rounded-2xl border border-amber-200/80 bg-amber-50/70 p-3.5 sm:p-4 text-xs text-amber-900 leading-relaxed">
            <ShieldAlert className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
            <div>
              <span className="font-semibold">Active Recall Training:</span> When time runs out, the text will be hidden and you&apos;ll summarize key concepts from memory. Text copying is disabled to stimulate genuine cognitive retention.
            </div>
          </div>

          {/* Article Content Area */}
          {renderArticle()}

          {/* Bottom Action: Big green Quiz / Summary button */}
          <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 sm:gap-4 pt-4 border-t border-slate-100">
            {article.sections && article.sections.length > 1 ? (
              <button
                onClick={handleBackToSectionPicker}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-5 py-3 text-sm font-semibold text-slate-700 shadow-xs hover:bg-slate-50 transition"
              >
                <Layers className="h-4 w-4 text-slate-500" />
                <span>Choose Another Part</span>
              </button>
            ) : (
              <div />
            )}

            <button
              onClick={timer.finish}
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 sm:px-8 py-3.5 font-bold text-white shadow-md hover:shadow-lg transition active:scale-[0.99] text-sm"
            >
              <span>Finished Reading — Take Recall Quiz →</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Floating Bottom Bar for Fast Quiz Access on Phone */}
      <div className="lg:hidden fixed bottom-4 inset-x-3 z-30 pointer-events-none">
        <div className="mx-auto max-w-md rounded-2xl bg-slate-900/95 backdrop-blur-md p-2 shadow-xl border border-slate-800 flex items-center justify-between gap-2.5 pointer-events-auto">
          <div className="flex items-center gap-1.5 pl-2.5 text-white text-xs font-mono">
            <span className="text-slate-400">Time:</span>
            <span className="font-bold">{Math.floor(timer.timeLeft / 60)}:{(timer.timeLeft % 60).toString().padStart(2, '0')}</span>
          </div>
          <button
            onClick={timer.finish}
            className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95"
          >
            <span>Take Recall Quiz →</span>
          </button>
        </div>
      </div>
    </div>
  );
}
