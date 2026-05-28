<template>
  <div class="compare-page">

    <!-- ── Breadcrumb ──────────────────────────────────────────────────────── -->
    <nav class="compare-breadcrumb" aria-label="Breadcrumb">
      <ol class="compare-breadcrumb-list">
        <li><NuxtLink to="/">Home</NuxtLink></li>
        <li aria-hidden="true">›</li>
        <li aria-current="page">Compare Styles</li>
      </ol>
    </nav>

    <!-- ── 1. H1 + subtitle (SSR) ─────────────────────────────────────────── -->
    <div class="compare-header">
      <h1 class="compare-h1">{{ pageH1 }}</h1>
      <p class="compare-subtitle">
        Side-by-side UI preview — switch product type to see how each style adapts.
        Download <code>MASTER.md</code> for Claude Code, Cursor, or Windsurf.
      </p>
    </div>

    <!-- ── 2. Shared product selector ─────────────────────────────────────── -->
    <div class="compare-product-bar">
      <label class="compare-product-label" for="compare-product-select">
        Product type:
      </label>
      <div class="compare-product-select-wrap">
        <svg class="compare-product-select-icon" width="14" height="14" viewBox="0 0 16 16"
             fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
          <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
        </svg>
        <input
          id="compare-product-select"
          v-model="productSearch"
          class="compare-product-input"
          placeholder="Search product type…"
          autocomplete="off"
          aria-label="Select product type for comparison"
          @focus="productDropdownOpen = true"
          @keydown.escape="productDropdownOpen = false"
          @keydown.enter.prevent="selectFirstProduct"
          @keydown.arrow-down.prevent="productHighlight = Math.min(productHighlight + 1, filteredProducts.length - 1)"
          @keydown.arrow-up.prevent="productHighlight = Math.max(productHighlight - 1, 0)"
        >
        <span v-if="selectedProductName" class="compare-product-selected">
          {{ selectedProductName }}
          <button class="compare-product-clear" aria-label="Clear product" @click="clearProduct">
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.4"
                    stroke-linecap="round"/>
            </svg>
          </button>
        </span>

        <!-- Dropdown -->
        <Transition name="dropdown">
          <div
            v-if="productDropdownOpen && filteredProducts.length"
            class="compare-product-dropdown"
            role="listbox"
          >
            <button
              v-for="(p, idx) in filteredProducts.slice(0, 30)"
              :key="p.slug"
              class="compare-product-option"
              :class="{
                'compare-product-option--selected': selectedProduct === p.slug,
                'compare-product-option--highlighted': productHighlight === idx,
              }"
              role="option"
              :aria-selected="selectedProduct === p.slug"
              @mouseenter="productHighlight = idx"
              @click="selectProduct(p)"
            >
              {{ p.name }}
            </button>
          </div>
        </Transition>
      </div>
    </div>

    <!-- ── 3. Side-by-side iframes ─────────────────────────────────────────── -->
    <div class="compare-frames">

      <!-- Left pane -->
      <div class="compare-pane">
        <div class="compare-pane-header">
          <span class="compare-pane-style-name">{{ style1.name }}</span>
          <span class="compare-pane-badge">{{ style1.type }}</span>
        </div>
        <div class="compare-iframe-wrap">
          <Transition name="iframe-fade" mode="out-in">
            <iframe
              v-if="demoUrl1"
              :key="demoUrl1"
              :src="demoUrl1"
              class="compare-iframe"
              sandbox="allow-scripts allow-same-origin"
              :title="`${style1.name} ${selectedProductName} UI preview`"
              loading="lazy"
              @load="loading1 = false"
            />
            <div v-else class="compare-iframe-placeholder">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity="0.3"
                   aria-hidden="true">
                <rect x="3" y="5" width="26" height="18" rx="2" stroke="currentColor"
                      stroke-width="1.4"/>
                <path d="M11 27h10M16 23v4" stroke="currentColor" stroke-width="1.4"
                      stroke-linecap="round"/>
              </svg>
              <p>{{ selectedProduct ? 'Demo coming soon' : 'Select a product type' }}</p>
            </div>
          </Transition>
          <div v-if="loading1 && demoUrl1" class="compare-iframe-loading">
            <div class="compare-spinner" />
          </div>
        </div>
        <!-- Download for style 1 -->
        <div class="compare-pane-download">
          <DownloadBtn
            :design-system="ds1"
            :project-name="`${style1.name} ${selectedProductName}`"
            :disabled="!ds1"
          />
        </div>
      </div>

      <!-- VS divider -->
      <div class="compare-vs" aria-hidden="true">VS</div>

      <!-- Right pane -->
      <div class="compare-pane">
        <div class="compare-pane-header">
          <span class="compare-pane-style-name">{{ style2.name }}</span>
          <span class="compare-pane-badge">{{ style2.type }}</span>
        </div>
        <div class="compare-iframe-wrap">
          <Transition name="iframe-fade" mode="out-in">
            <iframe
              v-if="demoUrl2"
              :key="demoUrl2"
              :src="demoUrl2"
              class="compare-iframe"
              sandbox="allow-scripts allow-same-origin"
              :title="`${style2.name} ${selectedProductName} UI preview`"
              loading="lazy"
              @load="loading2 = false"
            />
            <div v-else class="compare-iframe-placeholder">
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" opacity="0.3"
                   aria-hidden="true">
                <rect x="3" y="5" width="26" height="18" rx="2" stroke="currentColor"
                      stroke-width="1.4"/>
                <path d="M11 27h10M16 23v4" stroke="currentColor" stroke-width="1.4"
                      stroke-linecap="round"/>
              </svg>
              <p>{{ selectedProduct ? 'Demo coming soon' : 'Select a product type' }}</p>
            </div>
          </Transition>
          <div v-if="loading2 && demoUrl2" class="compare-iframe-loading">
            <div class="compare-spinner" />
          </div>
        </div>
        <!-- Download for style 2 -->
        <div class="compare-pane-download">
          <DownloadBtn
            :design-system="ds2"
            :project-name="`${style2.name} ${selectedProductName}`"
            :disabled="!ds2"
          />
        </div>
      </div>
    </div>

    <!-- ── 4. Comparison table ─────────────────────────────────────────────── -->
    <section class="compare-section" aria-labelledby="compare-table-heading">
      <h2 id="compare-table-heading" class="compare-h2">
        {{ style1.name }} vs {{ style2.name }} — At a Glance
      </h2>

      <div class="compare-table-wrap">
        <table class="compare-table" aria-label="Style comparison table">
          <thead>
            <tr>
              <th class="compare-table-th compare-table-th--dim" scope="col">Dimension</th>
              <th class="compare-table-th" scope="col">{{ style1.name }}</th>
              <th class="compare-table-th" scope="col">{{ style2.name }}</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="row in comparisonRows" :key="row.dim" class="compare-table-row">
              <td class="compare-table-td compare-table-td--dim">{{ row.dim }}</td>
              <td class="compare-table-td">
                <span
                  v-if="row.ratingKey"
                  class="compare-rating"
                  :class="`compare-rating--${ratingClass(row.val1)}`"
                >
                  {{ row.val1 || '—' }}
                </span>
                <span v-else class="compare-table-text">{{ row.val1 || '—' }}</span>
              </td>
              <td class="compare-table-td">
                <span
                  v-if="row.ratingKey"
                  class="compare-rating"
                  :class="`compare-rating--${ratingClass(row.val2)}`"
                >
                  {{ row.val2 || '—' }}
                </span>
                <span v-else class="compare-table-text">{{ row.val2 || '—' }}</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- ── 5. SEO text block ───────────────────────────────────────────────── -->
    <section class="compare-section compare-seo-text" aria-labelledby="compare-seo-heading">
      <h2 id="compare-seo-heading" class="compare-h2">
        When to Choose {{ style1.name }} vs {{ style2.name }}
      </h2>
      <div class="compare-choice-grid">
        <div class="compare-choice-card">
          <h3 class="compare-choice-title">Choose {{ style1.name }} when…</h3>
          <p class="compare-choice-desc">{{ style1.bestFor || style1.keywords }}</p>
        </div>
        <div class="compare-choice-card">
          <h3 class="compare-choice-title">Choose {{ style2.name }} when…</h3>
          <p class="compare-choice-desc">{{ style2.bestFor || style2.keywords }}</p>
        </div>
      </div>
    </section>

    <!-- ── 6. Related compare links ───────────────────────────────────────── -->
    <section class="compare-section" aria-labelledby="compare-related-heading">
      <h2 id="compare-related-heading" class="compare-h2">More Style Comparisons</h2>
      <div class="compare-related-links">
        <NuxtLink
          v-for="link in relatedCompares"
          :key="link.url"
          :to="link.url"
          class="compare-related-chip"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { loadStyles, loadProducts, generateSlug } from '~/composables/useDemos'
