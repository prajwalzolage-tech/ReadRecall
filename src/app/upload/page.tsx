// src/app/upload/page.tsx
// Upload page: file upload / text paste, section picker for long texts, and read entry

'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/components/auth-provider';
import { UploadForm } from '@/components/upload-form';
import { SectionPicker } from '@/components/section-picker';
import { Upload, ArrowRight, CheckCircle2 } from 'lucide-react';
import type { Section } from '@/types';

export default function UploadPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const prefillTitle = searchParams.get('title') || '';

  const { user, loading, idToken } = useAuth();
  const [processedResult, setProcessedResult] = useState<{
    articleId: string;
    wordCount: number;
    sections?: Section[];
  } | null>(null);

  const [selectedSection, setSelectedSection] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !user) {
      router.push('/login');
    }
  }, [loading, user, router]);

  const handleSuccess = (result: {
    articleId: string;
    wordCount: number;
    sections?: Section[];
  }) => {
    setProcessedResult(result);
    if (!result.sections || result.sections.length <= 1) {
      // Direct navigate if short enough
      router.push(`/read/${result.articleId}`);
    }
  };

  const handleStartReading = () => {
    if (!processedResult) return;
    const query = selectedSection ? `?section=${encodeURIComponent(selectedSection)}` : '';
    router.push(`/read/${processedResult.articleId}${query}`);
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
          <Upload className="h-4 w-4" />
          <span>Custom Reading Material</span>
        </div>
        <h1 className="mt-1 text-2xl sm:text-3xl font-bold tracking-tight text-slate-900">
          Upload or Paste an Article
        </h1>
        <p className="mt-2 text-sm text-slate-600 max-w-2xl leading-relaxed">
          Bring your own technical papers, academic PDFs, or engineering articles. ReadRecall extracts clean text, derives validated key points with Jev, and initiates an active recall session.
        </p>
      </div>

      {/* Upload Form or Section Picker */}
      {!processedResult ? (
        <UploadForm
          idToken={idToken || ''}
          initialTitle={prefillTitle}
          onSuccess={handleSuccess}
        />
      ) : (
        <div className="rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2.5 text-emerald-700">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="text-lg font-bold text-slate-900 tracking-tight">
              Article Processed Successfully ({processedResult.wordCount} words)
            </h2>
          </div>

          {processedResult.sections && processedResult.sections.length > 1 && (
            <SectionPicker
              sections={processedResult.sections}
              selectedSection={selectedSection}
              onSelectSection={setSelectedSection}
            />
          )}

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              onClick={handleStartReading}
              className="inline-flex items-center gap-2 rounded-xl bg-slate-900 px-6 py-3 font-semibold text-white shadow-sm hover:bg-slate-800 transition"
            >
              <span>Begin Timed Reading</span>
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
