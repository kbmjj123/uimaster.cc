// composables/useDesignSystem.ts
// uimaster.cc — Design System Generator
//
// Loads public/data/*.json, runs BM25 across 5 domains, applies ui-reasoning
// inference rules, and assembles a DesignSystem object.
//
// Domain search order (matches official detect_domain logic):
//   style      → styles.json
//   product    → products.json
//   color      → colors.json
//   typography → typography.json
//   landing    → landing.json
//
// Result: the top-1 hit per domain (score > 0) merged into a DesignSystem.

import { useBM25 } from '~/composables/useBM25'
import type {
  DesignSystem,
  RawStyle,
  RawProduct,
  RawColorPalette,
  RawTypography,
  RawLanding,
  RawUiReasoning,
  UseDesignSystemReturn,
} from '~/types/design-system'

// ─── Domain keyword hints (aligned with official detect_domain) ───────────────
// Used to boost the query toward the right domain when the user's input is
// ambiguous. The actual ranking is always BM25; these are for domain routing.

const DOMAIN_KEYWORDS: Record<string, string[]> = {
  color: ['color', 'palette', 'hex', '#', 'rgb', 'token', 'dark', 'light'],
  style: ['style', 'design', 'ui', 'minimalism', 'glassmorphism', 'neumorphism',
          'brutalism', 'cyberpunk', 'retro', 'corporate', 'material', 'flat',
          'skeuomorphic', 'claymorphism', 'aurora'],
  typography: ['font', 'typography', 'heading', 'body', 'typeface', 'pairing',
               'serif', 'sans-serif', 'monospace', 'display'],
  product: ['saas', 'ecommerce', 'fintech', 'healthcare', 'gaming', 'portfolio',
            'dashboard', 'landing', 'blog', 'crm', 'analytics', 'social',
            'marketplace', 'app', 'platform'],
  landing: ['landing', 'page', 'hero', 'cta', 'conversion', 'sections'],
}

// ─── Max results per domain (matches official MAX_RESULTS = 3) ───────────────
const MAX_RESULTS = 3

// ─── Singleton cache so JSON is only fetched once per session ────────────────
let _cache: DataCache | null = null

interface DataCache {
  styles: RawStyle[]
  products: RawProduct[]
  colors: RawColorPalette[]
  typography: RawTypography[]
  landing: RawLanding[]
  reasoning: RawUiReasoning[]
}

async function loadData(): Promise<DataCache> {
  if (_cache) return _cache

  const [styles, products, colors, typography, landing, reasoning] = await Promise.all([
    $fetch<RawStyle[]>('/data/styles.json'),
    $fetch<RawProduct[]>('/data/products.json'),
    $fetch<RawColorPalette[]>('/data/colors.json'),
    $fetch<RawTypography[]>('/data/typography.json'),
    $fetch<RawLanding[]>('/data/landing.json'),
    // ui-reasoning.json is optional — gracefully fallback to empty array
    $fetch<RawUiReasoning[]>('/data/ui-reasoning.json').catch(() => []),
  ])

  _cache = { styles, products, colors, typography, landing, reasoning }
  return _cache
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function toSlug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .replace(/\s+/g, '-')
    .trim()
}

/** Pick top-N results with score > 0 */
function topResults<T>(
  items: T[],
  scores: Array<[number, number]>,
  n = MAX_RESULTS
): Array<{ item: T; score: number }> {
  return scores
    .slice(0, n)
    .filter(([, s]) => s > 0)
    .map(([idx, s]) => ({ item: items[idx], score: s }))
}

/** Build a BM25-searchable text representation for each domain row */
function styleToText(r: RawStyle): string {
  return [
    r['Style Category'], r['Type'], r['Keywords'],
    r['Primary Colors'], r['Best For'], r['AI Prompt Keywords'],
    r['CSS Keywords'], r['Effects/Animation'],
  ].join(' ')
}

