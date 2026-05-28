# BM25 Engine — 搜索引擎实现规范

## 核心原则

JS 版 BM25 必须与官方 Python 版（core.py）行为完全一致。
相同输入 → 相同输出，这是 MASTER.md 和预览效果一致性的技术保证。

---

## 算法参数（不可修改）

```typescript
const BM25_CONFIG = {
  k1: 1.5,   // 词频饱和参数，必须与官方一致
  b: 0.75    // 文档长度归一化参数，必须与官方一致
}
```

---

## tokenize 规则（必须与官方一致）

```typescript
function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^\w\s]/g, ' ')   // 去标点
    .split(/\s+/)                // 按空白分割
    .filter(w => w.length > 2)  // 过滤长度 <= 2 的词
}
```

---

## 完整实现

```typescript
// composables/useBM25.ts

interface BM25Index {
  corpus: string[][]
  docLengths: number[]
  avgdl: number
  idf: Record<string, number>
  docFreqs: Record<string, number>
  N: number
}

export function useBM25(k1 = 1.5, b = 0.75) {
  
  function tokenize(text: string): string[] {
    return String(text)
      .toLowerCase()
      .replace(/[^\w\s]/g, ' ')
      .split(/\s+/)
      .filter(w => w.length > 2)
  }

  function fit(documents: string[]): BM25Index {
    const corpus = documents.map(doc => tokenize(doc))
    const N = corpus.length
    
    if (N === 0) {
      return { corpus, docLengths: [], avgdl: 0, idf: {}, docFreqs: {}, N }
    }
    
    const docLengths = corpus.map(doc => doc.length)
    const avgdl = docLengths.reduce((a, b) => a + b, 0) / N
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

    const idf: Record<string, number> = {}
    for (const [word, freq] of Object.entries(docFreqs)) {
      idf[word] = Math.log((N - freq + 0.5) / (freq + 0.5) + 1)
    }

    return { corpus, docLengths, avgdl, idf, docFreqs, N }
  }

  function score(index: BM25Index, query: string): Array<[number, number]> {
    const queryTokens = tokenize(query)
    const scores: Array<[number, number]> = []

    for (let idx = 0; idx < index.corpus.length; idx++) {
      let s = 0
      const docLen = index.docLengths[idx]
      const termFreqs: Record<string, number> = {}
      
      for (const word of index.corpus[idx]) {
        termFreqs[word] = (termFreqs[word] || 0) + 1
      }

      for (const token of queryTokens) {
        if (token in index.idf) {
          const tf = termFreqs[token] || 0
          const idfVal = index.idf[token]
          const numerator = tf * (k1 + 1)
          const denominator = tf + k1 * (1 - b + b * docLen / index.avgdl)
          s += idfVal * numerator / denominator
        }
      }

      scores.push([idx, s])
    }

    return scores.sort((a, b) => b[1] - a[1])
  }

  return { tokenize, fit, score }
}
```

---

## domain 检测规则

与官方 `detect_domain` 函数保持一致，关键词列表不可随意修改：

```typescript
// composables/useDesignSystem.ts
const DOMAIN_KEYWORDS: Record<string, string[]> = {
  color: ['color', 'palette', 'hex', '#', 'rgb', 'token'],
  style: ['style', 'design', 'ui', 'minimalism', 'glassmorphism', 'neumorphism'],
  typography: ['font pairing', 'typography pairing', 'heading font', 'body font'],
  product: ['saas', 'ecommerce', 'fintech', 'healthcare', 'gaming', 'portfolio'],
  // ... 完整列表见官方 core.py detect_domain 函数
}
```

---

## 搜索结果截断规则

```typescript
const MAX_RESULTS = 3

// 只返回 score > 0 的结果，与官方一致
const results = ranked
  .slice(0, MAX_RESULTS)
  .filter(([_, score]) => score > 0)
```

---

## 验证方式

实现完成后，必须用以下组合验证输出与官方 Python 版一致：

```bash
# Python 版输出
python3 search.py "fintech dashboard dark" --design-system -f markdown

# JS 版输出（在浏览器控制台）
generateDesignSystem('fintech dashboard dark')
```

对比两份输出，确认风格、配色、字体的排序完全一致。
