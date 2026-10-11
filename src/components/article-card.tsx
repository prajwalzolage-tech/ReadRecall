'use client';

// src/components/article-card.tsx
// Card component for the article picker grid with deletion support for user uploads

import React, { useState } from 'react';
import Link from 'next/link';
import { Trash2, AlertTriangle, Loader2 } from 'lucide-react';
import type { ArticleListItem } from '@/types';

interface ArticleCardProps {
  article: ArticleListItem;
  currentUserId?: string;
  idToken?: string;
  onDelete?: (articleId: string) => void;
}

export function ArticleCard({
  article,
  currentUserId,
  idToken,
  onDelete,
}: ArticleCardProps) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const readingTime = Math.ceil(article.wordCount / 200);

  // Users can delete articles that are not curated and were created by them (or uploaded)
  const isDeletable =
    article.source !== 'curated' &&
    (Boolean(currentUserId && article.createdBy === currentUserId) ||
      !article.createdBy ||
      article.createdBy === 'user');

  const handleDelete = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    setDeleting(true);
    setError(null);

    try {
      const headers: Record<string, string> = {};
      if (idToken) headers['Authorization'] = `Bearer ${idToken}`;

      const res = await fetch(`/api/articles/${article.id}`, {
        method: 'DELETE',
        headers,
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to delete article');
      }

      onDelete?.(article.id);
    } catch (err: any) {
      setError(err.message || 'Error deleting article');
      setDeleting(false);
    }
  };

  return (
    <div className="relative group block h-full">
      <Link href={`/read/${article.id}`} className="block h-full">
        <div className="relative flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5">
          {/* Top Row: Badges & Delete Button */}
          <div>
            <div className="mb-3.5 flex items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-1.5">
                <span
                  className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border ${
                    article.source === 'curated'
                      ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                      : 'bg-indigo-50 text-indigo-700 border-indigo-200/80'
                  }`}
                >
                  {article.source === 'curated'
                    ? 'Curated'
                    : article.source === 'uploaded'
                    ? 'Uploaded'
                    : article.source === 'pasted'
                    ? 'Pasted'
                    : article.source}
                </span>

                {article.keyPointSource === 'ai' && (
                  <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200/70">
                    AI Verified
                  </span>
                )}

                {article.sectionCount && article.sectionCount > 1 && (
                  <span className="inline-flex items-center rounded-md bg-indigo-50 px-2 py-0.5 text-[11px] font-semibold text-indigo-700 border border-indigo-200/80">
                    {article.sectionCount} Parts
                  </span>
                )}
              </div>

              {/* Delete trigger for uploaded documents */}
              {isDeletable && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    setConfirming(true);
                  }}
                  className="rounded-lg p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition z-10"
                  title="Delete uploaded document"
                  aria-label="Delete document"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Title */}
            <h3 className="mb-3 text-lg font-semibold text-slate-900 leading-snug tracking-tight transition-colors group-hover:text-indigo-600">
              {article.title}
            </h3>
          </div>

          {/* Meta */}
          <div className="flex items-center justify-between pt-4 border-t border-slate-100 text-xs text-slate-500 font-medium">
            <div className="flex items-center gap-3">
              <span>{article.wordCount} words</span>
              <span>•</span>
              {article.sectionCount && article.sectionCount > 1 ? (
                <span className="text-indigo-600 font-semibold">{article.sectionCount} Reading Parts</span>
              ) : (
                <span>~{readingTime} min read</span>
              )}
            </div>

            {/* Arrow */}
            <svg
              className="h-4 w-4 text-slate-400 transition-transform duration-200 group-hover:translate-x-1 group-hover:text-indigo-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5l7 7-7 7"
              />
            </svg>
          </div>
        </div>
      </Link>

      {/* Confirmation Overlay */}
      {confirming && (
        <div
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
          }}
          className="absolute inset-0 z-20 flex flex-col justify-between rounded-2xl border border-rose-200 bg-white/95 p-6 backdrop-blur-xs shadow-lg animate-in fade-in zoom-in-95 duration-150"
        >
          <div>
            <div className="flex items-center gap-2 text-rose-600 text-sm font-bold">
              <AlertTriangle className="h-4 w-4" />
              <span>Delete Document?</span>
            </div>
            <p className="mt-2 text-xs text-slate-600 leading-relaxed">
              Are you sure you want to delete <span className="font-semibold text-slate-900">&ldquo;{article.title}&rdquo;</span>? This cannot be undone.
            </p>
            {error && (
              <p className="mt-2 text-xs text-rose-600 font-medium">
                {error}
              </p>
            )}
          </div>

          <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-100">
            <button
              type="button"
              disabled={deleting}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setConfirming(false);
                setError(null);
              }}
              className="rounded-xl border border-slate-200 bg-white px-3.5 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={deleting}
              onClick={handleDelete}
              className="inline-flex items-center gap-1.5 rounded-xl bg-rose-600 px-3.5 py-1.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  <span>Deleting...</span>
                </>
              ) : (
                <>
                  <Trash2 className="h-3.5 w-3.5" />
                  <span>Delete</span>
                </>
              )}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