import { useDesignSystem } from '~/composables/useDesignSystem'
import type { DesignSystem, RawStyle, RawProduct } from '~/types/design-system'

// ── Route ─────────────────────────────────────────────────────────────────────
const route = useRoute()
const slug  = computed(() => route.params.slug as string)  // e.g. "glassmorphism-vs-neumorphism"

// ── Parse slug: "[style1]-vs-[style2]" ───────────────────────────────────────
interface StyleInfo {
  slug:          string
  name:          string
  type:          string
  keywords:      string
  bestFor:       string
  performance:   string
  accessibility: string
  cssKeywords:   string
}

const style1 = ref<StyleInfo>({ slug:'', name:'', type:'', keywords:'', bestFor:'',
                                 performance:'', accessibility:'', cssKeywords:'' })
const style2 = ref<StyleInfo>({ slug:'', name:'', type:'', keywords:'', bestFor:'',
                                 performance:'', accessibility:'', cssKeywords:'' })

interface ProductItem { slug: string; name: string }
const allProducts       = ref<ProductItem[]>([])
const selectedProduct   = ref<string>('')
const productSearch     = ref<string>('')
const productDropdownOpen = ref(false)
const productHighlight  = ref(0)

const ds1 = ref<DesignSystem | null>(null)
const ds2 = ref<DesignSystem | null>(null)
const loading1 = ref(false)
const loading2 = ref(false)

