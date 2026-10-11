// src/lib/text-cleaning.ts
// Cleans extracted article text, removes noise, fixes PDF artifacts, and sanitizes input

// Common compound hyphenated words to preserve
const KNOWN_HYPHENATED_WORDS = new Set([
  'short-term',
  'long-term',
  'long-range',
  'high-level',
  'low-level',
  'self-attention',
  'space-time',
  'state-of-the-art',
  'cross-entropy',
  'feed-forward',
  'multi-head',
  'multi-layer',
  'end-to-end',
  'fine-tuning',
  'pre-training',
  'real-world',
  'deep-learning',
  'machine-learning',
  'zero-shot',
  'few-shot',
  'open-source',
  'scale-up',
  'transformer-based',
  'task-specific',
  'time-series',
]);

/**
 * Fix words that were hyphenated and broken across line breaks or spaces by PDF text extractors.
 * e.g., "sequen- tial" -> "sequential", but "short- term" -> "short-term"
 */
function healHyphenatedWords(text: string): string {
  // First match hyphen followed by newline or spaces
  return text.replace(/([a-zA-Z]{2,})-\s+([a-zA-Z]{2,})/g, (match, p1, p2) => {
    const candidateLower = `${p1.toLowerCase()}-${p2.toLowerCase()}`;
    if (KNOWN_HYPHENATED_WORDS.has(candidateLower)) {
      return `${p1}-${p2}`;
    }

    // Common English suffixes that indicate a split word
    const isSuffix =
      /^(tial|tion|sion|ment|ing|ed|ly|tive|ble|ity|al|est|er|ism|ist|ness|able|ible|ence|ance)$/i.test(
        p2
      );

    // Common prefixes/word roots
    const isPrefix =
      /^(sequen|trans|atten|struc|algo|recog|paral|concep|dimen|evalu|oper|inter|distri|experi|differ|infor|comput)$/i.test(
        p1
      );

    if (isSuffix || isPrefix) {
      return `${p1}${p2}`;
    }

    // If second part starts lowercase and first part isn't a standalone word, join
    if (p2[0] === p2[0].toLowerCase() && p1.length <= 4) {
      return `${p1}${p2}`;
    }

    // Default to combined word unless both are standard standalone words (>4 letters)
    if (p1.length >= 4 && p2.length >= 4) {
      return `${p1}-${p2}`;
    }

    return `${p1}${p2}`;
  });
}

/**
 * Clean and sanitize article text:
 * - Strips control characters and null bytes
 * - Fixes broken hyphenations across line-breaks (e.g. "sequen- tial" -> "sequential")
 * - Removes running headers, footers, page numbers, and footnote author affiliations
 * - Cleans dangling citation remnants (e.g. "1. , 2017a). , 2020).")
 * - Truncates references/bibliography sections
 * - Normalizes excessive whitespace and reconstructs paragraphs
 * - Enforces 50,000 char limit
 */
export function cleanArticleText(rawText: string): string {
  if (!rawText) return '';

  // 1. Strip null bytes and non-printable control chars (except \n, \r, \t)
  let text = rawText.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize newlines
  text = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // 2. Remove common page number patterns like "Page 1 of 12" or solitary numbers
  text = text.replace(/^\s*(?:page\s+\d+(?:\s+of\s+\d+)?|\d+)\s*$/gim, '');

  // 3. Remove running footer / header markers (e.g. "arXiv:1234.5678v1 [cs.CR]")
  text = text.replace(/arXiv:\d+\.\d+(?:v\d+)?\s*\[[^\]]+\]/gi, '');

  // 4. Clean orphan footnote institutional affiliations inserted into body text
  // e.g. "1Facebook AI 2Dartmouth College. edu>."
  text = text.replace(
    /(?:\b\d+\s*)?(?:Facebook AI|Dartmouth College|Stanford University|Google Research|MIT CSAIL|DeepMind|OpenAI|Carnegie Mellon|Microsoft Research|University of [A-Za-z]+|College(?:\.|\s+)edu>)[^.\n]*?(?:edu>|\.com>|\.org>)?/gi,
    ' '
  );

  // 5. Clean broken repository / web URLs
  // e.g. "com/ facebookresearch/TimeSformer." -> "github.com/facebookresearch/TimeSformer."
  text = text.replace(
    /(?:github\.)?com\/\s+([a-zA-Z0-9_\-]+)\/([a-zA-Z0-9_\-]+)/gi,
    'github.com/$1/$2'
  );

  // 6. Clean dangling citation debris from PDF column footnotes
  // e.g. "1. , 2017a). , 2020)." or ", 2019a; Teed & Deng, 2020; Bertasius & Torresani, 2020). , 2018a),"
  text = text.replace(/\b\d+\.\s*,\s*\d{4}[a-z]?\)\./g, '');
  text = text.replace(/\.\s*,\s*\d{4}[a-z]?\)\./g, '.');
  text = text.replace(/\s*,\s*\d{4}[a-z]?\)\./g, '.');

  // 7. Strip references/bibliography if located in the latter part of the text
  const refIndex = text.search(/\n\s*(?:references|bibliography|works cited)\s*\n/i);
  if (refIndex > 300) {
    text = text.slice(0, refIndex).trim();
  }

  // 8. Remove LaTeX artifacts (latexit tags and their base64 hashes)
  text = text.replace(/<latexit[^>]*>[\s\S]*?<\/latexit>/gi, '');
  text = text.replace(/<\/?latexit[^>]*>/gi, '');

  // 9. Fix hyphenated words broken across lines or spaces
  text = healHyphenatedWords(text);

  // Clean up spacing and reconstruct paragraphs
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n');

  // Also catch hyphens directly at end of line without space
  text = text.replace(/([a-zA-Z]+)-\n([a-zA-Z]+)/g, '$1$2');

  // Unwrap paragraphs: replace single newlines with space, unless followed by bullet point, heading, or number
  text = text.replace(/(?<!\n)\n(?!\n|[-*•\u2022#]|\d+\.)/g, ' ');

  // Clean duplicate punctuation marks
  text = text.replace(/\s+([.,;:])/g, '$1');
  text = text.replace(/\.{2,}/g, '.');
  text = text.replace(/,\s*,/g, ',');

  // Normalize multi-spaces and excessive blank lines
  text = text.replace(/[ \t]+/g, ' ').replace(/\n{3,}/g, '\n\n').trim();

  // 10. Max length safety clamp (50,000 characters)
  if (text.length > 50000) {
    text = text.slice(0, 50000);
  }

  return text;
}
