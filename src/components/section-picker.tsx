// src/components/section-picker.tsx
// Section picker component for long articles with word count suitability badges

'use client';

import React from 'react';
import type { Section } from '@/types';
import {
  WORD_COUNT_GOOD_MIN,
  WORD_COUNT_GOOD_MAX,
  WORD_COUNT_LONG_MAX,
} from '@/lib/constants';
import { CheckCircle2, BookOpen } from 'lucide-react';

interface SectionPickerProps {
  sections: Section[];
  selectedSection: string | null;
  onSelectSection: (sectionTitle: string) => void;
  className?: string;
}

export function SectionPicker({
  sections,
  selectedSection,
  onSelectSection,
  className = '',
}: SectionPickerProps) {
  return (
    <div className={`space-y-4 ${className}`}>
      <div>
        <h3 className="text-base font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-indigo-600" />
          Select a Reading Section
        </h3>
        <p className="text-xs text-slate-500 mt-0.5">
          This article is over 800 words. We recommend tackling one focused section at a time for optimal recall.
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {sections.map((section) => {
          const isSelected =
            selectedSection === section.title ||
            (!selectedSection && section.isDefault);

          let badgeText = 'Optimal Length';
          let badgeClass =
            'bg-emerald-50 text-emerald-700 border-emerald-200';

          if (section.wordCount > WORD_COUNT_LONG_MAX) {
            badgeText = 'Very Long';
            badgeClass = 'bg-rose-50 text-rose-700 border-rose-200';
          } else if (section.wordCount > WORD_COUNT_GOOD_MAX) {
            badgeText = 'Long';
            badgeClass = 'bg-amber-50 text-amber-800 border-amber-200';
          } else if (section.wordCount < WORD_COUNT_GOOD_MIN) {
            badgeText = 'Short';
            badgeClass = 'bg-slate-100 text-slate-700 border-slate-200';
          }

          return (
            <div
              key={section.title}
              onClick={() => onSelectSection(section.title)}
              className={`relative flex flex-col justify-between p-4 rounded-xl border cursor-pointer transition ${
                isSelected
                  ? 'border-slate-900 bg-slate-50/80 shadow-xs ring-1 ring-slate-900'
                  : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50/50 shadow-xs'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-semibold text-sm text-slate-900">
                    {section.title}
                  </h4>
                  <span className="text-xs text-slate-500 font-medium">
                    {section.wordCount} words
                  </span>
                </div>
                {isSelected && (
                  <CheckCircle2 className="h-4 w-4 text-slate-900 shrink-0" />
                )}
              </div>

              <div className="mt-3 flex items-center justify-between">
                <span
                  className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-semibold ${badgeClass}`}
                >
                  {badgeText}
                </span>
                <span className="text-[11px] text-slate-500 font-medium">
                  ~{Math.ceil(section.wordCount / 200)} min read
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
