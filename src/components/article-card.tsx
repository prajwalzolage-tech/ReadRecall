'use client';

// src/components/article-card.tsx
// Card component for the article picker grid

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import type { ArticleListItem } from '@/types';

interface ArticleCardProps {
  article: ArticleListItem;
}

export function ArticleCard({ article }: ArticleCardProps) {
  const readingTime = Math.ceil(article.wordCount / 200);

  return (
    <Link href={`/read/${article.id}`} className="group block h-full">
      <div className="relative flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-slate-200/90 bg-white p-6 transition-all duration-200 hover:border-slate-300 hover:shadow-md hover:-translate-y-0.5">
        {/* Source badge */}
        <div>
          <div className="mb-3.5 flex items-center gap-2">
            <span
              className={`inline-flex items-center rounded-md px-2.5 py-0.5 text-[11px] font-semibold tracking-wide border ${
                article.source === 'curated'
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200/80'
                  : 'bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              {article.source === 'curated' ? 'Curated' : article.source}
            </span>
            {article.keyPointSource === 'ai' && (
              <span className="inline-flex items-center rounded-md bg-purple-50 px-2 py-0.5 text-[11px] font-medium text-purple-700 border border-purple-200/70">
                AI Verified
              </span>
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
            <span>~{readingTime} min read</span>
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
  );
}
