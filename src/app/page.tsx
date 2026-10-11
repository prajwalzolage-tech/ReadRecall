'use client';

// src/app/page.tsx
// Home page: Article picker grid showing curated articles + adaptive recommendation

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { ArticleCard } from '@/components/article-card';
import { pickRecommendedArticle, RecommendationResult } from '@/lib/suggestion';
import { Sparkles, ArrowRight, Upload, Search } from 'lucide-react';
import type { ArticleListItem, Attempt } from '@/types';
import Link from 'next/link';

export default function HomePage() {
  const { user, loading, idToken } = useAuth();
  const router = useRouter();
  const [articles, setArticles] = useState<ArticleListItem[]>([]);
  const [filterTab, setFilterTab] = useState<'all' | 'curated' | 'uploads'>('all');
  const [deletedNotification, setDeletedNotification] = useState<string | null>(null);
  const [recommendation, setRecommendation] = useState<RecommendationResult | null>(null);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleDeleteArticle = (deletedId: string) => {
    setArticles((prev) => prev.filter((a) => a.id !== deletedId));
    setDeletedNotification('Document deleted successfully.');
    setTimeout(() => {
      setDeletedNotification(null);
    }, 3500);
  };

  const curatedCount = articles.filter((a) => a.source === 'curated').length;
  const uploadCount = articles.filter((a) => a.source !== 'curated').length;

  const displayedArticles = articles.filter((a) => {
    if (filterTab === 'curated') return a.source === 'curated';
    if (filterTab === 'uploads') return a.source !== 'curated';
    return true;
  });

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  useEffect(() => {
    let isCancelled = false;

    const fetchData = async () => {
      setFetching(true);
      setError(null);
      try {
        const headers: Record<string, string> = {};
        if (idToken) {
          headers['Authorization'] = `Bearer ${idToken}`;
        }

        const [articlesRes, attemptsRes] = await Promise.all([
          fetch('/api/articles', { headers }),
          idToken
            ? fetch('/api/attempts', { headers }).catch(() => null)
            : Promise.resolve(null),
        ]);

        if (!articlesRes.ok) {
          const errData = await articlesRes.json().catch(() => null);
          throw new Error(
            errData?.error || `Failed to fetch articles (${articlesRes.status})`
          );
        }

        const articlesData = await articlesRes.json();
        const loadedArticles: ArticleListItem[] = articlesData.articles || [];
        if (!isCancelled) {
          setArticles(loadedArticles);
        }

        let recentAttempts: Attempt[] = [];
        if (attemptsRes && attemptsRes.ok) {
          const attemptsData = await attemptsRes.json().catch(() => null);
          recentAttempts = attemptsData?.attempts || [];
        }
        try {
          const local = JSON.parse(
            localStorage.getItem('readrecall_user_attempts') || '[]'
          );
          const ids = new Set(recentAttempts.map((a) => a.id));
          for (const item of local) {
            if (item.id && !ids.has(item.id)) {
              recentAttempts.push(item);
              ids.add(item.id);
            }
          }
        } catch {
          // ignore
        }

        if (!isCancelled && loadedArticles.length > 0) {
          const rec = pickRecommendedArticle(loadedArticles, recentAttempts);
          setRecommendation(rec);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(err instanceof Error ? err.message : 'Unknown error');
        }
      } finally {
        if (!isCancelled) {
          setFetching(false);
        }
      }
    };

    fetchData();

    return () => {
      isCancelled = true;
    };
  }, [idToken]);

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="animate-pulse text-lg text-slate-400">Loading ReadRecall...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      {/* Hero Header */}
      <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-slate-200/80">
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-indigo-600">
            Active Recall & Reading Comprehension
          </span>
          <h1 className="mt-1 text-3xl font-bold tracking-tight text-slate-900 sm:text-4xl">
            Choose an Article
          </h1>
          <p className="mt-2 text-sm text-slate-600 max-w-xl leading-relaxed">
            Read a timed technical paper, then write a summary purely from memory.
            Evaluated against key ideas by Jev with instant streamed coaching.
          </p>
        </div>

        {/* Quick Actions */}
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          <Link
            href="/upload"
            className="inline-flex flex-1 md:flex-none justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <Upload className="h-4 w-4 text-slate-500" />
            Upload PDF / Doc
          </Link>
          <Link
            href="/search"
            className="inline-flex flex-1 md:flex-none justify-center items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 hover:text-slate-900 transition"
          >
            <Search className="h-4 w-4 text-slate-500" />
            Search arXiv
          </Link>
        </div>
      </div>

      {/* Adaptive Recommendation Card */}
      {recommendation?.recommendedArticle && !fetching && (
        <div className="mb-10 rounded-2xl border border-indigo-100 bg-gradient-to-r from-indigo-50/60 via-purple-50/30 to-white p-6 shadow-sm">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1.5 rounded-full border border-indigo-200 bg-indigo-50 px-3 py-0.5 text-xs font-semibold text-indigo-700">
                  <Sparkles className="h-3.5 w-3.5 text-indigo-600" />
                  Recommended Next ({recommendation.difficulty.toUpperCase()})
                </span>
                <span className="text-xs text-slate-500 font-medium">
                  {recommendation.recommendedArticle.wordCount} words
                </span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 pt-1 tracking-tight">
                {recommendation.recommendedArticle.title}
              </h2>
              <p className="text-xs text-slate-600 max-w-2xl leading-relaxed">
                {recommendation.reason}
              </p>
            </div>

            <button
              onClick={() =>
                router.push(`/read/${recommendation.recommendedArticle!.id}`)
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-slate-800 transition shrink-0"
            >
              Start Session
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mb-6 rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-700">
          {error}
        </div>
      )}

      {/* Loading skeleton */}
      {fetching && (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div
              key={i}
              className="h-40 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      )}

      {/* Delete Feedback Notification */}
      {deletedNotification && (
        <div className="mb-6 flex items-center justify-between rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-xs font-semibold text-emerald-800 animate-in fade-in slide-in-from-top-2">
          <span>{deletedNotification}</span>
          <button
            onClick={() => setDeletedNotification(null)}
            className="text-emerald-700 hover:text-emerald-900"
          >
            ✕
          </button>
        </div>
      )}

      {/* Articles Filter Tabs & Grid */}
      {!fetching && articles.length > 0 && (
        <div className="space-y-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-slate-200/80 pb-4">
            {/* Filter Tabs */}
            <div className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50/80 p-1 text-xs">
              <button
                type="button"
                onClick={() => setFilterTab('all')}
                className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${
                  filterTab === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All Papers ({articles.length})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('curated')}
                className={`rounded-lg px-3.5 py-1.5 font-semibold transition ${
                  filterTab === 'curated'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Curated ({curatedCount})
              </button>

              <button
                type="button"
                onClick={() => setFilterTab('uploads')}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 font-semibold transition ${
                  filterTab === 'uploads'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <span>My Uploads</span>
                <span className="rounded-full bg-indigo-50 border border-indigo-100 px-1.5 py-0.2 text-[10px] text-indigo-700 font-bold">
                  {uploadCount}
                </span>
              </button>
            </div>

            <span className="text-xs text-slate-500">
              Select any paper to begin timed reading
            </span>
          </div>

          {displayedArticles.length > 0 ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {displayedArticles.map((article) => (
                <ArticleCard
                  key={article.id}
                  article={article}
                  currentUserId={user?.uid}
                  idToken={idToken || undefined}
                  onDelete={handleDeleteArticle}
                />
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center">
              <Upload className="h-8 w-8 text-slate-300 mb-2" />
              <p className="text-sm font-semibold text-slate-700">No uploaded documents yet</p>
              <p className="mt-1 text-xs text-slate-500 max-w-sm">
                Upload your own technical papers, PDFs, or research notes to practice active recall.
              </p>
              <Link
                href="/upload"
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-slate-800 transition"
              >
                <Upload className="h-3.5 w-3.5" />
                <span>Upload a Document</span>
              </Link>
            </div>
          )}
        </div>
      )}

      {/* Empty state */}
      {!fetching && articles.length === 0 && !error && (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-base font-semibold text-slate-700">No articles available yet.</p>
          <p className="mt-1 text-sm text-slate-500">
            Upload an article or run the seed script to start practicing.
          </p>
        </div>
      )}
    </div>
  );
}
