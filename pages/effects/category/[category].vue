<template>
  <div class="filter-page">

    <!-- ── Breadcrumb ──────────────────────────────────────────────────────── -->
    <nav class="filter-breadcrumb" aria-label="Breadcrumb">
      <ol class="filter-breadcrumb-list">
        <li><NuxtLink to="/effects">Effects Gallery</NuxtLink></li>
        <li aria-hidden="true">›</li>
        <li aria-current="page">{{ displayName }}</li>
      </ol>
    </nav>

    <!-- ── Header (SSR) ───────────────────────────────────────────────────── -->
    <div class="filter-header">
      <h1 class="filter-h1">{{ pageH1 }}</h1>
      <p class="filter-desc">{{ pageDesc }}</p>

      <!-- Category siblings nav -->
      <div class="filter-siblings" aria-label="Browse other categories">
        <NuxtLink
          v-for="cat in sibling_categories"
          :key="cat.value"
          :to="`/effects/category/${cat.value}`"
          class="filter-sibling-chip"
          :class="{ 'filter-sibling-chip--active': cat.value === category }"
        >
          {{ cat.label }}
        </NuxtLink>
      </div>
    </div>

    <!-- ── Sort bar ────────────────────────────────────────────────────────── -->
    <div class="filter-controls">
      <p class="filter-total">
        <strong>{{ totalCount }}</strong> effects in <em>{{ displayName }}</em>
      </p>
      <div class="filter-sort">
        <button
          v-for="s in sortOptions"
          :key="s.value"
          class="filter-sort-btn"
          :class="{ 'filter-sort-btn--active': activeSort === s.value }"
          @click="setSort(s.value)"
        >{{ s.label }}</button>
      </div>
    </div>

    <!-- ── Card grid ───────────────────────────────────────────────────────── -->
    <div class="filter-grid-wrap">
      <div v-if="pending" class="filter-grid">
        <div v-for="i in 12" :key="i" class="filter-skeleton" />
      </div>

      <template v-else-if="effects.length">
        <template v-for="(item, idx) in effects" :key="item.id">
          <div v-if="idx > 0 && idx % 12 === 0" class="filter-inline-ad">
            <AdSlot size="728x90" position="ad-gallery-inline" />
          </div>
          <EffectCard :effect="item" />
        </template>
      </template>

      <div v-else class="filter-empty">
        <p>No {{ displayName }} effects found yet.</p>
        <NuxtLink to="/effects" class="filter-back-link">← Browse all effects</NuxtLink>
      </div>
    </div>

    <!-- ── Pagination ──────────────────────────────────────────────────────── -->
    <div v-if="totalPages > 1" class="filter-pagination">
      <button class="filter-page-btn" :disabled="page === 1"
              aria-label="Previous page" @click="goPage(page - 1)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <template v-for="p in paginationRange" :key="p">
        <span v-if="p === '…'" class="filter-page-ellipsis">…</span>
        <button v-else class="filter-page-btn"
                :class="{ 'filter-page-btn--active': p === page }"
                :aria-current="p === page ? 'page' : undefined"
                @click="goPage(Number(p))">{{ p }}</button>
      </template>
      <button class="filter-page-btn" :disabled="page === totalPages"
              aria-label="Next page" @click="goPage(page + 1)">
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 2l5 5-5 5" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

    <!-- ── SEO text block ──────────────────────────────────────────────────── -->
    <section class="filter-seo-block" aria-labelledby="seo-heading">
      <h2 id="seo-heading" class="filter-seo-h2">
        About {{ displayName }} Effects
      </h2>
      <p class="filter-seo-text">{{ seoText }}</p>
      <p class="filter-seo-text">
        All effects are single-file HTML with self-contained CSS and vanilla JavaScript —
        no build step required. Preview live in your browser, edit the code inline,
        and download the final HTML file.
      </p>
    </section>

  </div>
</template>

<script setup lang="ts">
const LIMIT = 24

// ── Route ─────────────────────────────────────────────────────────────────────
const route    = useRoute()
const router   = useRouter()
const category = computed(() => route.params.category as string)

