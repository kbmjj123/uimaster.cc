<template>
  <div class="style-page">

    <!-- ── Breadcrumb ──────────────────────────────────────────────────────── -->
    <nav class="style-breadcrumb" aria-label="Breadcrumb">
      <ol class="style-breadcrumb-list">
        <li><NuxtLink to="/">Home</NuxtLink></li>
        <li aria-hidden="true">›</li>
        <li aria-current="page">{{ styleInfo.name }}</li>
      </ol>
    </nav>

    <!-- ── Header ─────────────────────────────────────────────────────────── -->
    <div class="style-header">
      <div class="style-header-left">
        <h1 class="style-h1">{{ styleInfo.name }} UI Design</h1>
        <div class="style-header-meta">
          <span class="style-type-badge">{{ styleInfo.type }}</span>
          <span class="style-header-count">{{ demoGrid.length }} demos</span>
        </div>
        <p class="style-header-desc">
          Explore every product type built with the
          <strong>{{ styleInfo.name }}</strong> design style.
          Click any demo to preview and download the <code>MASTER.md</code>
          design system for Claude Code, Cursor, or Windsurf.
        </p>
      </div>

      <!-- Quick stats strip -->
      <div class="style-stats">
        <div class="style-stat">
          <span class="style-stat-label">Performance</span>
          <span class="style-stat-value"
                :class="`style-stat-value--${ratingClass(styleInfo.performance)}`">
            {{ styleInfo.performance || '—' }}
          </span>
        </div>
        <div class="style-stat">
          <span class="style-stat-label">Accessibility</span>
          <span class="style-stat-value"
                :class="`style-stat-value--${ratingClass(styleInfo.accessibility)}`">
            {{ styleInfo.accessibility || '—' }}
          </span>
        </div>
        <div class="style-stat">
          <span class="style-stat-label">Light mode</span>
          <span class="style-stat-value style-stat-value--neutral">
            {{ styleInfo.lightMode || '—' }}
          </span>
        </div>
        <div class="style-stat">
          <span class="style-stat-label">Dark mode</span>
          <span class="style-stat-value style-stat-value--neutral">
            {{ styleInfo.darkMode || '—' }}
          </span>
        </div>
      </div>
    </div>

    <!-- ── Technical parameters ───────────────────────────────────────────── -->
    <section class="style-section" aria-labelledby="params-heading">
      <h2 id="params-heading" class="style-h2">Style Parameters</h2>
      <div class="style-params-grid">

        <div class="style-param-card">
          <h3 class="style-param-label">Keywords</h3>
          <div class="style-keywords">
            <span
              v-for="kw in keywordList"
              :key="kw"
              class="style-keyword-chip"
            >{{ kw }}</span>
          </div>
        </div>

        <div class="style-param-card">
          <h3 class="style-param-label">Key Effects & Techniques</h3>
          <ul class="style-effects-list">
            <li v-for="fx in effectsList" :key="fx">{{ fx }}</li>
          </ul>
        </div>

        <div class="style-param-card">
          <h3 class="style-param-label">Best For</h3>
          <p class="style-param-text">{{ styleInfo.bestFor || '—' }}</p>
        </div>

        <div class="style-param-card">
          <h3 class="style-param-label">Implementation Checklist</h3>
          <ul class="style-checklist">
            <li v-for="item in checklistItems" :key="item">{{ item }}</li>
          </ul>
        </div>

      </div>
    </section>

    <!-- ── Demo thumbnail grid ────────────────────────────────────────────── -->
    <section class="style-section" aria-labelledby="demos-heading">
      <div class="style-section-header">
        <h2 id="demos-heading" class="style-h2">
          {{ styleInfo.name }} × All Product Types
        </h2>
        <!-- Filter -->
        <div class="style-filter">
          <input
            v-model="filterQuery"
            class="style-filter-input"
            placeholder="Filter product types…"
            aria-label="Filter product types"
          >
        </div>
      </div>

      <div
        v-if="filteredGrid.length"
        class="style-demo-grid"
        role="list"
      >
        <NuxtLink
          v-for="item in filteredGrid"
          :key="item.slug"
          :to="`/preview/${item.slug}`"
          class="style-demo-card"
          role="listitem"
          :aria-label="`${styleInfo.name} ${item.productName} demo`"
        >
          <!-- Thumbnail 200×130 lazy -->
          <div class="style-demo-thumb">
            <img
              :src="`/meta/${item.slug}-thumbnail.png`"
              :alt="`${styleInfo.name} ${item.productName} UI thumbnail`"
              class="style-demo-img"
              loading="lazy"
              width="200"
              height="130"
              @error="onImgError"
            >
            <!-- Fallback placeholder -->
            <div class="style-demo-thumb-fallback" aria-hidden="true">
              <span>⬡</span>
            </div>
            <!-- Hover overlay -->
            <div class="style-demo-overlay">
              <span class="style-demo-overlay-cta">
                Preview →
              </span>
            </div>
          </div>

          <!-- Card footer -->
          <div class="style-demo-info">
            <span class="style-demo-product">{{ item.productName }}</span>
            <span v-if="item.source === 'community'" class="style-demo-community">
              community
            </span>
          </div>
        </NuxtLink>
      </div>

      <div v-else class="style-demo-empty">
        <p>No demos found for "{{ filterQuery }}"</p>
      </div>
    </section>

    <!-- ── Compare / related styles ──────────────────────────────────────── -->
    <section class="style-section" aria-labelledby="related-heading">
      <h2 id="related-heading" class="style-h2">Compare with Other Styles</h2>

      <div class="style-related-grid">
        <NuxtLink
          v-for="rel in relatedStyles"
          :key="rel.slug"
          :to="`/compare/${styleSlug}-vs-${rel.slug}`"
          class="style-related-card"
        >
          <div class="style-related-card-names">
            <span class="style-related-name">{{ styleInfo.name }}</span>
            <span class="style-related-vs">vs</span>
            <span class="style-related-name">{{ rel.name }}</span>
          </div>
          <div class="style-related-card-meta">
            <span class="style-related-type">{{ rel.type }}</span>
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.5"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </div>
        </NuxtLink>
      </div>

      <!-- All styles browse link -->
      <div class="style-all-styles">
        <NuxtLink to="/" class="style-all-styles-link">
          ← Browse all styles on the home page
        </NuxtLink>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { loadStyles, loadProducts, generateSlug } from '~/composables/useDemos'
