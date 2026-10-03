// src/lib/section-splitter.ts
// Splits long texts (>800 words) into readable sections using headings or sentence boundaries

import { countWords } from '@/hooks/use-word-count';
import { SECTION_TARGET_WORDS, SECTION_MAX_WORDS } from '@/lib/constants';
import type { Section } from '@/types';

/**
 * Split an article into sections by Markdown headings, all-caps titles, or ~500-word sentence chunks.
 */
export function splitSections(
  text: string,
  maxWords = SECTION_MAX_WORDS
): Section[] {
  const totalWords = countWords(text);

  // If text is already under max words, return a single complete section
  if (totalWords <= maxWords) {
    return [
      {
        title: 'Full Article',
        text,
        startIndex: 0,
        endIndex: text.length,
        wordCount: totalWords,
        isDefault: true,
      },
    ];
  }

  // 1. Try splitting by Markdown headings (# Heading or ## Heading) or clear all-caps titles
  const headingRegex = /(?:^|\n)(#{1,3}\s+[^\n]+|[A-Z0-9\s,:\-]{4,60}\n)/g;
  const matches = Array.from(text.matchAll(headingRegex));

  if (matches.length >= 2) {
    const sections: Section[] = [];
    for (let i = 0; i < matches.length; i++) {
      const match = matches[i];
      const headingStart = match.index!;
      const headingText = match[0].replace(/^#+\s*/, '').trim();

      const nextStart =
        i + 1 < matches.length ? matches[i + 1].index! : text.length;

      const sectionText = text.slice(headingStart, nextStart).trim();
      const words = countWords(sectionText);

      if (words >= 40) {
        sections.push({
          title: headingText || `Section ${sections.length + 1}`,
          text: sectionText,
          startIndex: headingStart,
          endIndex: nextStart,
          wordCount: words,
          isDefault: sections.length === 0,
        });
      }
    }

    if (sections.length > 1) {
      return sections;
    }
  }

  // 2. Fallback: Split into ~500 word chunks at sentence boundaries
  const sentences = text.match(/[^.!?]+[.!?]+(?:\s+|$)/g) || [text];
  const sections: Section[] = [];
  let currentSentences: string[] = [];
  let currentWords = 0;
  let sectionIndex = 1;
  let accumulatedIndex = 0;

  for (const sentence of sentences) {
    const sentenceWordCount = countWords(sentence);

    if (
      currentWords + sentenceWordCount > SECTION_TARGET_WORDS &&
      currentSentences.length > 0
    ) {
      const chunkText = currentSentences.join('').trim();
      sections.push({
        title: `Part ${sectionIndex}`,
        text: chunkText,
        startIndex: accumulatedIndex,
        endIndex: accumulatedIndex + chunkText.length,
        wordCount: currentWords,
        isDefault: sections.length === 0,
      });
      accumulatedIndex += chunkText.length;
      currentSentences = [sentence];
      currentWords = sentenceWordCount;
      sectionIndex++;
    } else {
      currentSentences.push(sentence);
      currentWords += sentenceWordCount;
    }
  }

  if (currentSentences.length > 0) {
    const chunkText = currentSentences.join('').trim();
    sections.push({
      title: `Part ${sectionIndex}`,
      text: chunkText,
      startIndex: accumulatedIndex,
      endIndex: text.length,
      wordCount: currentWords,
      isDefault: sections.length === 0,
    });
  }

  return sections;
}