// ── Filter meta ───────────────────────────────────────────────────────────────
const sibling_categories = [
  { label: 'Canvas',    value: 'canvas' },
  { label: 'WebGL',     value: 'webgl' },
  { label: 'CSS',       value: 'css' },
  { label: 'Particles', value: 'particles' },
  { label: 'Scroll',    value: 'scroll' },
  { label: 'Three.js',  value: 'threejs' },
]

const sortOptions = [
  { label: 'Latest',   value: 'latest' },
  { label: 'Popular',  value: 'popular' },
  { label: 'Featured', value: 'featured' },
]

const activeSort = ref((route.query.sort as string) || 'latest')
const page       = ref(Number(route.query.page) || 1)

// Human-readable category name
const displayName = computed(() => {
  const found = sibling_categories.find(c => c.value === category.value)
  if (found) return found.label
  return category.value
    .split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
})

// ── SEO copy per category ─────────────────────────────────────────────────────
const categoryMeta: Record<string, { h1Suffix: string; desc: string; seoText: string; keywords: string }> = {
  canvas: {
    h1Suffix: 'Canvas Animation Effects',
    desc: 'HTML5 Canvas animation demos you can preview, edit, and download. Particle systems, generative art, physics simulations, and more.',
    seoText: 'Canvas animations use the HTML5 <canvas> element and JavaScript to render 2D and 3D graphics at 60 fps. They are ideal for data visualisations, interactive backgrounds, particle simulations, and game-like UI elements that CSS alone cannot achieve.',
    keywords: 'canvas animation HTML, canvas animation examples, HTML5 canvas effects, canvas particle animation, canvas JavaScript effects',
  },
  webgl: {
    h1Suffix: 'WebGL Effects & Demos',
    desc: 'GPU-accelerated WebGL effects with full HTML source. Shaders, 3D scenes, and real-time rendering — ready to embed.',
    seoText: 'WebGL brings hardware-accelerated 3D graphics to the browser without plugins. These demos use raw WebGL or Three.js to achieve shader effects, 3D environments, and post-processing that would be impossible with CSS or Canvas 2D alone.',
    keywords: 'WebGL effects demo, WebGL animation HTML, Three.js effects, GLSL shader HTML, 3D browser animation',
  },
  css: {
    h1Suffix: 'CSS Animation Effects HTML',
    desc: 'Pure CSS animation effects — no JavaScript required. Hover effects, keyframe animations, transitions, and motion design.',
    seoText: 'CSS animations and transitions handle the majority of UI motion needs with zero runtime overhead. These effects use @keyframes, CSS custom properties, and modern features like @starting-style to create smooth, accessible animations that degrade gracefully.',
    keywords: 'CSS animation effects HTML, CSS animation examples, pure CSS effects, CSS hover effects, CSS keyframe animation',
  },
  particles: {
    h1Suffix: 'Particle Animation HTML Effects',
    desc: 'Particle system animations in HTML — from subtle floating dots to explosive bursts. All copy-paste ready.',
    seoText: 'Particle animations create a sense of depth, motion, and organic life in a UI. These demos range from simple floating shapes to complex physics-based simulations with thousands of individual elements rendered at 60 fps.',
    keywords: 'particle animation HTML, particle system JavaScript, floating particles CSS, particle effect HTML download, interactive particle background',
  },
  scroll: {
    h1Suffix: 'Scroll Animation Effects HTML',
    desc: 'Scroll-triggered animations — parallax, reveal, sticky elements, and progress indicators. Single-file HTML demos.',
    seoText: 'Scroll animations tie UI motion to the user\'s scroll position, creating a sense of interactivity and narrative flow. These demos use IntersectionObserver, scroll-driven animations, and CSS scroll-snap to trigger effects at exactly the right moment.',
    keywords: 'scroll animation effects HTML, scroll triggered animation, parallax effect HTML, scroll reveal animation, CSS scroll animation',
  },
  threejs: {
    h1Suffix: 'Three.js Effects & Demos',
    desc: '3D Three.js scenes packaged as single-file HTML. Background effects, interactive objects, and animated environments.',
    seoText: 'Three.js abstracts WebGL into a friendly API, making 3D scenes accessible to front-end developers. These demos are self-contained HTML files that include Three.js via CDN, covering everything from procedural geometry to post-processing and physics.',
    keywords: 'Three.js effects HTML, Three.js demo download, Three.js background animation, three js HTML example, 3D JavaScript animation',
  },
}

