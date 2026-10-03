// src/components/upload-form.tsx
// Unified upload interface: file dropzone (PDF, DOCX, TXT) + paste text mode

'use client';

import React, { useState, useRef } from 'react';
import { MAX_UPLOAD_SIZE_BYTES, ALLOWED_MIME_TYPES } from '@/lib/constants';
import { Upload, FileText, Type, AlertCircle, Sparkles } from 'lucide-react';
import type { Section } from '@/types';

interface UploadFormProps {
  idToken: string;
  initialTitle?: string;
  onSuccess: (result: {
    articleId: string;
    wordCount: number;
    sections?: Section[];
  }) => void;
  className?: string;
}

export function UploadForm({
  idToken,
  initialTitle = '',
  onSuccess,
  className = '',
}: UploadFormProps) {
  const [mode, setMode] = useState<'file' | 'paste'>('file');
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [pasteText, setPasteText] = useState('');
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const selected = e.target.files?.[0];
    if (!selected) return;

    if (selected.size > MAX_UPLOAD_SIZE_BYTES) {
      setError('File size exceeds the 10 MB limit.');
      return;
    }

    const mime = selected.type;
    const isAllowed =
      (ALLOWED_MIME_TYPES as readonly string[]).includes(mime) ||
      selected.name.endsWith('.pdf') ||
      selected.name.endsWith('.docx') ||
      selected.name.endsWith('.txt');

    if (!isAllowed) {
      setError('Unsupported format. Please upload a PDF, DOCX, or TXT file.');
      return;
    }

    setFile(selected);
    if (!title) {
      setTitle(selected.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (mode === 'file' && !file) {
      setError('Please choose a file to upload.');
      return;
    }

    if (mode === 'paste' && (!pasteText.trim() || pasteText.trim().length < 100)) {
      setError('Please paste at least 100 characters of text.');
      return;
    }

    setUploading(true);
    setProgress(20);

    try {
      let response: Response;

      if (mode === 'file' && file) {
        setProgress(40);
        const formData = new FormData();
        formData.append('file', file);
        if (title.trim()) formData.append('title', title.trim());

        response = await fetch('/api/upload/process', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
          body: formData,
        });
      } else {
        setProgress(50);
        response = await fetch('/api/upload/process', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${idToken}`,
          },
          body: JSON.stringify({
            text: pasteText,
            title: title.trim() || 'Pasted Article',
          }),
        });
      }

      setProgress(85);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || 'Failed to process document');
      }

      const result = await response.json();
      setProgress(100);
      onSuccess(result);
    } catch (err: any) {
      setError(err.message || 'Upload failed. Please check the file and try again.');
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <div
      className={`rounded-2xl border border-slate-200/90 bg-white p-6 sm:p-8 shadow-sm ${className}`}
    >
      {/* Mode Tabs */}
      <div className="flex flex-col sm:flex-row gap-1.5 rounded-xl border border-slate-200 bg-slate-50 p-1 mb-6">
        <button
          type="button"
          onClick={() => {
            setMode('file');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
            mode === 'file'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <FileText className="h-4 w-4 text-slate-500" />
          File Upload (PDF, DOCX, TXT)
        </button>

        <button
          type="button"
          onClick={() => {
            setMode('paste');
            setError(null);
          }}
          className={`flex-1 flex items-center justify-center gap-2 py-2 text-xs font-semibold rounded-lg transition ${
            mode === 'paste'
              ? 'bg-white text-slate-900 shadow-xs border border-slate-200/80'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Type className="h-4 w-4 text-slate-500" />
          Paste Article Text
        </button>
      </div>

      {/* Error alert */}
      {error && (
        <div className="mb-6 flex items-center gap-2.5 rounded-xl border border-rose-200 bg-rose-50 p-4 text-xs text-rose-700 font-medium">
          <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{error}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Title Input */}
        <div>
          <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
            Article Title (Optional)
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            disabled={uploading}
            placeholder="e.g. Distributed Consensus in Modern Networks"
            className="w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 transition"
          />
        </div>

        {/* File Dropzone */}
        {mode === 'file' ? (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Select Document
            </label>
            <div
              onClick={() => fileInputRef.current?.click()}
              className="flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-8 text-center cursor-pointer hover:border-slate-400 hover:bg-slate-50 transition"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt"
                onChange={handleFileChange}
                className="hidden"
                disabled={uploading}
              />
              <Upload className="h-8 w-8 text-slate-400 mb-3" />
              {file ? (
                <div>
                  <p className="text-sm font-semibold text-slate-900">{file.name}</p>
                  <p className="text-xs text-slate-500 font-mono mt-0.5">
                    {(file.size / (1024 * 1024)).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div>
                  <p className="text-sm font-semibold text-slate-700">
                    Click to browse or drop PDF, DOCX, TXT file
                  </p>
                  <p className="mt-1 text-xs text-slate-500">
                    Max size 10 MB. Text-based documents only.
                  </p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wider text-slate-500 mb-2">
              Paste Text
            </label>
            <textarea
              rows={8}
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              disabled={uploading}
              placeholder="Paste article or lecture text here (100–5000 words)..."
              className="w-full rounded-xl border border-slate-200 bg-white p-4 text-sm text-slate-800 placeholder:text-slate-400 focus:border-slate-400 focus:outline-none focus:ring-4 focus:ring-slate-100 transition leading-relaxed font-sans"
            />
          </div>
        )}

        {/* Progress bar */}
        {uploading && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-slate-500 font-medium">
              <span>Extracting text & generating verified key points...</span>
              <span>{progress}%</span>
            </div>
            <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
              <div
                className="h-full bg-slate-900 transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={uploading}
            className={`inline-flex items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
              uploading
                ? 'bg-slate-200 text-slate-400 cursor-not-allowed'
                : 'bg-slate-900 hover:bg-slate-800 cursor-pointer'
            }`}
          >
            {uploading ? (
              <>
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                <span>Processing Document...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 text-indigo-400" />
                <span>Process & Prepare Article</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
