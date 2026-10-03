// src/lib/copy-detection.ts
// N-gram based verbatim copy ratio detection between article and summary

/**
 * Tokenize a text into lowercase word tokens, stripping punctuation.
 */
export function tokenizeWords(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .split(/\s+/)
    .filter(Boolean);
}

/**
 * Extract word n-grams from token array.
 */
export function extractNgrams(tokens: string[], n: number): string[] {
  if (tokens.length < n) return [];
  const ngrams: string[] = [];
  for (let i = 0; i <= tokens.length - n; i++) {
    ngrams.push(tokens.slice(i, i + n).join(' '));
  }
  return ngrams;
}

/**
 * Compute the fraction of summary n-grams that appear verbatim in the article.
 * Defaults to 4-grams as specified in the spec.
 * Returns a number between 0 and 1.
 */
export function computeCopyRatio(
  article: string,
  summary: string,
  ngramSize = 4
): number {
  if (!summary || !summary.trim() || !article || !article.trim()) {
    return 0;
  }

  const summaryTokens = tokenizeWords(summary);
  const articleTokens = tokenizeWords(article);

  if (summaryTokens.length === 0 || articleTokens.length === 0) {
    return 0;
  }

  // Adjust n if summary is very short
  const effectiveN = Math.min(ngramSize, Math.max(1, summaryTokens.length));

  const summaryNgrams = extractNgrams(summaryTokens, effectiveN);
  if (summaryNgrams.length === 0) {
    return 0;
  }

  const articleNgrams = new Set(extractNgrams(articleTokens, effectiveN));

  let matchedCount = 0;
  for (const gram of summaryNgrams) {
    if (articleNgrams.has(gram)) {
      matchedCount++;
    }
  }

  const ratio = matchedCount / summaryNgrams.length;
  return Math.min(1, Math.max(0, Number(ratio.toFixed(4))));
}