const catInfo = computed(() => categoryMeta[category.value] ?? {
  h1Suffix: `${displayName.value} HTML Effects`,
  desc: `Browse ${displayName.value} HTML effects. Live preview, edit in-browser, free download.`,
  seoText: `Explore a curated collection of ${displayName.value} effects built with HTML, CSS, and vanilla JavaScript. Each effect is a self-contained single file you can preview, customise, and download.`,
  keywords: `${displayName.value} HTML effects, ${displayName.value} animation, free HTML ${displayName.value} download`,
})

const pageH1  = computed(() => catInfo.value.h1Suffix)
const pageDesc = computed(() => catInfo.value.desc)
const seoText  = computed(() => catInfo.value.seoText)

// ── API ───────────────────────────────────────────────────────────────────────
interface Effect {
  id: string; title: string; category: string; scene: string
  cover_url: string; cover_static_url: string
  is_featured: number; view_count: number
}
interface ApiResponse { effects: Effect[]; total: number }

const apiParams = computed(() => ({
  category: category.value,
  sort:     activeSort.value,
  page:     page.value,
  limit:    LIMIT,
}))

const { data, pending } = await useAsyncData<ApiResponse>(
  `effects-cat-${category.value}`,
  () => $fetch('/api/effects', { params: apiParams.value }),
  { watch: [apiParams] }
)

const effects    = computed(() => data.value?.effects ?? [])
const totalCount = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(totalCount.value / LIMIT))

// ── Sort / pagination ─────────────────────────────────────────────────────────
function setSort(val: string) {
  activeSort.value = val; page.value = 1; syncUrl()
}

function goPage(p: number) {
  page.value = p; syncUrl()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

function syncUrl() {
  router.replace({ query: {
    ...(activeSort.value !== 'latest' && { sort: activeSort.value }),
    ...(page.value > 1 && { page: String(page.value) }),
  }})
}

const paginationRange = computed((): (number | '…')[] => {
  const total = totalPages.value, cur = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (cur > 3) pages.push('…')
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p)
  if (cur < total - 2) pages.push('…')
  pages.push(total)
  return pages
})

// ── SEO ───────────────────────────────────────────────────────────────────────
const canonicalUrl = computed(() => `https://uimaster.cc/effects/category/${category.value}`)
const metaTitle    = computed(() => `${pageH1.value} — Free Download | uimaster.cc`)
const metaDesc     = computed(() => catInfo.value.desc)

useHead({
  title: metaTitle.value,
  meta: [
    { name: 'description',         content: metaDesc.value },
    { name: 'keywords',            content: catInfo.value.keywords },
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
      '@type': 'CollectionPage',
      name: metaTitle.value,
      description: metaDesc.value,
      url: canonicalUrl.value,
      keywords: catInfo.value.keywords,
    }),
  }],
})
</script>

