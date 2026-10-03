// src/lib/text-cleaning.ts
// Cleans extracted article text, removes noise, and sanitizes input

/**
 * Clean and sanitize article text:
 * - Strips control characters and null bytes (Phase 7.6)
 * - Removes running headers, footers, and page numbers
 * - Truncates references/bibliography sections
 * - Normalizes excessive whitespace
 * - Enforces 50,000 char limit (Phase 7.6)
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

  // 4. Strip references/bibliography if located in the latter part of the text
  const refIndex = text.search(/\n\s*(?:references|bibliography|works cited)\s*\n/i);
  if (refIndex > 300) {
    // Only truncate if the reference section is after substantive content
    text = text.slice(0, refIndex).trim();
  }

  // 5. Normalize multi-spaces and excessive blank lines
  text = text
    .split('\n')
    .map((line) => line.replace(/[ \t]+/g, ' ').trim())
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();

  // 6. Max length safety clamp (50,000 characters)
  if (text.length > 50000) {
    text = text.slice(0, 50000);
  }

  return text;
}
