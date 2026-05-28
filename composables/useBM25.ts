// composables/useBM25.ts
// uimaster.cc — BM25 search engine
//
// Parameters MUST match official Python core.py exactly:
//   k1 = 1.5  (term frequency saturation)
//   b  = 0.75 (document length normalisation)
//
// tokenize() rule (aligned with official):
//   1. Convert to lowercase
//   2. Replace non-word chars with space (strip punctuation)
//   3. Split on whitespace
//   4. Filter tokens with length <= 2

import type { BM25Index, ScoredResult, UseBM25Return } from '~/types/design-system'

export function useBM25(k1 = 1.5, b = 0.75): UseBM25Return {

  /**
   * Tokenise a string exactly as the official Python version does.
   * Must stay in sync with core.py tokenize().
   */
  function tokenize(text: string): string[] {
    return String(text)
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')   // strip punctuation → space
      .split(/\s+/)                // split on whitespace
      .filter(w => w.length > 2)  // keep only len > 2  (official: > 2, not >= 2)
  }

  /**
   * Build an in-memory BM25 index from an array of document strings.
   * Returns the pre-computed IDF and corpus statistics needed for scoring.
   */
  function fit(documents: string[]): BM25Index {
    const corpus = documents.map(doc => tokenize(doc))
    const N = corpus.length

    if (N === 0) {
      return { corpus, docLengths: [], avgdl: 0, idf: {}, docFreqs: {}, N }
    }

    // Document lengths
    const docLengths = corpus.map(doc => doc.length)
    const avgdl = docLengths.reduce((acc, l) => acc + l, 0) / N

    // Document frequencies (how many docs contain each term)
    const docFreqs: Record<string, number> = {}
    for (const doc of corpus) {
      const seen = new Set<string>()
      for (const word of doc) {
        if (!seen.has(word)) {
          docFreqs[word] = (docFreqs[word] || 0) + 1
          seen.add(word)
        }
      }
    }

    // IDF — using the same formula as official Python BM25Okapi:
    //   idf(t) = log( (N - df(t) + 0.5) / (df(t) + 0.5) + 1 )
    const idf: Record<string, number> = {}
    for (const [word, df] of Object.entries(docFreqs)) {
      idf[word] = Math.log((N - df + 0.5) / (df + 0.5) + 1)
    }

    return { corpus, docLengths, avgdl, idf, docFreqs, N }
  }

  /**
   * Score all documents against a query.
   * Returns array of [docIndex, score] sorted descending by score.
   *
   * BM25 Okapi formula:
   *   score(d,q) = Σ idf(t) * tf(t,d) * (k1+1)
   *                              ───────────────────────────────────
   *                              tf(t,d) + k1*(1 - b + b*(|d|/avgdl))
   */
  function score(index: BM25Index, query: string): ScoredResult[] {
    if (index.N === 0) return []

    const queryTokens = tokenize(query)
    const results: ScoredResult[] = []

    for (let idx = 0; idx < index.corpus.length; idx++) {
      let s = 0
      const docLen = index.docLengths[idx]

      // Build term frequency map for this document
      const termFreqs: Record<string, number> = {}
      for (const word of index.corpus[idx]) {
        termFreqs[word] = (termFreqs[word] || 0) + 1
      }

      for (const token of queryTokens) {
        if (!(token in index.idf)) continue
        const tf = termFreqs[token] || 0
        if (tf === 0) continue

        const idfVal = index.idf[token]
        const numerator = tf * (k1 + 1)
        const denominator = tf + k1 * (1 - b + b * (docLen / index.avgdl))
        s += idfVal * (numerator / denominator)
      }

      results.push([idx, s])
    }

    // Sort descending
    return results.sort((a, b) => b[1] - a[1])
  }

  return { tokenize, fit, score }
}