<style scoped>
/* shared styles — identical in both category and scene pages */
.filter-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* Breadcrumb */
.filter-breadcrumb { margin-bottom: 20px; }
.filter-breadcrumb-list {
  display: flex; align-items: center; gap: 6px;
  list-style: none; margin: 0; padding: 0;
  font-size: 13px; color: var(--color-text-muted, #6B7280);
}
.filter-breadcrumb-list a { color: var(--color-text-muted); text-decoration: none; }
.filter-breadcrumb-list a:hover { color: var(--color-text, #111827); text-decoration: underline; }

/* Header */
.filter-header {
  display: flex; flex-direction: column; gap: 12px;
  margin-bottom: 24px;
}

.filter-h1 {
  font-size: 28px; font-weight: 700; letter-spacing: -0.5px;
  color: var(--color-primary, #1D1D1F); margin: 0; line-height: 1.2;
}

.filter-desc {
  font-size: 14px; color: var(--color-text-muted, #6B7280);
  line-height: 1.65; margin: 0; max-width: 640px;
}

/* Sibling chips */
.filter-siblings {
  display: flex; flex-wrap: wrap; gap: 6px;
}

.filter-sibling-chip {
  display: inline-flex; align-items: center;
  padding: 5px 14px; border-radius: 9999px;
  border: 1.5px solid var(--color-border, #E5E7EB);
  font-size: 13px; font-weight: 500;
  color: var(--color-text-muted, #6B7280);
  text-decoration: none;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
}

.filter-sibling-chip:hover {
  border-color: var(--color-text-muted, #6B7280);
  color: var(--color-text, #111827);
}

.filter-sibling-chip--active {
  border-color: var(--color-primary, #1D1D1F);
  background: var(--color-primary, #1D1D1F);
  color: #fff;
}

/* Controls bar */
.filter-controls {
  display: flex; align-items: center; justify-content: space-between;
  gap: 12px; flex-wrap: wrap; margin-bottom: 20px;
}

.filter-total {
  font-size: 13px; color: var(--color-text-muted, #6B7280); margin: 0;
}
.filter-total strong { color: var(--color-text, #111827); }
.filter-total em { font-style: normal; }

.filter-sort {
  display: flex; gap: 2px;
  background: var(--color-bg, #F8F9FA);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 8px; padding: 3px;
}

.filter-sort-btn {
  padding: 4px 10px; border: none; border-radius: 5px;
  background: transparent; font-size: 12px; font-weight: 500;
  color: var(--color-text-muted, #6B7280); cursor: pointer;
  font-family: inherit; white-space: nowrap;
  transition: background 150ms ease, color 150ms ease;
}

.filter-sort-btn:hover { color: var(--color-text, #111827); }

.filter-sort-btn--active {
  background: var(--color-surface, #fff);
  color: var(--color-primary, #1D1D1F);
  font-weight: 600;
  box-shadow: 0 1px 2px rgba(0,0,0,0.06);
}

/* Grid */
.filter-grid-wrap {
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: start;
  margin-bottom: 32px;
}

.filter-inline-ad {
  grid-column: 1 / -1;
  display: flex; justify-content: center;
}

.filter-skeleton {
  aspect-ratio: 8 / 5; border-radius: 10px;
  background: var(--color-border, #E5E7EB);
  animation: shimmer 1.8s ease-in-out infinite;
}

@keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

.filter-empty {
  grid-column: 1 / -1; padding: 60px 24px; text-align: center;
  color: var(--color-text-muted, #6B7280); font-size: 14px;
  display: flex; flex-direction: column; align-items: center; gap: 12px;
}

.filter-back-link {
  font-size: 13px; color: var(--color-accent, #3B82F6); text-decoration: none;
}
.filter-back-link:hover { text-decoration: underline; }

/* Pagination */
.filter-pagination {
  display: flex; align-items: center; justify-content: center;
  gap: 4px; flex-wrap: wrap; margin-bottom: 48px;
}

.filter-page-btn {
  display: flex; align-items: center; justify-content: center;
  min-width: 34px; height: 34px; padding: 0 6px;
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 7px; background: var(--color-surface, #fff);
  font-size: 13px; font-weight: 500; color: var(--color-text-muted, #6B7280);
  cursor: pointer; font-family: inherit;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
}

.filter-page-btn:hover:not(:disabled) {
  border-color: var(--color-text-muted); color: var(--color-text, #111827);
}

.filter-page-btn--active {
  background: var(--color-primary, #1D1D1F);
  border-color: var(--color-primary, #1D1D1F);
  color: #fff;
}

.filter-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }

.filter-page-ellipsis {
  font-size: 13px; color: var(--color-text-muted, #6B7280); padding: 0 4px;
}

/* SEO text block */
.filter-seo-block {
  border-top: 1px solid var(--color-border, #E5E7EB);
  padding-top: 32px;
}

.filter-seo-h2 {
  font-size: 18px; font-weight: 700; letter-spacing: -0.3px;
  color: var(--color-primary, #1D1D1F); margin: 0 0 14px;
}

.filter-seo-text {
  font-size: 14px; color: var(--color-text-muted, #6B7280);
  line-height: 1.75; margin: 0 0 10px; max-width: 720px;
}

/* Responsive */
@media (max-width: 1023px) { .filter-grid-wrap { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 767px) {
  .filter-page { padding: 16px 16px 80px; }
  .filter-h1 { font-size: 22px; }
  .filter-grid-wrap { grid-template-columns: 1fr; }
  .filter-inline-ad { display: none; }
}
</style>