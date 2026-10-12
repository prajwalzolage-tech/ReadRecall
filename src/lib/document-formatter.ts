// src/lib/document-formatter.ts
// Formats raw extracted text into structured, professional Markdown with
// headings, subheadings, bullet points, highlighted key terms, and executive callouts

import { cleanArticleText } from '@/lib/text-cleaning';

// Standard technical terms to emphasize in technical documents
const KEY_TERMS = [
  'TimeSformer',
  'Space-Time Attention',
  'space-time attention',
  'Vision Transformer',
  'self-attention',
  'Self-Attention',
  'Transformer',
  'transformers',
  'NLP',
  'CNN',
  'convolutional networks',
  'video understanding',
  'video recognition',
  'temporal attention',
  'spatial attention',
  'long-range dependencies',
  'atomic actions',
  'cross-entropy',
  'patch embeddings',
  'self-supervised learning',
  'spatiotemporal',
  'multi-head attention',
  'feed-forward network',
  'inductive bias',
  'computational complexity',
  'pre-training',
  'fine-tuning',
];

/**
 * Format bullet points when paragraphs contain sequential transition words
 * e.g., "First of all, videos and sentences are both sequential. Furthermore, precisely as... Thus, one would expect..."
 */
function extractBulletPointsFromTransitions(paragraph: string): string {
  // If paragraph contains enumeration signals
  const transitionPattern =
    /(?:First(?: of all)?,|Second(?:ly)?,|Third(?:ly)?,|Furthermore,|In addition,|Moreover,|Finally,|Thus,)/i;

  if (!transitionPattern.test(paragraph) || paragraph.length < 120) {
    return paragraph;
  }

  // Split into sentences
  const sentences = paragraph.match(/[^.!?]+[.!?]+(?:\s+|$)/g);
  if (!sentences || sentences.length < 3) {
    return paragraph;
  }

  const introductory: string[] = [];
  const listItems: string[] = [];

  for (const sentence of sentences) {
    const trimmed = sentence.trim();
    if (/^(?:First(?: of all)?,|Second(?:ly)?,|Third(?:ly)?,|Furthermore,|Moreover,|In addition,|Finally,|Thus,)\s*/i.test(trimmed)) {
      // Clean leading connector word
      const cleaned = trimmed.replace(
        /^(?:First(?: of all)?,|Second(?:ly)?,|Third(?:ly)?,|Furthermore,|Moreover,|In addition,|Finally,|Thus,)\s*/i,
        ''
      );

      // Capitalize first letter
      const formatted = cleaned.charAt(0).toUpperCase() + cleaned.slice(1);

      // Attempt to extract leading concept for bolding
      const leadMatch = formatted.match(/^([A-Za-z0-9\s\-]{3,25}?)(?:\s+(?:is|are|shares|need|require|can|provides|demonstrates|aims))\b/i);
      if (leadMatch) {
        const lead = leadMatch[1].trim();
        const rest = formatted.slice(lead.length).trim();
        listItems.push(`- **${lead}**: ${rest}`);
      } else {
        listItems.push(`- ${formatted}`);
      }
    } else if (listItems.length === 0) {
      introductory.push(trimmed);
    } else {
      listItems.push(`- ${trimmed}`);
    }
  }

  if (listItems.length >= 2) {
    const introText = introductory.length > 0 ? `${introductory.join(' ')}\n\n` : '';
    return `${introText}${listItems.join('\n')}`;
  }

  return paragraph;
}

/**
 * Emphasize key technical terms in text with **bold** Markdown
 */
function boldKeyTerms(text: string): string {
  let result = text;

  for (const term of KEY_TERMS) {
    // Avoid double-bolding
    const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(?<!\\*\\*|\\w)\\b(${escaped})\\b(?!\\*\\*)`, 'g');
    result = result.replace(regex, '**$1**');
  }

  return result;
}

/**
 * Transform raw extracted text into structured, publication-grade Markdown
 */
export function formatDocument(
  rawText: string,
  options?: { title?: string; sectionTitle?: string }
): string {
  if (!rawText) return '';

  // 1. Initial sanitization and PDF artifact cleaning
  const cleaned = cleanArticleText(rawText);

  // If text already has clean markdown headings and lists, just polish terms
  const hasMarkdownHeadings = /^#{1,3}\s+[^\n]+/m.test(cleaned);
  if (hasMarkdownHeadings) {
    return boldKeyTerms(cleaned);
  }

  // 2. Break into paragraphs
  const rawParagraphs = cleaned
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter((p) => p.length > 0);

  if (rawParagraphs.length === 0) return '';

  const formattedBlocks: string[] = [];

  // Check if first paragraph works as an executive overview / takeaway
  const firstP = rawParagraphs[0];
  const isIntroductory =
    firstP.length > 80 &&
    /(?:in this (?:paper|work)|we propose|introduces|presents|aims to|video understanding|overview|abstract)/i.test(
      firstP
    );

  let startIndex = 0;

  if (isIntroductory) {
    formattedBlocks.push(`> **Key Takeaway:** ${boldKeyTerms(firstP)}`);
    startIndex = 1;
  }

  for (let i = startIndex; i < rawParagraphs.length; i++) {
    let p = rawParagraphs[i];

    // Check if this paragraph is a section heading
    const isHeadingCandidate =
      p.length < 75 &&
      !p.endsWith('.') &&
      (
        /^(?:\d+\.?\s+)?(?:Introduction|Related Work|Methodology|Architecture|Proposed Method|Approach|Experiments|Results|Discussion|Conclusion|Background|Overview)\b/i.test(p) ||
        /^[A-Z0-9\s,\-:]{4,50}$/.test(p)
      );

    if (isHeadingCandidate) {
      formattedBlocks.push(`\n## ${p.replace(/^#+\s*/, '').trim()}\n`);
      continue;
    }

    // Check if we should insert a contextual subheading for long flow
    if (i === 1 && !hasMarkdownHeadings && rawParagraphs.length >= 3) {
      const headingTitle = options?.sectionTitle
        ? `${options.sectionTitle}: Core Concepts`
        : 'Foundational Principles';
      formattedBlocks.push(`\n## ${headingTitle}\n`);
    } else if (i === Math.floor(rawParagraphs.length / 2) && rawParagraphs.length >= 4) {
      formattedBlocks.push('\n### Mechanism & Technical Analysis\n');
    }

    // Process lists or transitions inside paragraph
    p = extractBulletPointsFromTransitions(p);

    // Emphasize key concepts
    p = boldKeyTerms(p);

    formattedBlocks.push(p);
  }

  return formattedBlocks.join('\n\n');
}
