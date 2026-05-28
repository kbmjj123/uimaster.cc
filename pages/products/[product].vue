<script setup lang="ts">
import { computed, ref } from 'vue'

// ─── Route ───────────────────────────────────────────────────────────────────
const route = useRoute()
const productSlug = computed(() => route.params.product as string)

// ─── Data ────────────────────────────────────────────────────────────────────
// Load product metadata from public/data/products.json
const { data: productsData } = await useAsyncData('products', () =>
  $fetch('/data/products.json')
)

// Load styles metadata from public/data/styles.json
const { data: stylesData } = await useAsyncData('styles', () =>
  $fetch('/data/styles.json')
)

// Resolve current product
const product = computed(() => {
  if (!productsData.value) return null
  return (productsData.value as any[]).find(
    (p: any) => p.slug === productSlug.value || slugify(p.name) === productSlug.value
  ) ?? null
})

// All styles, sorted: primary recommendation first
const sortedStyles = computed(() => {
  if (!stylesData.value || !product.value) return []
  const all = stylesData.value as any[]
  const primary = product.value.primary_style_recommendation ?? ''
  return [...all].sort((a, b) => {
    const aMatch = slugify(a.name) === slugify(primary) ? -1 : 0
    const bMatch = slugify(b.name) === slugify(primary) ? -1 : 0
    return aMatch - bMatch
  })
})

// Friendly display name for the product
const productDisplayName = computed(() => product.value?.name ?? formatSlug(productSlug.value))

// Primary recommended style (for badge logic)
const primaryStyleSlug = computed(() => {
  const rec = product.value?.primary_style_recommendation ?? ''
  return slugify(rec)
})

// ─── Helpers ─────────────────────────────────────────────────────────────────
function slugify(str: string): string {
  return str.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
}

function formatSlug(str: string): string {
  return str.replace(/-/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function previewSlug(styleName: string): string {
  return `${slugify(styleName)}-${productSlug.value}`
}

function thumbnailSrc(styleName: string): string {
  return `/meta/${slugify(styleName)}-thumbnail.png`
}

function thumbnailFallback(e: Event) {
  const img = e.target as HTMLImageElement
  img.src = `https://placehold.co/200x130/e5e7eb/9ca3af?text=${encodeURIComponent(img.alt)}`
}

// ─── Related products ─────────────────────────────────────────────────────────
const relatedProducts = computed(() => {
  if (!productsData.value || !product.value) return []
  const all = productsData.value as any[]
  const category = product.value.category ?? ''
  return all
    .filter((p: any) => p.slug !== productSlug.value && p.category === category)
    .slice(0, 6)
})

// ─── SEO ─────────────────────────────────────────────────────────────────────
const seoTitle = computed(
  () => `${productDisplayName.value} UI Design - Styles & Previews | uimaster.cc`
)
const seoDescription = computed(
  () =>
    `Browse all UI styles for ${productDisplayName.value}. Compare glassmorphism, neumorphism, brutalism and 60+ more styles. Download MASTER.md for Claude Code, Cursor, Windsurf.`
)
const canonical = computed(() => `https://uimaster.cc/products/${productSlug.value}`)

useSeoMeta({
  title: seoTitle,
  description: seoDescription,
  ogTitle: seoTitle,
  ogDescription: seoDescription,
  ogUrl: canonical,
  ogType: 'website',
  twitterCard: 'summary_large_image',
})

useHead({
  link: [{ rel: 'canonical', href: canonical }],
  script: [
    {
      type: 'application/ld+json',
      children: JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebPage',
        name: `${productDisplayName.value} UI Design`,
        description: seoDescription.value,
        url: canonical.value,
        keywords: `${productDisplayName.value}, UI design, design system, glassmorphism, neumorphism, Claude Code, CSS template`,
      }),
    },
  ],
})

// ─── Hover state for thumbnail swap ──────────────────────────────────────────
const hoveredStyle = ref<string | null>(null)
</script>