const { generateDesignSystem } = useDesignSystem()

// ── SSR data: parse slug, load style data ─────────────────────────────────────
const { data: pageData } = await useAsyncData(`compare-${slug.value}`, async () => {
  const [rawStyles, rawProducts] = await Promise.all([loadStyles(), loadProducts()])

  // Parse "style1slug-vs-style2slug"
  const vsIdx = slug.value.indexOf('-vs-')
  const slug1 = vsIdx !== -1 ? slug.value.slice(0, vsIdx) : slug.value
  const slug2 = vsIdx !== -1 ? slug.value.slice(vsIdx + 4) : ''

  function findStyle(s: string): (RawStyle & { _slug: string }) | null {
    for (const r of rawStyles as RawStyle[]) {
      const rs = r['Style Category']
        .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      if (rs === s) return { ...r, _slug: rs }
    }
    return null
  }

  const r1 = findStyle(slug1)
  const r2 = findStyle(slug2)

  function toInfo(r: (RawStyle & { _slug: string }) | null): StyleInfo {
    if (!r) return { slug:'', name:'', type:'', keywords:'', bestFor:'',
                     performance:'', accessibility:'', cssKeywords:'' }
    return {
      slug:          r._slug,
      name:          r['Style Category'],
      type:          r['Type'] || '',
      keywords:      r['Keywords'] || '',
      bestFor:       r['Best For'] || '',
      performance:   r['Performance'] || '',
      accessibility: r['Accessibility'] || '',
      cssKeywords:   r['CSS Keywords'] || '',
    }
  }

  const products: ProductItem[] = (rawProducts as RawProduct[]).map(p => ({
    slug: p['Product Type'].toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-'),
    name: p['Product Type'],
  }))

  // Build related compare suggestions: each style vs 3 other random styles
  const otherStyles = (rawStyles as RawStyle[])
    .filter(r => {
      const rs = r['Style Category']
        .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      return rs !== slug1 && rs !== slug2
    })
    .slice(0, 6)

  const related = otherStyles.map(r => {
    const rs = r['Style Category']
      .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
    return {
      label: `${r1?.['Style Category'] ?? slug1} vs ${r['Style Category']}`,
      url: `/compare/${slug1}-vs-${rs}`,
    }
  })

  return { s1: toInfo(r1), s2: toInfo(r2), products, related }
})

