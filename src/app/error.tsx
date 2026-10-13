'use client';

// src/app/error.tsx
// Global error boundary for unexpected runtime exceptions

import { useEffect } from 'react';
import { AlertCircle, RotateCcw } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled runtime error:', error);
  }, [error]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center px-4 py-12 text-center">
      <div className="w-full max-w-md rounded-2xl border border-rose-200 bg-white p-6 sm:p-8 shadow-sm space-y-4">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-rose-50 text-rose-600 border border-rose-100">
          <AlertCircle className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Something went wrong</h2>
        <p className="text-xs text-rose-600 leading-relaxed">
          {error.message || 'An unexpected error occurred during execution.'}
        </p>
        <button
          onClick={() => reset()}
          className="inline-flex w-full sm:w-auto items-center justify-center gap-2 rounded-xl bg-rose-600 px-5 py-2.5 text-xs font-semibold text-white shadow-sm hover:bg-rose-700 transition active:scale-[0.99]"
        >
          <RotateCcw className="h-4 w-4" />
          <span>Try Again</span>
        </button>
      </div>
    </div>
  );
}