<template>
  <div class="products-page">

    <!-- ── Hero ──────────────────────────────────────────────────────────────── -->
    <section class="hero">
      <div class="container">
        <!-- Breadcrumb -->
        <nav class="breadcrumb" aria-label="Breadcrumb">
          <NuxtLink to="/">Home</NuxtLink>
          <span class="sep">›</span>
          <span>Products</span>
          <span class="sep">›</span>
          <span class="current">{{ productDisplayName }}</span>
        </nav>

        <h1 class="hero-title">
          <span class="label">{{ productDisplayName }}</span>
          <span class="suffix">UI Design</span>
        </h1>
        <p class="hero-desc">
          {{ sortedStyles.length }} UI styles available for
          <strong>{{ productDisplayName }}</strong>. Preview each style, then download a
          MASTER.md design system ready for Claude&nbsp;Code, Cursor, or Windsurf.
        </p>

        <!-- Quick stat chips -->
        <div class="stat-chips">
          <span class="chip">{{ sortedStyles.length }} Styles</span>
          <span class="chip chip-accent">1-click MASTER.md</span>
          <span class="chip">Claude Code ready</span>
        </div>
      </div>
    </section>

    <!-- ── Style Grid ─────────────────────────────────────────────────────────── -->
    <section class="gallery-section">
      <div class="container">

        <div v-if="sortedStyles.length === 0" class="empty">
          <p>No styles found for this product type.</p>
          <NuxtLink to="/" class="btn-primary">Back to Home</NuxtLink>
        </div>

        <div v-else class="style-grid">
          <NuxtLink
            v-for="style in sortedStyles"
            :key="style.slug ?? slugify(style.name)"
            :to="`/preview/${previewSlug(style.name)}`"
            class="style-card"
            :class="{ 'is-primary': slugify(style.name) === primaryStyleSlug }"
            @mouseenter="hoveredStyle = slugify(style.name)"
            @mouseleave="hoveredStyle = null"
          >
            <!-- Recommended badge -->
            <div v-if="slugify(style.name) === primaryStyleSlug" class="badge-recommended">
              ★ Recommended
            </div>

            <!-- Thumbnail -->
            <div class="thumb-wrap">
              <img
                :src="thumbnailSrc(style.name)"
                :alt="`${style.name} ${productDisplayName} preview`"
                loading="lazy"
                width="200"
                height="130"
                class="thumb"
                @error="thumbnailFallback"
              />
              <!-- Hover overlay -->
              <div class="thumb-overlay" :class="{ visible: hoveredStyle === slugify(style.name) }">
                <span class="overlay-cta">Preview →</span>
              </div>
            </div>

            <!-- Card body -->
            <div class="card-body">
              <span class="style-name">{{ style.name }}</span>
              <span class="style-desc">{{ style.short_description ?? style.keywords?.[0] ?? '' }}</span>
            </div>

            <!-- Meta tags -->
            <div v-if="style.keywords?.length" class="card-tags">
              <span
                v-for="kw in (style.keywords ?? []).slice(0, 3)"
                :key="kw"
                class="tag"
              >{{ kw }}</span>
            </div>
          </NuxtLink>
        </div>

      </div>
    </section>

    <!-- ── How to Use ─────────────────────────────────────────────────────────── -->
    <section class="how-section">
      <div class="container">
        <h2 class="section-title">How to Use</h2>
        <ol class="steps">
          <li class="step">
            <span class="step-num">01</span>
            <div>
              <strong>Pick a Style</strong>
              <p>Click any card above to preview that style applied to {{ productDisplayName }}.</p>
            </div>
          </li>
          <li class="step">
            <span class="step-num">02</span>
            <div>
              <strong>Download MASTER.md</strong>
              <p>Hit the Download button on the preview page to get a complete design system file.</p>
            </div>
          </li>
          <li class="step">
            <span class="step-num">03</span>
            <div>
              <strong>Drop it into your project</strong>
              <p>Place MASTER.md at your project root and reference it in Claude Code, Cursor, or Windsurf.</p>
            </div>
          </li>
        </ol>
      </div>
    </section>

    <!-- ── Related Products ───────────────────────────────────────────────────── -->
    <section v-if="relatedProducts.length" class="related-section">
      <div class="container">
        <h2 class="section-title">Related Product Types</h2>
        <div class="related-grid">
          <NuxtLink
            v-for="rel in relatedProducts"
            :key="rel.slug"
            :to="`/products/${rel.slug ?? slugify(rel.name)}`"
            class="related-card"
          >
            <span class="rel-name">{{ rel.name }}</span>
            <span class="rel-count">{{ sortedStyles.length }} styles →</span>
          </NuxtLink>
        </div>
      </div>
    </section>

    <!-- ── Attribution ────────────────────────────────────────────────────────── -->
    <footer class="attribution">
      Design data powered by
      <a
        href="https://github.com/nextlevelbuilder/ui-ux-pro-max"
        target="_blank"
        rel="noopener"
      >ui-ux-pro-max</a>
    </footer>

  </div>
