<template>
  <div class="preview-page">

    <!-- ── Breadcrumb ──────────────────────────────────────────────────────── -->
    <nav class="preview-breadcrumb" aria-label="Breadcrumb">
      <ol class="preview-breadcrumb-list">
        <li><NuxtLink to="/">Home</NuxtLink></li>
        <li aria-hidden="true">›</li>
        <li><NuxtLink :to="`/styles/${styleSlug}`">{{ styleName }}</NuxtLink></li>
        <li aria-hidden="true">›</li>
        <li aria-current="page">{{ productName }}</li>
      </ol>
    </nav>

    <!-- ── 1. H1 + action row ──────────────────────────────────────────────── -->
    <div class="preview-header">
      <!-- H1 rendered server-side (SSR), critical for SEO — never moved to JS-only -->
      <h1 class="preview-h1">{{ pageTitle }}</h1>

      <div class="preview-header-meta">
        <span v-if="meta?.source" class="preview-source-badge"
              :class="`preview-source-badge--${meta.source}`">
          {{ meta.source }}
        </span>
        <span v-if="meta?.tags" class="preview-tags">
          <span v-for="tag in meta.tags" :key="tag" class="preview-tag">{{ tag }}</span>
        </span>
      </div>

      <!-- Action buttons -->
      <div class="preview-actions">
        <!-- Download MASTER.md (T04 component) -->
        <DownloadBtn
          :design-system="designSystem"
          :project-name="`${styleName} ${productName}`"
          :disabled="!designSystem"
        />

        <!-- Share / copy link button -->
        <button class="preview-share-btn" @click="copyLink">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <circle cx="11" cy="2.5" r="1.5" stroke="currentColor" stroke-width="1.3"/>
            <circle cx="11" cy="11.5" r="1.5" stroke="currentColor" stroke-width="1.3"/>
            <circle cx="3" cy="7" r="1.5" stroke="currentColor" stroke-width="1.3"/>
            <path d="M4.4 6.2l5.2-3M4.4 7.8l5.2 3" stroke="currentColor" stroke-width="1.3"
                  stroke-linecap="round"/>
          </svg>
          {{ shareCopied ? 'Copied!' : 'Share' }}
        </button>
      </div>
    </div>

    <!-- ── 2. iframe preview (full-width, 600px) ──────────────────────────── -->
    <div class="preview-iframe-wrap">
      <div v-if="!demoUrl" class="preview-iframe-placeholder">
        <p class="preview-iframe-placeholder-text">Demo not available yet</p>
      </div>
      <iframe
        v-else
        :src="demoUrl"
        class="preview-iframe"
        sandbox="allow-scripts allow-same-origin"
        :title="`${pageTitle} demo preview`"
        loading="lazy"
      />
    </div>

    <!-- ── 3. Demo Source Code (collapsible, SEO-friendly) ──────────── -->
    <details v-if="sourceCode" class="preview-source">
      <summary class="preview-source-summary">
        <svg width="14" height="14" viewBox="0 0 20 20" fill="none" stroke="currentColor"
             stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="7 13 11 9 7 5"/>
        </svg>
        View Demo Source Code
      </summary>
      <div class="preview-source-body">
        <pre class="preview-source-pre"><code class="hljs" v-html="highlightedCode" /></pre>
        <button class="preview-source-copy" @click="copySource">
          {{ sourceCopied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </details>

    <!-- ── 4. Ad C (728×90) below iframe ──────────────────────────────────── -->
    <div class="preview-ad-row">
      <AdSlot size="728x90" position="ad-mid-content" />
    </div>

    <!-- ── 5. Design System Parameters ───────────────────────────────────── -->
    <section class="preview-section" aria-labelledby="params-heading">
      <h2 id="params-heading" class="preview-h2">Design System Parameters</h2>

      <div class="preview-params-grid">
        <!-- Color swatches -->
        <div class="preview-param-block">
          <h3 class="preview-param-label">Color Palette</h3>
          <div v-if="meta?.colors" class="preview-swatches">
            <div
              v-for="(hex, role) in meta.colors"
              :key="role"
              class="preview-swatch"
              :title="`${role}: ${hex}`"
            >
              <span class="preview-swatch-dot" :style="{ background: hex }" />
              <div class="preview-swatch-info">
                <span class="preview-swatch-role">{{ role }}</span>
                <span class="preview-swatch-hex">{{ hex }}</span>
              </div>
            </div>
          </div>
          <div v-else-if="designSystem" class="preview-swatches">
            <div v-for="(hex, role) in colorEntries" :key="role" class="preview-swatch">
              <span class="preview-swatch-dot" :style="{ background: hex }" />
              <div class="preview-swatch-info">
                <span class="preview-swatch-role">{{ role }}</span>
                <span class="preview-swatch-hex">{{ hex }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Typography -->
        <div class="preview-param-block">
          <h3 class="preview-param-label">Typography</h3>
          <div v-if="meta?.fonts || designSystem" class="preview-fonts">
            <div class="preview-font-row">
              <span class="preview-font-role">Heading</span>
              <span class="preview-font-name">
                {{ meta?.fonts?.heading ?? designSystem?.typography.heading ?? '—' }}
              </span>
            </div>
            <div class="preview-font-row">
              <span class="preview-font-role">Body</span>
              <span class="preview-font-name">
                {{ meta?.fonts?.body ?? designSystem?.typography.body ?? '—' }}
              </span>
            </div>
          </div>
        </div>

        <!-- Best For / scene -->
        <div class="preview-param-block">
          <h3 class="preview-param-label">Best For</h3>
          <p class="preview-param-text">
            {{ designSystem?.style.bestFor ?? styleInfo?.bestFor ?? '—' }}
          </p>
          <div v-if="meta?.tags?.length" class="preview-tags" style="margin-top:8px">
            <span v-for="tag in meta.tags" :key="tag" class="preview-tag">{{ tag }}</span>
          </div>
        </div>

        <!-- Style characteristics -->
        <div class="preview-param-block">
          <h3 class="preview-param-label">Style Characteristics</h3>
          <dl class="preview-dl">
            <div class="preview-dl-row">
              <dt>Performance</dt>
              <dd>{{ designSystem?.style.performance ?? '—' }}</dd>
            </div>
            <div class="preview-dl-row">
              <dt>Accessibility</dt>
              <dd>{{ designSystem?.style.accessibility ?? '—' }}</dd>
            </div>
            <div class="preview-dl-row">
              <dt>Style type</dt>
              <dd>{{ designSystem?.style.type ?? '—' }}</dd>
            </div>
          </dl>
        </div>
      </div>
    </section>

    <!-- ── 6. How to Use (3 steps) ────────────────────────────────────────── -->
    <section class="preview-section" aria-labelledby="howto-heading">
      <h2 id="howto-heading" class="preview-h2">How to Use</h2>
      <ol class="preview-steps">
        <li class="preview-step">
          <span class="preview-step-num">1</span>
          <div class="preview-step-body">
            <strong class="preview-step-title">Choose Your Style</strong>
            <p class="preview-step-desc">
              Browse the style selector on the <NuxtLink to="/">home page</NuxtLink> and
              pick the combination that fits your product — or come back to this preview
              page directly via its URL.
            </p>
          </div>
        </li>
        <li class="preview-step">
          <span class="preview-step-num">2</span>
          <div class="preview-step-body">
            <strong class="preview-step-title">Download MASTER.md</strong>
            <p class="preview-step-desc">
              Click <em>Download MASTER.md</em> above. The file contains complete CSS
              tokens, component code, typography imports, and anti-pattern rules — ready
              to drop into your project.
            </p>
          </div>
        </li>
        <li class="preview-step">
          <span class="preview-step-num">3</span>
          <div class="preview-step-body">
            <strong class="preview-step-title">Add to Your AI Coding Tool</strong>
            <p class="preview-step-desc">
              Place <code>MASTER.md</code> in your project root.
              Claude Code, Cursor, and Windsurf will automatically read it as a design
              rule — every UI component generated will match your chosen style.
            </p>
          </div>
        </li>
      </ol>
    </section>

    <!-- ── 7. Ad D (728×90) above related ────────────────────────────────── -->
    <div class="preview-ad-row">
      <AdSlot size="728x90" position="ad-bottom" />
    </div>

    <!-- ── 8. Related Combinations ───────────────────────────────────────── -->
    <section class="preview-section" aria-labelledby="related-heading">
      <h2 id="related-heading" class="preview-h2">Related Combinations</h2>

      <div class="preview-related-grid">
        <!-- Same style, different products (up to 3) -->
        <div v-if="relatedByStyle.length" class="preview-related-group">
          <h3 class="preview-related-label">More {{ styleName }} styles</h3>
          <ul class="preview-related-list">
            <li v-for="item in relatedByStyle" :key="item.slug">
              <NuxtLink :to="`/preview/${item.slug}`" class="preview-related-link">
                <span class="preview-related-link-name">{{ item.style }} × {{ item.product }}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.4"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </NuxtLink>
            </li>
          </ul>
        </div>

        <!-- Same product, different styles (up to 3) -->
        <div v-if="relatedByProduct.length" class="preview-related-group">
          <h3 class="preview-related-label">{{ productName }} in other styles</h3>
          <ul class="preview-related-list">
            <li v-for="item in relatedByProduct" :key="item.slug">
              <NuxtLink :to="`/preview/${item.slug}`" class="preview-related-link">
                <span class="preview-related-link-name">{{ item.style }} × {{ item.product }}</span>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
                  <path d="M2 6h8M7 3l3 3-3 3" stroke="currentColor" stroke-width="1.4"
                        stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
              </NuxtLink>
            </li>
          </ul>
        </div>
      </div>

      <!-- Compare CTA -->
      <div v-if="compareLinks.length" class="preview-compare-row">
        <span class="preview-compare-label">Compare styles:</span>
        <NuxtLink
          v-for="link in compareLinks"
          :key="link.url"
          :to="link.url"
          class="preview-compare-link"
        >
          {{ link.label }}
        </NuxtLink>
      </div>
    </section>

    <!-- ── 9. Contributor credit ──────────────────────────────────────────── -->
    <!-- do-follow backlink per CONTRIBUTING.md, rel="noopener" only (no nofollow) -->
    <section
      v-if="contributor"
      class="preview-section preview-contributor"
      aria-label="Contributor credit"
    >
      <p class="preview-contributor-text">
        This demo was contributed by
        <a
          :href="contributor.url"
          target="_blank"
          rel="noopener"
          class="preview-contributor-link"
        >{{ contributor.name }} ↗</a>
        <template v-if="contributor.github">
          &nbsp;·&nbsp;
          <a
            :href="`https://github.com/${contributor.github}`"
            target="_blank"
            rel="noopener"
            class="preview-contributor-github"
          >@{{ contributor.github }}</a>
        </template>
      </p>
    </section>

  </div>
</template>

<script setup lang="ts">
import { useDemos, loadStyles, loadProducts, generateSlug } from '~/composables/useDemos'
import { useDesignSystem } from '~/composables/useDesignSystem'
import type { DesignSystem, DemoMeta, RawStyle, RawProduct } from '~/types/design-system'

// highlight.js: only load XML/HTML language to keep bundle small
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/github.css'
hljs.registerLanguage('xml', xml)

// ── Route params ──────────────────────────────────────────────────────────────
const route  = useRoute()
const slug   = computed(() => route.params.slug as string)

// ── Parse slug → style + product names ───────────────────────────────────────
// We load the full lists and find the best match for the slug.
// This runs on server (SSR) so H1 is present in HTML source.

interface RelatedItem { slug: string; style: string; product: string }

const styleName    = ref('')
const productName  = ref('')
const styleSlug    = ref('')
const meta         = ref<DemoMeta | null>(null)
const demoUrl      = ref<string | null>(null)
const designSystem  = ref<DesignSystem | null>(null)
const styleInfo    = ref<RawStyle | null>(null)
const relatedByStyle    = ref<RelatedItem[]>([])
const relatedByProduct  = ref<RelatedItem[]>([])
const sourceCode   = ref('')

const { resolveDemoInfo } = useDemos()
const { generateDesignSystem } = useDesignSystem()

// ── SSR data load ─────────────────────────────────────────────────────────────
// useAsyncData ensures this runs on the server so H1 is in HTML
const { data: pageData } = await useAsyncData(`preview-${slug.value}`, async () => {
  const [rawStyles, rawProducts] = await Promise.all([
    loadStyles(),
    loadProducts(),
  ])

  // Find matching style + product from slug
  let matchedStyle: RawStyle | null = null
  let matchedProduct: RawProduct | null = null
  let matchedStyleSlug = ''
  let matchedProductSlug = ''

  for (const s of rawStyles as RawStyle[]) {
    const ss = s['Style Category']
      .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
    if (slug.value.startsWith(ss)) {
      matchedStyle = s
      matchedStyleSlug = ss
      break
    }
  }

  if (matchedStyle) {
    const productPart = slug.value.slice(matchedStyleSlug.length + 1)
    for (const p of rawProducts as RawProduct[]) {
      const ps = p['Product Type']
        .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      if (ps === productPart || slug.value === `${matchedStyleSlug}-${ps}`) {
        matchedProduct = p
        matchedProductSlug = ps
        break
      }
    }
  }

  const sName = matchedStyle?.['Style Category'] ?? slug.value
  const pName = matchedProduct?.['Product Type'] ?? ''

  // Resolve demo URL + meta
  const info = await resolveDemoInfo(sName, pName)

  // Build related: same style, 3 different products
  const byStyle: RelatedItem[] = []
  if (matchedStyle) {
    for (const p of (rawProducts as RawProduct[]).slice(0, 20)) {
      const ps = p['Product Type']
        .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      if (ps === matchedProductSlug) continue
      byStyle.push({
        slug: `${matchedStyleSlug}-${ps}`,
        style: sName,
        product: p['Product Type'],
      })
      if (byStyle.length >= 3) break
    }
  }

  // Build related: same product, 3 different styles
  const byProduct: RelatedItem[] = []
  if (matchedProduct) {
    for (const s of (rawStyles as RawStyle[]).slice(0, 20)) {
      const ss = s['Style Category']
        .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
      if (ss === matchedStyleSlug) continue
      byProduct.push({
        slug: `${ss}-${matchedProductSlug}`,
        style: s['Style Category'],
        product: pName,
      })
      if (byProduct.length >= 3) break
    }
  }

  // Load demo source code (SSR: read directly; client: use $fetch fallback)
  let sourceCode = ''
  if (info.url) {
    if (import.meta.server) {
      try {
        const { readFileSync } = await import('node:fs')
        const { resolve } = await import('node:path')
        sourceCode = readFileSync(`${resolve(process.cwd())}/public${info.url}`, 'utf-8')
      } catch {
        sourceCode = ''
      }
    }
  }

  // Generate design system
  const query = `${sName} ${pName}`
  const ds = query.trim().length > 2
    ? await generateDesignSystem(query, `${sName} ${pName}`)
    : null

  return {
    styleName: sName,
    productName: pName,
    styleSlug: matchedStyleSlug,
    demoUrl: info.url,
    meta: info.meta,
    styleInfo: matchedStyle,
    relatedByStyle: byStyle,
    relatedByProduct: byProduct,
    designSystem: ds,
    sourceCode,
  }
})

// Hydrate refs from async data
if (pageData.value) {
  styleName.value        = pageData.value.styleName
  productName.value      = pageData.value.productName
  styleSlug.value        = pageData.value.styleSlug
  demoUrl.value          = pageData.value.demoUrl
  meta.value             = pageData.value.meta
  styleInfo.value        = pageData.value.styleInfo
  relatedByStyle.value   = pageData.value.relatedByStyle
  relatedByProduct.value = pageData.value.relatedByProduct
  designSystem.value     = pageData.value.designSystem
  sourceCode.value       = pageData.value.sourceCode ?? ''
}

// Client-side fallback: fetch source on navigation (SSR already loaded it)
watch(demoUrl, async (url) => {
  if (!url || sourceCode.value) return
  try {
    sourceCode.value = await $fetch<string>(url)
  } catch {
    sourceCode.value = ''
  }
}, { immediate: true })

// ── Derived values ────────────────────────────────────────────────────────────

const pageTitle = computed(() =>
  productName.value
    ? `${styleName.value} ${productName.value} UI Design`
    : `${styleName.value} UI Design`
)

const contributor = computed(() => meta.value?.contributor ?? null)

const colorEntries = computed(() => {
  if (!designSystem.value) return {}
  const c = designSystem.value.colors
  return {
    primary:    c.primary,
    secondary:  c.secondary,
    accent:     c.accent,
    background: c.background,
    foreground: c.foreground,
    muted:      c.muted,
    border:     c.border,
  }
})

// Compare links for top 2 other styles against current style
const compareLinks = computed(() =>
  relatedByProduct.value.slice(0, 2).map(item => ({
    label: `${styleName.value} vs ${item.style}`,
    url: `/compare/${styleSlug.value}-vs-${item.slug.split('-')[0]}`,
  }))
)

// Syntax-highlighted source code
const highlightedCode = computed(() => {
  if (!sourceCode.value) return ''
  return hljs.highlight(sourceCode.value, { language: 'xml' }).value
})

// ── Share / copy link ─────────────────────────────────────────────────────────
const shareCopied = ref(false)

async function copyLink() {
  try {
    await navigator.clipboard.writeText(window.location.href)
    shareCopied.value = true
    setTimeout(() => { shareCopied.value = false }, 2000)
  } catch {
    // Fallback: select from a temporary input
    const input = document.createElement('input')
    input.value = window.location.href
    document.body.appendChild(input)
    input.select()
    document.execCommand('copy')
    document.body.removeChild(input)
    shareCopied.value = true
    setTimeout(() => { shareCopied.value = false }, 2000)
  }
}

const sourceCopied = ref(false)

async function copySource() {
  try {
    await navigator.clipboard.writeText(sourceCode.value)
    sourceCopied.value = true
    setTimeout(() => { sourceCopied.value = false }, 2000)
  } catch {
    // noop
  }
}

// ── SEO head (all values available on server via useAsyncData) ────────────────
const canonicalUrl = computed(() =>
  `https://uimaster.cc/preview/${slug.value}`
)
const ogImage = computed(() =>
  meta.value
    ? `https://uimaster.cc/og/${slug.value}.png`
    : 'https://uimaster.cc/og-default.png'
)
const metaDescription = computed(() =>
  `Preview ${styleName.value} style ${productName.value} UI design. Download MASTER.md design system for Claude Code, Cursor, Windsurf.`
)
const metaKeywords = computed(() =>
  `${styleName.value}, ${productName.value}, UI design, design system, Claude Code, CSS template, MASTER.md`
)

useHead({
  title: `${pageTitle.value} - Preview & Download | uimaster.cc`,
  meta: [
    { name: 'description',        content: metaDescription.value },
    { name: 'keywords',           content: metaKeywords.value },
    // Open Graph
    { property: 'og:type',        content: 'website' },
    { property: 'og:title',       content: `${pageTitle.value} | uimaster.cc` },
    { property: 'og:description', content: metaDescription.value },
    { property: 'og:image',       content: ogImage.value },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height',content: '630' },
    { property: 'og:url',         content: canonicalUrl.value },
    // Twitter
    { name: 'twitter:card',       content: 'summary_large_image' },
    { name: 'twitter:title',      content: `${pageTitle.value} | uimaster.cc` },
    { name: 'twitter:description',content: metaDescription.value },
    { name: 'twitter:image',      content: ogImage.value },
  ],
  link: [
    { rel: 'canonical', href: canonicalUrl.value },
  ],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: pageTitle.value,
        description: metaDescription.value,
        url: canonicalUrl.value,
        keywords: metaKeywords.value,
        image: ogImage.value,
        publisher: {
          '@type': 'Organization',
          name: 'uimaster.cc',
          url: 'https://uimaster.cc',
        },
      }),
    },
  ],
})
</script>