if (pageData.value) {
  style1.value      = pageData.value.s1
  style2.value      = pageData.value.s2
  allProducts.value = pageData.value.products
}

const relatedCompares = computed(() => pageData.value?.related ?? [])

// ── Product selector logic ────────────────────────────────────────────────────
const filteredProducts = computed(() => {
  const q = productSearch.value.trim().toLowerCase()
  if (!q) return allProducts.value
  return allProducts.value.filter(p => p.name.toLowerCase().includes(q))
})

const selectedProductName = computed(
  () => allProducts.value.find(p => p.slug === selectedProduct.value)?.name ?? ''
)

function selectProduct(p: ProductItem) {
  selectedProduct.value    = p.slug
  productSearch.value      = ''
  productDropdownOpen.value = false
  productHighlight.value   = 0
}

function selectFirstProduct() {
  if (filteredProducts.value.length) selectProduct(filteredProducts.value[productHighlight.value])
}

function clearProduct() {
  selectedProduct.value = ''
  productSearch.value   = ''
}

// Close dropdown on outside click
onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))
const productBarRef = ref<HTMLElement | null>(null)
function onOutside(e: MouseEvent) {
  const bar = document.querySelector('.compare-product-bar')
  if (bar && !bar.contains(e.target as Node)) productDropdownOpen.value = false
}

// ── Demo URLs (linked, react to selectedProduct) ──────────────────────────────
const demoUrl1 = computed(() => {
  if (!selectedProduct.value || !style1.value.name) return null
  return `/demos/official/${generateSlug(style1.value.name, selectedProductName.value)}.html`
})

const demoUrl2 = computed(() => {
  if (!selectedProduct.value || !style2.value.name) return null
  return `/demos/official/${generateSlug(style2.value.name, selectedProductName.value)}.html`
})

// Show loading state when URL changes
watch(demoUrl1, (v) => { if (v) loading1.value = true })
watch(demoUrl2, (v) => { if (v) loading2.value = true })

// ── Generate design systems when product selected ─────────────────────────────
watch(selectedProduct, async (slug) => {
  if (!slug) { ds1.value = null; ds2.value = null; return }
  const pName = selectedProductName.value
  ;[ds1.value, ds2.value] = await Promise.all([
    generateDesignSystem(`${style1.value.name} ${pName}`),
    generateDesignSystem(`${style2.value.name} ${pName}`),
  ])
})

// ── Comparison table rows (data from styles.json) ─────────────────────────────
interface CompareRow {
  dim:      string
  val1:     string
  val2:     string
  ratingKey?: boolean
}

const comparisonRows = computed<CompareRow[]>(() => [
  {
    dim: 'Style Type',
    val1: style1.value.type,
    val2: style2.value.type,
  },
  {
    dim: 'Performance',
    val1: style1.value.performance,
    val2: style2.value.performance,
    ratingKey: true,
  },
  {
    dim: 'Accessibility',
    val1: style1.value.accessibility,
    val2: style2.value.accessibility,
    ratingKey: true,
  },
  {
    dim: 'Best For',
    val1: style1.value.bestFor,
    val2: style2.value.bestFor,
  },
  {
    dim: 'Key Effects',
    val1: style1.value.keywords.split(',').slice(0, 3).join(', '),
    val2: style2.value.keywords.split(',').slice(0, 3).join(', '),
  },
  {
    dim: 'CSS Approach',
    val1: style1.value.cssKeywords.split(',').slice(0, 3).join(', '),
    val2: style2.value.cssKeywords.split(',').slice(0, 3).join(', '),
  },
])

// Map rating text to colour class (high/medium/low)
function ratingClass(val: string): string {
  const v = (val || '').toLowerCase()
  if (v.includes('high') || v.includes('excellent') || v.includes('good')) return 'high'
  if (v.includes('low')  || v.includes('poor'))                             return 'low'
  return 'medium'
}

// ── Derived page copy ─────────────────────────────────────────────────────────
const pageH1 = computed(() =>
  style1.value.name && style2.value.name
    ? `${style1.value.name} vs ${style2.value.name} UI Design`
    : 'Compare UI Styles'
)

