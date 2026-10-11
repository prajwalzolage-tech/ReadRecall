// src/components/document-reader.tsx
// Professional academic & technical document reader with typography controls,
// styled headings, bullet lists, bold term highlights, and executive callouts

'use client';

import React, { useState, useMemo } from 'react';
import { formatDocument } from '@/lib/document-formatter';
import {
  Sparkles,
  Type,
  AlignLeft,
  ChevronRight,
  BookOpen,
  Layers,
} from 'lucide-react';

interface DocumentReaderProps {
  content: string;
  title?: string;
  sectionTitle?: string;
  className?: string;
}

type Block =
  | { type: 'h2'; text: string }
  | { type: 'h3'; text: string }
  | { type: 'callout'; text: string }
  | { type: 'bullet-list'; items: string[] }
  | { type: 'numbered-list'; items: string[] }
  | { type: 'paragraph'; text: string };

/**
 * Render inline markdown (bold, italic, code) into React elements
 */
function renderInlineContent(text: string): React.ReactNode {
  // Tokenize by inline markdown markers: **bold**, *italic*, `code`
  const regex = /(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g;
  const parts = text.split(regex);

  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      const inner = part.slice(2, -2);
      return (
        <strong
          key={idx}
          className="font-semibold text-slate-900 bg-indigo-50/40 px-1 py-0.5 rounded"
        >
          {inner}
        </strong>
      );
    }
    if (part.startsWith('*') && part.endsWith('*')) {
      return (
        <em key={idx} className="italic text-slate-700">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code
          key={idx}
          className="font-mono text-xs bg-slate-100 border border-slate-200 px-1.5 py-0.5 rounded text-indigo-700 font-medium"
        >
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

/**
 * Parse structured markdown string into typed blocks
 */
function parseBlocks(markdownText: string): Block[] {
  const lines = markdownText.split('\n');
  const blocks: Block[] = [];
  let currentBullets: string[] = [];
  let currentNumbered: string[] = [];
  let currentParagraphLines: string[] = [];

  const flushListsAndParagraph = () => {
    if (currentBullets.length > 0) {
      blocks.push({ type: 'bullet-list', items: [...currentBullets] });
      currentBullets = [];
    }
    if (currentNumbered.length > 0) {
      blocks.push({ type: 'numbered-list', items: [...currentNumbered] });
      currentNumbered = [];
    }
    if (currentParagraphLines.length > 0) {
      const text = currentParagraphLines.join(' ').trim();
      if (text) {
        blocks.push({ type: 'paragraph', text });
      }
      currentParagraphLines = [];
    }
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();

    if (!line) {
      flushListsAndParagraph();
      continue;
    }

    // Callout / Blockquote
    if (line.startsWith('>')) {
      flushListsAndParagraph();
      const calloutText = line.replace(/^>\s*/, '').trim();
      blocks.push({ type: 'callout', text: calloutText });
      continue;
    }

    // Heading 2
    if (line.startsWith('## ')) {
      flushListsAndParagraph();
      blocks.push({ type: 'h2', text: line.replace(/^##\s+/, '').trim() });
      continue;
    }

    // Heading 3
    if (line.startsWith('### ')) {
      flushListsAndParagraph();
      blocks.push({ type: 'h3', text: line.replace(/^###\s+/, '').trim() });
      continue;
    }

    // Heading 1 (treat as H2)
    if (line.startsWith('# ')) {
      flushListsAndParagraph();
      blocks.push({ type: 'h2', text: line.replace(/^#\s+/, '').trim() });
      continue;
    }

    // Bullet list item (- or *)
    if (/^[-*•]\s+/.test(line)) {
      if (currentParagraphLines.length > 0) {
        blocks.push({ type: 'paragraph', text: currentParagraphLines.join(' ').trim() });
        currentParagraphLines = [];
      }
      currentBullets.push(line.replace(/^[-*•]\s+/, '').trim());
      continue;
    }

    // Numbered list item (1. 2.)
    if (/^\d+\.\s+/.test(line)) {
      if (currentParagraphLines.length > 0) {
        blocks.push({ type: 'paragraph', text: currentParagraphLines.join(' ').trim() });
        currentParagraphLines = [];
      }
      currentNumbered.push(line.replace(/^\d+\.\s+/, '').trim());
      continue;
    }

    // Regular paragraph line
    currentParagraphLines.push(line);
  }

  flushListsAndParagraph();
  return blocks;
}

export function DocumentReader({
  content,
  title,
  sectionTitle,
  className = '',
}: DocumentReaderProps) {
  // Reading appearance preferences
  const [fontStyle, setFontStyle] = useState<'serif' | 'sans'>('serif');
  const [fontSize, setFontSize] = useState<'sm' | 'md' | 'lg'>('md');

  // Format and parse text into structured blocks
  const formattedMarkdown = useMemo(() => {
    return formatDocument(content, { title, sectionTitle });
  }, [content, title, sectionTitle]);

  const blocks = useMemo(() => {
    return parseBlocks(formattedMarkdown);
  }, [formattedMarkdown]);

  // Typography styles based on preferences
  const fontClass = fontStyle === 'serif' ? 'font-serif' : 'font-sans';
  const sizeClass =
    fontSize === 'sm'
      ? 'text-[16px] leading-[1.8]'
      : fontSize === 'lg'
      ? 'text-[20px] leading-[1.95]'
      : 'text-[18px] leading-[1.85]';

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Reader Preferences Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-200/70 bg-slate-50/80 px-4 py-2.5 text-xs text-slate-600 font-sans backdrop-blur-xs">
        <div className="flex items-center gap-2">
          <Type className="h-3.5 w-3.5 text-indigo-600" />
          <span className="font-semibold text-slate-700">Document Reader</span>
          {sectionTitle && (
            <span className="inline-flex items-center rounded-md bg-indigo-100/70 px-2 py-0.5 text-[10px] font-semibold text-indigo-800">
              {sectionTitle}
            </span>
          )}
        </div>

        <div className="flex items-center gap-4">
          {/* Font Type Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              onClick={() => setFontStyle('serif')}
              className={`rounded-md px-2.5 py-1 text-xs font-serif font-medium transition ${
                fontStyle === 'serif'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Editorial Serif
            </button>
            <button
              onClick={() => setFontStyle('sans')}
              className={`rounded-md px-2.5 py-1 text-xs font-sans font-medium transition ${
                fontStyle === 'sans'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Modern Sans
            </button>
          </div>

          {/* Font Size Toggle */}
          <div className="flex items-center rounded-lg border border-slate-200 bg-white p-0.5 shadow-2xs">
            <button
              onClick={() => setFontSize('sm')}
              className={`rounded-md px-2 py-1 text-[11px] font-medium transition ${
                fontSize === 'sm'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Standard Font Size"
            >
              A-
            </button>
            <button
              onClick={() => setFontSize('md')}
              className={`rounded-md px-2 py-1 text-xs font-medium transition ${
                fontSize === 'md'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Medium Font Size"
            >
              A
            </button>
            <button
              onClick={() => setFontSize('lg')}
              className={`rounded-md px-2 py-1 text-xs font-bold transition ${
                fontSize === 'lg'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
              title="Large Font Size"
            >
              A+
            </button>
          </div>
        </div>
      </div>

      {/* Structured Content Area */}
      <div className={`${fontClass} ${sizeClass} text-slate-800 space-y-6 text-left`}>
        {blocks.map((block, idx) => {
          switch (block.type) {
            case 'h2':
              return (
                <div key={idx} className="pt-6 pb-2 border-b border-slate-100 font-sans">
                  <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 flex items-center gap-2.5">
                    <span className="flex h-6 w-1.5 rounded-full bg-indigo-600 shrink-0" />
                    <span>{block.text}</span>
                  </h2>
                </div>
              );

            case 'h3':
              return (
                <div key={idx} className="pt-4 font-sans">
                  <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2">
                    <ChevronRight className="h-4 w-4 text-indigo-500 shrink-0" />
                    <span>{block.text}</span>
                  </h3>
                </div>
              );

            case 'callout':
              return (
                <div
                  key={idx}
                  className="rounded-2xl border border-indigo-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-indigo-50/30 p-5 sm:p-6 shadow-2xs font-sans"
                >
                  <div className="flex items-start gap-3">
                    <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-600 text-white shrink-0 mt-0.5">
                      <Sparkles className="h-4 w-4" />
                    </div>
                    <div className="text-sm sm:text-base leading-relaxed text-slate-800">
                      {renderInlineContent(block.text)}
                    </div>
                  </div>
                </div>
              );

            case 'bullet-list':
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5 my-4"
                >
                  <ul className="space-y-3">
                    {block.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-3">
                        <span className="flex h-2 w-2 rounded-full bg-indigo-600 shrink-0 mt-2.5" />
                        <span className="flex-1 leading-relaxed">
                          {renderInlineContent(item)}
                        </span>
                      </li>
                    ))}
                  </ul>
                </div>
              );

            case 'numbered-list':
              return (
                <div
                  key={idx}
                  className="rounded-xl border border-slate-100 bg-slate-50/40 p-4 sm:p-5 my-4"
                >
                  <ol className="space-y-3">
                    {block.items.map((item, itemIdx) => (
                      <li key={itemIdx} className="flex items-start gap-3">
                        <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100 text-indigo-800 text-xs font-bold shrink-0 mt-0.5">
                          {itemIdx + 1}
                        </span>
                        <span className="flex-1 leading-relaxed">
                          {renderInlineContent(item)}
                        </span>
                      </li>
                    ))}
                  </ol>
                </div>
              );

            case 'paragraph':
            default:
              return (
                <p key={idx} className="leading-relaxed text-slate-800">
                  {renderInlineContent(block.text)}
                </p>
              );
          }
        })}
      </div>
    </div>
  );
}