<style scoped>
/* ── Page container ───────────────────────────────────────────────────────── */
.preview-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Breadcrumb ───────────────────────────────────────────────────────────── */
.preview-breadcrumb {
  margin-bottom: 20px;
}

.preview-breadcrumb-list {
  display: flex;
  align-items: center;
  gap: 6px;
  list-style: none;
  margin: 0;
  padding: 0;
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
}

.preview-breadcrumb-list a {
  color: var(--color-text-muted, #6B7280);
  text-decoration: none;
}

.preview-breadcrumb-list a:hover {
  color: var(--color-text, #111827);
  text-decoration: underline;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.preview-header {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 24px;
}

.preview-h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--color-primary, #1D1D1F);
  margin: 0;
  line-height: 1.2;
}

.preview-header-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-source-badge {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  padding: 2px 8px;
  border-radius: 9999px;
}

.preview-source-badge--official {
  background: #DBEAFE;
  color: #1E40AF;
}

.preview-source-badge--community {
  background: #D1FAE5;
  color: #065F46;
}

.preview-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.preview-tag {
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 9999px;
  background: var(--color-border, #E5E7EB);
  color: var(--color-text-muted, #6B7280);
}

/* Action row */
.preview-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.preview-actions > :first-child {
  flex: 1;
  max-width: 240px;
}

.preview-share-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 9px 16px;
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  background: var(--color-surface, #fff);
  color: var(--color-text-muted, #6B7280);
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: color 150ms ease, border-color 150ms ease;
}

.preview-share-btn:hover {
  color: var(--color-text, #111827);
  border-color: var(--color-text-muted, #6B7280);
}

/* ── iframe ───────────────────────────────────────────────────────────────── */
.preview-iframe-wrap {
  width: 100%;
  height: 600px;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 12px;
  overflow: hidden;
  background: var(--color-bg, #F8F9FA);
  margin-bottom: 20px;
}

.preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.preview-iframe-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-iframe-placeholder-text {
  font-size: 14px;
  color: var(--color-text-muted, #6B7280);
}

/* ── Ad rows ──────────────────────────────────────────────────────────────── */
.preview-ad-row {
  display: flex;
  justify-content: center;
  margin: 8px 0 24px;
}

/* ── Sections ─────────────────────────────────────────────────────────────── */
.preview-section {
  margin-bottom: 48px;
}

.preview-h2 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--color-primary, #1D1D1F);
  margin: 0 0 20px;
}

/* ── Design System Parameters ─────────────────────────────────────────────── */
.preview-params-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
}

.preview-param-block {
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
  padding: 18px 20px;
}

.preview-param-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-muted, #6B7280);
  margin: 0 0 12px;
}

/* Color swatches */
.preview-swatches {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.preview-swatch {
  display: flex;
  align-items: center;
  gap: 10px;
}

.preview-swatch-dot {
  width: 24px;
  height: 24px;
  border-radius: 6px;
  flex-shrink: 0;
  border: 1px solid rgba(0,0,0,0.08);
}

.preview-swatch-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.preview-swatch-role {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text, #111827);
  text-transform: capitalize;
}

.preview-swatch-hex {
  font-size: 11px;
  color: var(--color-text-muted, #6B7280);
  font-family: var(--font-mono, monospace);
}

/* Fonts */
.preview-fonts {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.preview-font-row {
  display: flex;
  align-items: baseline;
  gap: 10px;
}

.preview-font-role {
  font-size: 11px;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--color-text-muted, #6B7280);
  width: 52px;
  flex-shrink: 0;
}

.preview-font-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #111827);
}

/* Param text */
.preview-param-text {
  font-size: 13px;
  color: var(--color-text, #111827);
  line-height: 1.6;
  margin: 0;
}

/* DL */
.preview-dl {
  display: flex;
  flex-direction: column;
  gap: 8px;
  margin: 0;
}

.preview-dl-row {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 12px;
}

.preview-dl-row dt {
  font-size: 12px;
  color: var(--color-text-muted, #6B7280);
}

.preview-dl-row dd {
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text, #111827);
  margin: 0;
  text-align: right;
}

/* ── Steps ────────────────────────────────────────────────────────────────── */
.preview-steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.preview-step {
  display: flex;
  gap: 16px;
  align-items: flex-start;
}

.preview-step-num {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  background: var(--color-primary, #1D1D1F);
  color: #fff;
  font-size: 12px;
  font-weight: 700;
  flex-shrink: 0;
}

.preview-step-body {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-step-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #111827);
}

.preview-step-desc {
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  line-height: 1.6;
  margin: 0;
}

.preview-step-desc a {
  color: var(--color-accent, #3B82F6);
  text-decoration: none;
}

.preview-step-desc a:hover {
  text-decoration: underline;
}

.preview-step-desc code {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  background: var(--color-border, #E5E7EB);
  padding: 1px 5px;
  border-radius: 4px;
}

/* ── Related ──────────────────────────────────────────────────────────────── */
.preview-related-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 24px;
  margin-bottom: 20px;
}

.preview-related-group {}

.preview-related-label {
  font-size: 12px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  color: var(--color-text-muted, #6B7280);
  margin: 0 0 10px;
}

.preview-related-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.preview-related-link {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 9px 12px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  text-decoration: none;
  color: var(--color-text, #111827);
  font-size: 13px;
  transition: border-color 150ms ease, background 150ms ease;
}

.preview-related-link:hover {
  border-color: var(--color-text-muted, #6B7280);
  background: var(--color-bg, #F8F9FA);
}

.preview-related-link svg {
  color: var(--color-text-muted, #6B7280);
  flex-shrink: 0;
}

.preview-compare-row {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-compare-label {
  font-size: 12px;
  color: var(--color-text-muted, #6B7280);
}

.preview-compare-link {
  font-size: 12px;
  color: var(--color-accent, #3B82F6);
  text-decoration: none;
  padding: 3px 10px;
  border: 1px solid var(--color-accent, #3B82F6);
  border-radius: 9999px;
  transition: background 150ms ease, color 150ms ease;
}

.preview-compare-link:hover {
  background: var(--color-accent, #3B82F6);
  color: #fff;
}

/* ── Contributor ──────────────────────────────────────────────────────────── */
.preview-contributor {
  border-top: 1px solid var(--color-border, #E5E7EB);
  padding-top: 24px;
  margin-bottom: 0;
}

.preview-contributor-text {
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  margin: 0;
}

.preview-contributor-link {
  color: var(--color-text, #111827);
  font-weight: 600;
  text-decoration: none;
}

.preview-contributor-link:hover {
  text-decoration: underline;
}

.preview-contributor-github {
  color: var(--color-accent, #3B82F6);
  text-decoration: none;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
}

.preview-contributor-github:hover {
  text-decoration: underline;
}

/* ── Demo Source Code ──────────────────────────────────────────────────────── */
.preview-source {
  margin-bottom: 20px;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
  overflow: hidden;
  background: var(--color-surface, #fff);
}

.preview-source-summary {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text, #111827);
  cursor: pointer;
  user-select: none;
  list-style: none;
}

.preview-source-summary::-webkit-details-marker {
  display: none;
}

.preview-source-summary svg {
  transition: transform 150ms ease;
  color: var(--color-text-muted, #6B7280);
}

details[open] .preview-source-summary svg {
  transform: rotate(90deg);
}

.preview-source-summary:hover {
  background: var(--color-bg, #F8F9FA);
}

.preview-source-body {
  position: relative;
  border-top: 1px solid var(--color-border, #E5E7EB);
}

.preview-source-pre {
  margin: 0;
  padding: 16px;
  max-height: 480px;
  overflow: auto;
  background: #F8F9FA;
  font-size: 12px;
  line-height: 1.5;
  tab-size: 2;
}

.preview-source-pre code {
  font-family: var(--font-mono, 'SF Mono', 'Fira Code', monospace);
}

.preview-source-copy {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text-muted, #6B7280);
  cursor: pointer;
  font-family: inherit;
  opacity: 0;
  transition: opacity 150ms ease;
}

.preview-source-body:hover .preview-source-copy {
  opacity: 1;
}

.preview-source-copy:hover {
  color: var(--color-text, #111827);
  border-color: var(--color-text-muted, #6B7280);
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .preview-page {
    padding: 16px 16px 80px;
  }

  .preview-h1 {
    font-size: 20px;
  }

  .preview-actions > :first-child {
    max-width: none;
  }

  .preview-iframe-wrap {
    height: 420px;
    border-radius: 8px;
  }

  .preview-params-grid {
    grid-template-columns: 1fr;
  }

  .preview-related-grid {
    grid-template-columns: 1fr;
    gap: 20px;
  }

  .preview-ad-row {
    display: none; /* 728×90 hidden on mobile; AdSlot handles 320×50 in layout */
  }
}
</style>