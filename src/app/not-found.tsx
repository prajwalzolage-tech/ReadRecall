// src/app/not-found.tsx
// 404 Not Found page

import Link from 'next/link';
import { BookOpen, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 text-center">
      <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-8 max-w-md space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-slate-800 text-indigo-400">
          <BookOpen className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-white">Page Not Found</h2>
        <p className="text-xs text-slate-400 leading-relaxed">
          The article or page you requested does not exist or has been removed.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-xs font-semibold text-white hover:bg-indigo-500 transition"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Articles
        </Link>
      </div>
    </div>
  );
}