import type { RawStyle, RawProduct } from '~/types/design-system'

// ── Route ─────────────────────────────────────────────────────────────────────
const route     = useRoute()
const styleSlug = computed(() => route.params.style as string)

// ── Types ─────────────────────────────────────────────────────────────────────
interface StyleInfo {
  name:                  string
  type:                  string
  keywords:              string
  effectsAnimation:      string
  bestFor:               string
  performance:           string
  accessibility:         string
  lightMode:             string
  darkMode:              string
  implementationChecklist: string
}

interface DemoItem {
  slug:        string
  productName: string
  source:      'official' | 'community'
}

interface RelatedStyle {
  slug: string
  name: string
  type: string
}

// ── Defaults ──────────────────────────────────────────────────────────────────
const emptyStyle: StyleInfo = {
  name: '', type: '', keywords: '', effectsAnimation: '',
  bestFor: '', performance: '', accessibility: '',
  lightMode: '', darkMode: '', implementationChecklist: '',
}

// ── SSR data load ─────────────────────────────────────────────────────────────
const { data: pageData } = await useAsyncData(`style-${styleSlug.value}`, async () => {
  const [rawStyles, rawProducts] = await Promise.all([loadStyles(), loadProducts()])

  // Find matching style
  let matched: RawStyle | null = null
  for (const r of rawStyles as RawStyle[]) {
    const rs = r['Style Category']
      .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
    if (rs === styleSlug.value) { matched = r; break }
  }

  const info: StyleInfo = matched ? {
    name:                    matched['Style Category'],
    type:                    matched['Type'] || '',
    keywords:                matched['Keywords'] || '',
    effectsAnimation:        matched['Effects/Animation'] || '',
    bestFor:                 matched['Best For'] || '',
    performance:             matched['Performance'] || '',
    accessibility:           matched['Accessibility'] || '',
    lightMode:               matched['Light Mode'] || '',
    darkMode:                matched['Dark Mode'] || '',
    implementationChecklist: matched['Implementation Checklist'] || '',
  } : emptyStyle

  // Build demo grid: style × all products
  const demos: DemoItem[] = (rawProducts as RawProduct[]).map(p => {
    const productName = p['Product Type']
    const slug = generateSlug(info.name || styleSlug.value, productName)
    return { slug, productName, source: 'official' }
  })

  // Same-type related styles (up to 6, excluding self)
  const related: RelatedStyle[] = (rawStyles as RawStyle[])
    .filter(r => {
      const rs = r['Style Category']
        .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      return rs !== styleSlug.value
    })
    .slice(0, 6)
    .map(r => ({
      slug: r['Style Category']
        .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-'),
      name: r['Style Category'],
      type: r['Type'] || '',
    }))

  return { info, demos, related }
})

