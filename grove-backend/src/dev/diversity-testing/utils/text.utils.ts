/**
 * Text analysis utility functions for diversity testing
 */

/**
 * Extract n-grams from text
 */
export function extractNgrams(text: string, n: number): string[] {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 0);

  const ngrams: string[] = [];
  for (let i = 0; i <= words.length - n; i++) {
    ngrams.push(words.slice(i, i + n).join(' '));
  }

  return ngrams;
}

/**
 * Extract trigrams (3-word sequences)
 */
export function extractTrigrams(text: string): string[] {
  return extractNgrams(text, 3);
}

/**
 * Count n-gram occurrences
 */
export function countNgrams(ngrams: string[]): Map<string, number> {
  const counts = new Map<string, number>();
  for (const ngram of ngrams) {
    counts.set(ngram, (counts.get(ngram) || 0) + 1);
  }
  return counts;
}

/**
 * Get top N most frequent n-grams
 */
export function getTopNgrams(
  counts: Map<string, number>,
  n: number
): Array<{ ngram: string; count: number }> {
  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([ngram, count]) => ({ ngram, count }));
}

/**
 * Extract keywords (simple version - words > 4 chars)
 */
export function extractKeywords(text: string): Set<string> {
  const words = text
    .toLowerCase()
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 4);

  return new Set(words);
}