// ── SEO ───────────────────────────────────────────────────────────────────────
const canonicalUrl  = computed(() => `https://uimaster.cc/compare/${slug.value}`)
const metaTitle     = computed(() => `${pageH1.value} — Preview & Compare | uimaster.cc`)
const metaDesc      = computed(() =>
  `Compare ${style1.value.name} and ${style2.value.name} UI design side by side. ` +
  `Live previews, performance, accessibility, and MASTER.md download for Claude Code, Cursor, Windsurf.`
)
const metaKeywords  = computed(() =>
  `${style1.value.name} vs ${style2.value.name}, ${style1.value.name} UI, ` +
  `${style2.value.name} UI, UI design comparison, design system, Claude Code`
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
    { property: 'og:image',        content: 'https://uimaster.cc/og-default.png' },
    { name: 'twitter:card',        content: 'summary_large_image' },
    { name: 'twitter:title',       content: metaTitle.value },
    { name: 'twitter:description', content: metaDesc.value },
  ],
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'WebPage',
      name: pageH1.value,
      description: metaDesc.value,
      url: canonicalUrl.value,
      keywords: metaKeywords.value,
    }),
  }],
})
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */
.compare-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Breadcrumb ───────────────────────────────────────────────────────────── */
.compare-breadcrumb { margin-bottom: 20px; }
.compare-breadcrumb-list {
  display: flex; align-items: center; gap: 6px;
  list-style: none; margin: 0; padding: 0;
  font-size: 13px; color: var(--color-text-muted, #6B7280);
}
.compare-breadcrumb-list a { color: var(--color-text-muted); text-decoration: none; }
.compare-breadcrumb-list a:hover { color: var(--color-text, #111827); text-decoration: underline; }

/* ── Header ───────────────────────────────────────────────────────────────── */
.compare-header {
  margin-bottom: 28px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.compare-h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--color-primary, #1D1D1F);
  margin: 0;
  line-height: 1.2;
}

.compare-subtitle {
  font-size: 14px;
  color: var(--color-text-muted, #6B7280);
  line-height: 1.6;
  margin: 0;
  max-width: 600px;
}

.compare-subtitle code {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  background: var(--color-border, #E5E7EB);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--color-text, #111827);
}

/* ── Product bar ──────────────────────────────────────────────────────────── */
.compare-product-bar {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.compare-product-label {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted, #6B7280);
  white-space: nowrap;
}

.compare-product-select-wrap {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  min-width: 280px;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.compare-product-select-wrap:focus-within {
  border-color: var(--color-primary, #1D1D1F);
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.07);
}

.compare-product-select-icon {
  color: var(--color-text-muted, #6B7280);
  flex-shrink: 0;
}

.compare-product-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--color-text, #111827);
  font-family: inherit;
  flex: 1;
  min-width: 0;
}

.compare-product-input::placeholder {
  color: var(--color-text-muted, #6B7280);
}

.compare-product-selected {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-primary, #1D1D1F);
  white-space: nowrap;
}

.compare-product-clear {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: var(--color-text-muted, #6B7280);
  display: flex;
  align-items: center;
  transition: color 150ms ease;
}

.compare-product-clear:hover { color: var(--color-text, #111827); }

.compare-product-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
  z-index: 100;
  max-height: 240px;
  overflow-y: auto;
  padding: 4px;
}

.compare-product-option {
  display: block;
  width: 100%;
  padding: 8px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  cursor: pointer;
  transition: background 100ms ease;
  font-family: inherit;
}

.compare-product-option--highlighted,
.compare-product-option:hover {
  background: var(--color-bg, #F8F9FA);
  color: var(--color-text, #111827);
}

.compare-product-option--selected {
  font-weight: 500;
  color: var(--color-primary, #1D1D1F);
}

/* Dropdown transition */
.dropdown-enter-active, .dropdown-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}
.dropdown-enter-from, .dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}

/* ── Side-by-side frames ──────────────────────────────────────────────────── */
.compare-frames {
  display: grid;
  grid-template-columns: 1fr auto 1fr;
  gap: 0;
  align-items: start;
  margin-bottom: 48px;
}

.compare-pane {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.compare-pane-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding-bottom: 4px;
}

.compare-pane-style-name {
  font-size: 16px;
  font-weight: 700;
  color: var(--color-primary, #1D1D1F);
}

.compare-pane-badge {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 9999px;
  background: var(--color-border, #E5E7EB);
  color: var(--color-text-muted, #6B7280);
  font-weight: 500;
}

/* iframe container */
.compare-iframe-wrap {
  position: relative;
  width: 100%;
  height: 520px;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-bg, #F8F9FA);
}

.compare-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.compare-iframe-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 10px;
  color: var(--color-text-muted, #6B7280);
}

.compare-iframe-placeholder p {
  font-size: 13px;
  margin: 0;
}

.compare-iframe-loading {
  position: absolute;
  inset: 0;
  background: rgba(248, 249, 250, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.compare-spinner {
  width: 24px;
  height: 24px;
  border: 2.5px solid var(--color-border, #E5E7EB);
  border-top-color: var(--color-primary, #1D1D1F);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.compare-pane-download {
  /* DownloadBtn fills the pane width */
}

/* VS divider */
.compare-vs {
  width: 48px;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  padding-top: 48px;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.08em;
  color: var(--color-text-muted, #6B7280);
  user-select: none;
}

/* iframe fade transition */
.iframe-fade-enter-active, .iframe-fade-leave-active {
  transition: opacity 200ms ease;
}
.iframe-fade-enter-from, .iframe-fade-leave-to { opacity: 0; }

/* ── Sections ─────────────────────────────────────────────────────────────── */
.compare-section { margin-bottom: 48px; }

.compare-h2 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--color-primary, #1D1D1F);
  margin: 0 0 20px;
}

/* ── Comparison table ─────────────────────────────────────────────────────── */
.compare-table-wrap {
  overflow-x: auto;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
}

.compare-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 13px;
}

.compare-table-th {
  padding: 12px 16px;
  background: var(--color-bg, #F8F9FA);
  font-weight: 600;
  color: var(--color-text, #111827);
  text-align: left;
  border-bottom: 1px solid var(--color-border, #E5E7EB);
  white-space: nowrap;
}

.compare-table-th--dim {
  color: var(--color-text-muted, #6B7280);
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  width: 140px;
}

.compare-table-row:not(:last-child) td {
  border-bottom: 1px solid var(--color-border, #E5E7EB);
}

.compare-table-td {
  padding: 12px 16px;
  color: var(--color-text, #111827);
  vertical-align: top;
  line-height: 1.5;
}

.compare-table-td--dim {
  color: var(--color-text-muted, #6B7280);
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

.compare-table-text {
  font-size: 13px;
}

/* Rating badge */
.compare-rating {
  display: inline-flex;
  align-items: center;
  padding: 2px 9px;
  border-radius: 9999px;
  font-size: 11px;
  font-weight: 600;
}

.compare-rating--high {
  background: #D1FAE5;
  color: #065F46;
}

.compare-rating--medium {
  background: #FEF3C7;
  color: #92400E;
}

.compare-rating--low {
  background: #FEE2E2;
  color: #991B1B;
}

/* ── Choice cards ─────────────────────────────────────────────────────────── */
.compare-choice-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
}

.compare-choice-card {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
  padding: 20px 22px;
}

.compare-choice-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-primary, #1D1D1F);
  margin: 0 0 8px;
}

.compare-choice-desc {
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  line-height: 1.6;
  margin: 0;
}

/* ── Related compare chips ────────────────────────────────────────────────── */
.compare-related-links {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.compare-related-chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 14px;
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 9999px;
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  text-decoration: none;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
}

.compare-related-chip:hover {
  border-color: var(--color-primary, #1D1D1F);
  color: var(--color-primary, #1D1D1F);
  background: var(--color-bg, #F8F9FA);
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .compare-page { padding: 16px 16px 80px; }

  .compare-h1 { font-size: 20px; }

  /* Stack iframes vertically on mobile */
  .compare-frames {
    grid-template-columns: 1fr;
    gap: 24px;
  }

  .compare-vs {
    padding: 0;
    width: 100%;
    justify-content: center;
    font-size: 14px;
  }

  .compare-iframe-wrap { height: 380px; }

  .compare-product-select-wrap { min-width: 0; flex: 1; }

  .compare-product-bar { gap: 8px; }

  .compare-choice-grid {
    grid-template-columns: 1fr;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .compare-iframe-wrap { height: 420px; }
}
</style>