// ── Reactive refs from SSR data ───────────────────────────────────────────────
const styleInfo    = computed(() => pageData.value?.info    ?? emptyStyle)
const demoGrid     = computed(() => pageData.value?.demos   ?? [])
const relatedStyles = computed(() => pageData.value?.related ?? [])

// ── Filter ────────────────────────────────────────────────────────────────────
const filterQuery = ref('')

const filteredGrid = computed(() => {
  const q = filterQuery.value.trim().toLowerCase()
  if (!q) return demoGrid.value
  return demoGrid.value.filter(d => d.productName.toLowerCase().includes(q))
})

// ── Parsed lists from comma/newline delimited strings ─────────────────────────
function parseList(str: string): string[] {
  return str
    .split(/[,\n+]/)
    .map(s => s.trim())
    .filter(Boolean)
}

const keywordList     = computed(() => parseList(styleInfo.value.keywords).slice(0, 12))
const effectsList     = computed(() => parseList(styleInfo.value.effectsAnimation).slice(0, 8))
const checklistItems  = computed(() => parseList(styleInfo.value.implementationChecklist).slice(0, 8))

// ── Rating colour helper ──────────────────────────────────────────────────────
function ratingClass(val: string): string {
  const v = (val || '').toLowerCase()
  if (v.includes('high') || v.includes('excellent') || v.includes('good')) return 'high'
  if (v.includes('low')  || v.includes('poor'))                             return 'low'
  return 'medium'
}

// ── Img error: show fallback placeholder ─────────────────────────────────────
function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  const fallback = img.nextElementSibling as HTMLElement | null
  if (fallback) fallback.style.display = 'flex'
}

// ── SEO ───────────────────────────────────────────────────────────────────────
const canonicalUrl = computed(() => `https://uimaster.cc/styles/${styleSlug.value}`)
const metaTitle    = computed(() =>
  `${styleInfo.value.name} UI Design — ${demoGrid.value.length} Demos | uimaster.cc`
)
const metaDesc     = computed(() =>
  `Explore ${demoGrid.value.length} ${styleInfo.value.name} UI demos across every product type. ` +
  `Preview live, download MASTER.md for Claude Code, Cursor, and Windsurf. ` +
  `${styleInfo.value.bestFor}`
)
const metaKeywords = computed(() =>
  `${styleInfo.value.name} UI design, ${styleInfo.value.name} landing page, ` +
  `${styleInfo.value.name} design system, ${styleInfo.value.type} UI, ` +
  `${styleInfo.value.keywords.split(',').slice(0, 4).join(', ')}`
)