function productToText(r: RawProduct): string {
  return [
    r['Product Type'], r['Keywords'],
    r['Primary Style Recommendation'], r['Secondary Styles'],
    r['Color Palette Focus'], r['Landing Page Pattern'],
  ].join(' ')
}

function colorToText(r: RawColorPalette): string {
  return [
    r['Product Type'], r['Notes'],
    r['primary'], r['accent'], r['background'],
  ].join(' ')
}

function typographyToText(r: RawTypography): string {
  return [
    r['Pairing Name'], r['Category'],
    r['Heading Font'], r['Body Font'],
    r['Mood Keywords'], r['Best For'], r['Notes'],
  ].join(' ')
}

function landingToText(r: RawLanding): string {
  return [
    r['Pattern Name'], r['Sections'],
    r['CTA Placement'], r['Color Strategy'],
    r['Best For'],
  ].join(' ')
}

// ─── ui-reasoning inference ───────────────────────────────────────────────────

/**
 * Apply the first matching reasoning rule to override/augment the assembled
 * DesignSystem. Rules are evaluated in order; first match wins (like official).
 */
function applyReasoning(
  ds: DesignSystem,
  rules: RawUiReasoning[],
  query: string
): DesignSystem {
  const q = query.toLowerCase()

  for (const rule of rules) {
    const condition = (rule['If'] || '').toLowerCase()
    if (!condition) continue

    // Simple keyword matching against the query + style name
    const targets = [q, ds.style.name.toLowerCase(), ds.category.toLowerCase()]
    const conditionWords = condition.split(/[\s,]+/).filter(Boolean)
    const matches = conditionWords.every(w => targets.some(t => t.includes(w)))

    if (matches) {
      // Apply style override
      if (rule['Then Style'] && rule['Then Style'].trim()) {
        ds = { ...ds, style: { ...ds.style, keywords: rule['Then Style'] } }
      }
      // Severity signal
      if (rule['Severity']) {
        ds = { ...ds, severity: rule['Severity'] }
      }
      // Decision rules (JSON string → object)
      if (rule['Decision Rules']) {
        try {
          const parsed = JSON.parse(rule['Decision Rules'])
          ds = { ...ds, decisionRules: { ...ds.decisionRules, ...parsed } }
        } catch {
          ds = { ...ds, decisionRules: { ...ds.decisionRules, raw: rule['Decision Rules'] } }
        }
      }
      break // first match wins
    }
  }

  return ds
}

// ─── Main composable ──────────────────────────────────────────────────────────

