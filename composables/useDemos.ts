// composables/useDemos.ts
// uimaster.cc — Demo file index management
//
// Provides slug generation and demo HTML URL resolution.
// Checks official/ first, then community/, returns null if neither exists.

import type { DemoMeta, RawStyle, RawProduct } from '~/types/design-system'

// ─── Slug generation (matches data-model.md spec) ────────────────────────────

export function generateSlug(style: string, product: string): string {
  const toSlug = (s: string) =>
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-')
      .trim()
  return `${toSlug(style)}-${toSlug(product)}`
}

// ─── Demo URL resolution ──────────────────────────────────────────────────────

export type DemoSource = 'official' | 'community' | null

export interface DemoInfo {
  slug: string
  url: string | null
  source: DemoSource
  meta: DemoMeta | null
}

// Cache fetched meta files to avoid duplicate requests
const metaCache = new Map<string, DemoMeta | null>()

async function fetchMeta(slug: string): Promise<DemoMeta | null> {
  if (metaCache.has(slug)) return metaCache.get(slug)!

  try {
    if (import.meta.server) {
      const { readFileSync } = await import('node:fs')
      const { resolve } = await import('node:path')
      const meta = JSON.parse(
        readFileSync(`${resolve(process.cwd())}/public/meta/${slug}.json`, 'utf-8')
      )
      metaCache.set(slug, meta)
      return meta
    }
    const meta = await $fetch<DemoMeta>(`/meta/${slug}.json`)
    metaCache.set(slug, meta)
    return meta
  } catch {
    metaCache.set(slug, null)
    return null
  }
}

// ─── Main composable ──────────────────────────────────────────────────────────

export function useDemos() {

  /**
   * Resolve a demo's URL and source for a given style + product combination.
   * Priority: official > community > null
   */
  async function resolveDemoInfo(style: string, product: string): Promise<DemoInfo> {
    const slug = generateSlug(style, product)
    const meta = await fetchMeta(slug)

    if (meta) {
      const source = meta.source ?? 'official'
      const url = `/demos/${source}/${slug}.html`
      return { slug, url, source, meta }
    }

    // No meta — try to guess official first, then community
    // (HEAD requests not available in all environments; return optimistic official)
    return {
      slug,
      url: `/demos/official/${slug}.html`,
      source: 'official',
      meta: null,
    }
  }

  /**
   * Build the full preview page URL for a style+product combo.
   */
  function previewUrl(style: string, product: string): string {
    return `/preview/${generateSlug(style, product)}`
  }

  /**
   * Build a compare page URL for two styles.
   */
  function compareUrl(style1: string, style2: string): string {
    const s1 = style1.toLowerCase().replace(/\s+/g, '-')
    const s2 = style2.toLowerCase().replace(/\s+/g, '-')
    return `/compare/${s1}-vs-${s2}`
  }

  return { resolveDemoInfo, previewUrl, compareUrl, generateSlug }
}

// ─── Style list loader ────────────────────────────────────────────────────────

let _styles: RawStyle[] | null = null
let _products: RawProduct[] | null = null

export async function loadStyles(): Promise<RawStyle[]> {
  if (_styles) return _styles

  if (import.meta.server) {
    // SSR: read file directly (Vite/Nitro mismatch prevents $fetch of public/ assets in dev)
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const root = resolve(process.cwd())
    _styles = JSON.parse(readFileSync(`${root}/public/data/styles.json`, 'utf-8'))
  } else {
    _styles = await $fetch<RawStyle[]>('/data/styles.json')
  }

  return _styles
}

export async function loadProducts(): Promise<RawProduct[]> {
  if (_products) return _products

  if (import.meta.server) {
    const { readFileSync } = await import('node:fs')
    const { resolve } = await import('node:path')
    const root = resolve(process.cwd())
    _products = JSON.parse(readFileSync(`${root}/public/data/products.json`, 'utf-8'))
  } else {
    _products = await $fetch<RawProduct[]>('/data/products.json')
  }

  return _products
}