useHead({
  title: metaTitle.value,
  meta: [
    { name: 'description',         content: metaDesc.value },
    { name: 'keywords',            content: metaKeywords.value },
    { property: 'og:type',         content: 'website' },
    { property: 'og:title',        content: metaTitle.value },
    { property: 'og:description',  content: metaDesc.value },
    { property: 'og:url',          content: canonicalUrl.value },
    { property: 'og:image',        content: `https://uimaster.cc/meta/${styleSlug.value}-thumbnail.png` },
    { name: 'twitter:card',        content: 'summary_large_image' },
    { name: 'twitter:title',       content: metaTitle.value },
    { name: 'twitter:description', content: metaDesc.value },
  ],
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'CollectionPage',
      name: metaTitle.value,
      description: metaDesc.value,
      url: canonicalUrl.value,
      keywords: metaKeywords.value,
    }),
  }],
})
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */
.style-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Breadcrumb ───────────────────────────────────────────────────────────── */
.style-breadcrumb { margin-bottom: 20px; }
.style-breadcrumb-list {
  display: flex; align-items: center; gap: 6px;
  list-style: none; margin: 0; padding: 0;
  font-size: 13px; color: var(--color-text-muted, #6B7280);
}
.style-breadcrumb-list a { color: var(--color-text-muted); text-decoration: none; }
.style-breadcrumb-list a:hover { color: var(--color-text, #111827); text-decoration: underline; }

/* ── Header ───────────────────────────────────────────────────────────────── */
.style-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 32px;
  margin-bottom: 40px;
  flex-wrap: wrap;
}

.style-header-left {
  display: flex;
  flex-direction: column;
  gap: 10px;
  flex: 1;
  min-width: 260px;
}

.style-h1 {
  font-size: 30px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--color-primary, #1D1D1F);
  margin: 0;
  line-height: 1.2;
}

.style-header-meta {
  display: flex;
  align-items: center;
  gap: 10px;
}

.style-type-badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 9px;
  border-radius: 9999px;
  background: var(--color-border, #E5E7EB);
  color: var(--color-text-muted, #6B7280);
}

.style-header-count {
  font-size: 12px;
  color: var(--color-text-muted, #6B7280);
}

.style-header-desc {
  font-size: 14px;
  color: var(--color-text-muted, #6B7280);
  line-height: 1.65;
  margin: 0;
  max-width: 520px;
}

.style-header-desc code {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  background: var(--color-border, #E5E7EB);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--color-text, #111827);
}

/* Stats strip */
.style-stats {
  display: flex;
  flex-direction: column;
  gap: 10px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 12px;
  padding: 18px 22px;
  min-width: 220px;
  align-self: flex-start;
}

.style-stat {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.style-stat-label {
  font-size: 12px;
  color: var(--color-text-muted, #6B7280);
  white-space: nowrap;
}

.style-stat-value {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: 9999px;
}

.style-stat-value--high    { background: #D1FAE5; color: #065F46; }
.style-stat-value--medium  { background: #FEF3C7; color: #92400E; }
.style-stat-value--low     { background: #FEE2E2; color: #991B1B; }
.style-stat-value--neutral {
  background: var(--color-border, #E5E7EB);
  color: var(--color-text-muted, #6B7280);
  font-weight: 400;
  font-size: 11px;
}

/* ── Section common ───────────────────────────────────────────────────────── */
.style-section { margin-bottom: 52px; }

.style-h2 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--color-primary, #1D1D1F);
  margin: 0 0 20px;
}

.style-section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.style-section-header .style-h2 { margin: 0; }

/* ── Params grid ──────────────────────────────────────────────────────────── */
.style-params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.style-param-card {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
  padding: 18px 20px;
}

.style-param-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-muted, #6B7280);
  margin: 0 0 12px;
}

.style-keywords {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.style-keyword-chip {
  font-size: 12px;
  padding: 3px 10px;
  border-radius: 9999px;
  background: var(--color-bg, #F8F9FA);
  border: 1px solid var(--color-border, #E5E7EB);
  color: var(--color-text, #111827);
}

.style-effects-list,
.style-checklist {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.style-effects-list li,
.style-checklist li {
  font-size: 13px;
  color: var(--color-text, #111827);
  line-height: 1.5;
  padding-left: 16px;
  position: relative;
}

.style-effects-list li::before {
  content: '⚡';
  position: absolute;
  left: 0;
  font-size: 10px;
}

.style-checklist li::before {
  content: '✓';
  position: absolute;
  left: 0;
  font-size: 11px;
  color: #16a34a;
  font-weight: 700;
}

.style-param-text {
  font-size: 13px;
  color: var(--color-text, #111827);
  line-height: 1.6;
  margin: 0;
}

/* ── Filter input ─────────────────────────────────────────────────────────── */
.style-filter-input {
  padding: 7px 12px;
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  font-size: 13px;
  font-family: inherit;
  color: var(--color-text, #111827);
  background: var(--color-surface, #fff);
  outline: none;
  width: 200px;
  transition: border-color 150ms ease;
}

.style-filter-input:focus {
  border-color: var(--color-primary, #1D1D1F);
}

.style-filter-input::placeholder {
  color: var(--color-text-muted, #6B7280);
}

/* ── Demo grid ────────────────────────────────────────────────────────────── */
.style-demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 16px;
}

.style-demo-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
  overflow: hidden;
  text-decoration: none;
  background: var(--color-surface, #fff);
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
}

.style-demo-card:hover {
  border-color: var(--color-text-muted, #6B7280);
  box-shadow: 0 4px 16px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.style-demo-card:focus-visible {
  outline: 2px solid var(--color-accent, #3B82F6);
  outline-offset: 2px;
}

/* Thumbnail 200×130 */
.style-demo-thumb {
  position: relative;
  width: 100%;
  height: 130px;
  background: var(--color-bg, #F8F9FA);
  overflow: hidden;
  flex-shrink: 0;
}

.style-demo-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 200ms ease;
}

.style-demo-card:hover .style-demo-img {
  transform: scale(1.03);
}

/* Fallback placeholder (hidden until img error) */
.style-demo-thumb-fallback {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: var(--color-border, #E5E7EB);
  font-size: 24px;
  color: var(--color-text-muted, #6B7280);
}

/* Hover overlay */
.style-demo-overlay {
  position: absolute;
  inset: 0;
  background: rgba(17, 24, 39, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 180ms ease;
}

.style-demo-card:hover .style-demo-overlay {
  opacity: 1;
}

.style-demo-overlay-cta {
  font-size: 13px;
  font-weight: 600;
  color: #fff;
  letter-spacing: 0.02em;
}

/* Card footer */
.style-demo-info {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 12px;
  gap: 6px;
}

.style-demo-product {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text, #111827);
  line-height: 1.3;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.style-demo-community {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 1px 6px;
  border-radius: 9999px;
  background: #D1FAE5;
  color: #065F46;
  flex-shrink: 0;
}

.style-demo-empty {
  padding: 48px 24px;
  text-align: center;
  color: var(--color-text-muted, #6B7280);
  font-size: 14px;
}

/* ── Related styles grid ──────────────────────────────────────────────────── */
.style-related-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
  margin-bottom: 24px;
}

.style-related-card {
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 14px 16px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
  text-decoration: none;
  transition: border-color 150ms ease, background 150ms ease;
}

.style-related-card:hover {
  border-color: var(--color-text-muted, #6B7280);
  background: var(--color-bg, #F8F9FA);
}

.style-related-card-names {
  display: flex;
  align-items: center;
  gap: 6px;
}

.style-related-name {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text, #111827);
}

.style-related-vs {
  font-size: 11px;
  font-weight: 700;
  color: var(--color-text-muted, #6B7280);
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.style-related-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.style-related-type {
  font-size: 11px;
  color: var(--color-text-muted, #6B7280);
}

.style-related-card-meta svg {
  color: var(--color-text-muted, #6B7280);
  transition: transform 150ms ease;
}

.style-related-card:hover .style-related-card-meta svg {
  transform: translateX(3px);
}

/* All styles link */
.style-all-styles { text-align: center; }

.style-all-styles-link {
  font-size: 13px;
  color: var(--color-accent, #3B82F6);
  text-decoration: none;
}

.style-all-styles-link:hover { text-decoration: underline; }

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .style-page { padding: 16px 16px 80px; }

  .style-h1 { font-size: 22px; }

  .style-header { flex-direction: column; gap: 20px; }

  .style-stats {
    width: 100%;
    flex-direction: row;
    flex-wrap: wrap;
    gap: 12px;
    padding: 14px 16px;
  }

  .style-stat { flex: 1; min-width: 120px; }

  .style-params-grid { grid-template-columns: 1fr; }

  .style-demo-grid {
    grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
  }

  .style-demo-thumb { height: 100px; }

  .style-related-grid { grid-template-columns: 1fr; }

  .style-filter-input { width: 100%; }

  .style-section-header { flex-direction: column; align-items: flex-start; }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .style-demo-grid {
    grid-template-columns: repeat(auto-fill, minmax(180px, 1fr));
  }

  .style-related-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>