</template>

<style scoped>
/* ─── Reset / Base ─────────────────────────────────────────────────────────── */
.products-page {
  min-height: 100vh;
  background: var(--color-bg, #F8F9FA);
  color: var(--color-text, #111827);
  font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
}

.container {
  max-width: 1280px;
  margin: 0 auto;
  padding: 0 24px;
}

/* ─── Hero ─────────────────────────────────────────────────────────────────── */
.hero {
  padding: 48px 0 40px;
  border-bottom: 1px solid var(--color-border, #E5E7EB);
  background: var(--color-surface, #fff);
}

.breadcrumb {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  margin-bottom: 20px;
}
.breadcrumb a {
  color: var(--color-accent, #3B82F6);
  text-decoration: none;
}
.breadcrumb a:hover { text-decoration: underline; }
.sep { opacity: 0.4; }
.current { color: var(--color-text, #111827); font-weight: 500; }

.hero-title {
  font-size: clamp(28px, 5vw, 44px);
  font-weight: 700;
  letter-spacing: -0.03em;
  line-height: 1.1;
  margin: 0 0 16px;
}
.hero-title .label { color: var(--color-accent, #3B82F6); }
.hero-title .suffix { color: var(--color-primary, #1D1D1F); margin-left: 8px; }

.hero-desc {
  font-size: 16px;
  color: var(--color-text-muted, #6B7280);
  max-width: 600px;
  line-height: 1.6;
  margin: 0 0 24px;
}

.stat-chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.chip {
  display: inline-flex;
  align-items: center;
  padding: 4px 12px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: 500;
  border: 1px solid var(--color-border, #E5E7EB);
  background: var(--color-bg, #F8F9FA);
  color: var(--color-text-muted, #6B7280);
}
.chip-accent {
  background: var(--color-accent, #3B82F6);
  color: #fff;
  border-color: transparent;
}

/* ─── Gallery ──────────────────────────────────────────────────────────────── */
.gallery-section {
  padding: 48px 0;
}

.empty {
  text-align: center;
  padding: 64px 0;
  color: var(--color-text-muted, #6B7280);
}
.btn-primary {
  display: inline-block;
  margin-top: 16px;
  padding: 10px 20px;
  background: var(--color-primary, #1D1D1F);
  color: #fff;
  border-radius: 8px;
  text-decoration: none;
  font-size: 14px;
  font-weight: 500;
}

/* ─── Style Grid ───────────────────────────────────────────────────────────── */
.style-grid {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 20px;
}

@media (max-width: 1024px) {
  .style-grid { grid-template-columns: repeat(3, 1fr); }
}
@media (max-width: 768px) {
  .style-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .style-grid { grid-template-columns: 1fr; }
}

/* ─── Style Card ───────────────────────────────────────────────────────────── */
.style-card {
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 12px;
  overflow: hidden;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.2s, box-shadow 0.2s, transform 0.2s;
}
.style-card:hover {
  border-color: var(--color-accent, #3B82F6);
  box-shadow: 0 4px 24px rgba(59,130,246,0.12);
  transform: translateY(-2px);
}
.style-card.is-primary {
  border-color: var(--color-accent, #3B82F6);
  box-shadow: 0 0 0 2px rgba(59,130,246,0.15);
}

.badge-recommended {
  position: absolute;
  top: 10px;
  right: 10px;
  z-index: 2;
  background: var(--color-accent, #3B82F6);
  color: #fff;
  font-size: 11px;
  font-weight: 600;
  padding: 3px 8px;
  border-radius: 999px;
  letter-spacing: 0.02em;
}

.thumb-wrap {
  position: relative;
  width: 100%;
  aspect-ratio: 200 / 130;
  overflow: hidden;
  background: var(--color-bg, #F8F9FA);
}
.thumb {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
  transition: transform 0.3s;
}
.style-card:hover .thumb { transform: scale(1.04); }

.thumb-overlay {
  position: absolute;
  inset: 0;
  background: rgba(17,24,39,0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.2s;
}
.thumb-overlay.visible { opacity: 1; }
.overlay-cta {
  color: #fff;
  font-size: 14px;
  font-weight: 600;
  letter-spacing: 0.02em;
}

.card-body {
  padding: 12px 14px 8px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.style-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #111827);
  line-height: 1.3;
}
.style-desc {
  font-size: 12px;
  color: var(--color-text-muted, #6B7280);
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-tags {
  padding: 0 14px 12px;
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}
.tag {
  font-size: 10px;
  font-weight: 500;
  padding: 2px 7px;
  border-radius: 4px;
  background: var(--color-bg, #F8F9FA);
  border: 1px solid var(--color-border, #E5E7EB);
  color: var(--color-text-muted, #6B7280);
  text-transform: lowercase;
}

/* ─── How to Use ───────────────────────────────────────────────────────────── */
.how-section {
  padding: 48px 0;
  background: var(--color-surface, #fff);
  border-top: 1px solid var(--color-border, #E5E7EB);
  border-bottom: 1px solid var(--color-border, #E5E7EB);
}

.section-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.02em;
  margin: 0 0 32px;
}

.steps {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 24px;
  max-width: 560px;
}

.step {
  display: flex;
  gap: 20px;
  align-items: flex-start;
}
.step-num {
  flex-shrink: 0;
  width: 40px;
  height: 40px;
  border-radius: 10px;
  background: var(--color-primary, #1D1D1F);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 13px;
  font-weight: 700;
  letter-spacing: 0.04em;
}
.step strong {
  display: block;
  font-size: 15px;
  font-weight: 600;
  margin-bottom: 4px;
  color: var(--color-text, #111827);
}
.step p {
  font-size: 14px;
  color: var(--color-text-muted, #6B7280);
  margin: 0;
  line-height: 1.5;
}

/* ─── Related Products ─────────────────────────────────────────────────────── */
.related-section {
  padding: 48px 0;
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 12px;
}
@media (max-width: 768px) {
  .related-grid { grid-template-columns: repeat(2, 1fr); }
}
@media (max-width: 480px) {
  .related-grid { grid-template-columns: 1fr; }
}

.related-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 16px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
  text-decoration: none;
  color: inherit;
  transition: border-color 0.15s, background 0.15s;
}
.related-card:hover {
  border-color: var(--color-accent, #3B82F6);
  background: rgba(59,130,246,0.04);
}
.rel-name {
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text, #111827);
}
.rel-count {
  font-size: 12px;
  color: var(--color-accent, #3B82F6);
  font-weight: 500;
  white-space: nowrap;
}

/* ─── Attribution ──────────────────────────────────────────────────────────── */
.attribution {
  padding: 24px;
  text-align: center;
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  border-top: 1px solid var(--color-border, #E5E7EB);
}
.attribution a {
  color: var(--color-accent, #3B82F6);
  text-decoration: none;
}
.attribution a:hover { text-decoration: underline; }
</style>