export function useDesignSystem(): UseDesignSystemReturn {
  const { fit, score } = useBM25()
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  /**
   * Generate a DesignSystem from a natural-language query.
   *
   * Steps:
   *   1. Load all JSON data (cached after first call)
   *   2. Build a BM25 index for each of the 5 domains
   *   3. Score the query against all domains
   *   4. Pick top-1 from each domain (score > 0)
   *   5. Apply ui-reasoning inference rules
   *   6. Assemble and return a DesignSystem
   */
  async function generateDesignSystem(
    query: string,
    projectName = 'My Project'
  ): Promise<DesignSystem | null> {
    if (!query.trim()) return null

    isLoading.value = true
    error.value = null

    try {
      const data = await loadData()

      // ── Build indices ──────────────────────────────────────────────────────
      const styleIndex = fit(data.styles.map(styleToText))
      const productIndex = fit(data.products.map(productToText))
      const colorIndex = fit(data.colors.map(colorToText))
      const typographyIndex = fit(data.typography.map(typographyToText))
      const landingIndex = fit(data.landing.map(landingToText))

      // ── Score each domain ──────────────────────────────────────────────────
      const styleResults    = topResults(data.styles,     score(styleIndex,      query), 1)
      const productResults  = topResults(data.products,   score(productIndex,    query), 1)
      const colorResults    = topResults(data.colors,     score(colorIndex,      query), 1)
      const typographyRes   = topResults(data.typography, score(typographyIndex, query), 1)
      const landingResults  = topResults(data.landing,    score(landingIndex,    query), 1)

      // ── Require at least a style or product match ──────────────────────────
      if (styleResults.length === 0 && productResults.length === 0) {
        error.value = 'No matching design system found for the given query.'
        return null
      }

      // ── Fallbacks: use first item if BM25 returned nothing ────────────────
      const rawStyle    = styleResults[0]?.item    ?? data.styles[0]
      const rawProduct  = productResults[0]?.item  ?? data.products[0]
      const rawColor    = colorResults[0]?.item    ?? data.colors[0]
      const rawTypo     = typographyRes[0]?.item   ?? data.typography[0]
      const rawLanding  = landingResults[0]?.item  ?? data.landing[0]

      // ── Assemble DesignSystem ─────────────────────────────────────────────
      let ds: DesignSystem = {
        projectName,
        category: rawProduct['Product Type'] ?? '',

        pattern: {
          name:          rawLanding?.['Pattern Name']   ?? '',
          sections:      rawLanding?.['Sections']       ?? '',
          ctaPlacement:  rawLanding?.['CTA Placement']  ?? '',
          colorStrategy: rawLanding?.['Color Strategy'] ?? '',
          conversion:    rawLanding?.['Conversion']     ?? '',
        },

        style: {
          name:          rawStyle['Style Category']      ?? '',
          type:          rawStyle['Type']                ?? '',
          effects:       rawStyle['Effects/Animation']   ?? '',
          keywords:      rawStyle['Keywords']            ?? '',
          bestFor:       rawStyle['Best For']            ?? '',
          performance:   rawStyle['Performance']         ?? '',
          accessibility: rawStyle['Accessibility']       ?? '',
          lightMode:     rawStyle['Light Mode']          ?? '',
          darkMode:      rawStyle['Dark Mode']           ?? '',
        },

        colors: {
          primary:     rawColor?.['primary']          ?? '#000000',
          onPrimary:   rawColor?.['on-primary']       ?? '#ffffff',
          secondary:   rawColor?.['secondary']        ?? '#333333',
          accent:      rawColor?.['accent']           ?? '#3B82F6',
          background:  rawColor?.['background']       ?? '#ffffff',
          foreground:  rawColor?.['foreground']       ?? '#111827',
          muted:       rawColor?.['muted']            ?? '#F3F4F6',
          border:      rawColor?.['border']           ?? '#E5E7EB',
          destructive: rawColor?.['destructive']      ?? '#EF4444',
          ring:        rawColor?.['ring']             ?? '#3B82F6',
          notes:       rawColor?.['Notes']            ?? '',
          // derived
          cta:         rawColor?.['accent']           ?? '#3B82F6',
          text:        rawColor?.['foreground']       ?? '#111827',
        },

        typography: {
          heading:       rawTypo?.['Heading Font']     ?? 'Inter',
          body:          rawTypo?.['Body Font']         ?? 'Inter',
          mood:          rawTypo?.['Mood Keywords']     ?? '',
          bestFor:       rawTypo?.['Best For']          ?? '',
          googleFontsUrl: rawTypo?.['Google Fonts URL'] ?? '',
          cssImport:     rawTypo?.['CSS Import']        ?? '',
        },

        keyEffects:   rawStyle['Effects/Animation'] ?? '',
        antiPatterns: rawStyle['Implementation Checklist'] ?? '',
        decisionRules: {},
        severity: 'medium',
      }

      // ── Apply reasoning rules ─────────────────────────────────────────────
      if (data.reasoning.length > 0) {
        ds = applyReasoning(ds, data.reasoning, query)
      }

      return ds

    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err)
      error.value = `Failed to generate design system: ${msg}`
      return null
    } finally {
      isLoading.value = false
    }
  }

  return { generateDesignSystem, isLoading, error }
}

// ─── Slug helper (re-exported for convenience) ────────────────────────────────
export { toSlug }
