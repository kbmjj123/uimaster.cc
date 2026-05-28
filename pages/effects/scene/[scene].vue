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

      <!-- Scene siblings nav -->
      <div class="filter-siblings" aria-label="Browse other use cases">
        <NuxtLink
          v-for="sc in sibling_scenes"
          :key="sc.value"
          :to="`/effects/scene/${sc.value}`"
          class="filter-sibling-chip"
          :class="{ 'filter-sibling-chip--active': sc.value === scene }"
        >
          {{ sc.label }}
        </NuxtLink>
      </div>
    </div>

    <!-- ── Sort bar ────────────────────────────────────────────────────────── -->
    <div class="filter-controls">
      <p class="filter-total">
        <strong>{{ totalCount }}</strong> effects for <em>{{ displayName }}</em>
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
        <p>No effects found for "{{ displayName }}" yet.</p>
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
        {{ displayName }} HTML Effects
      </h2>
      <p class="filter-seo-text">{{ seoText }}</p>
      <p class="filter-seo-text">
        Every effect is a self-contained HTML file — copy the source directly into
        your project or download it as-is. No npm install, no framework dependency.
      </p>
    </section>

  </div>
</template>

<script setup lang="ts">
const LIMIT = 24

// ── Route ─────────────────────────────────────────────────────────────────────
const route  = useRoute()
const router = useRouter()
const scene  = computed(() => route.params.scene as string)

// ── Scene meta ────────────────────────────────────────────────────────────────
const sibling_scenes = [
  { label: 'Landing Page', value: 'landing-page' },
  { label: 'Hero Section', value: 'hero-section' },
  { label: 'Background',   value: 'background' },
  { label: 'Button',       value: 'button' },
  { label: 'Card',         value: 'card' },
  { label: 'Navbar',       value: 'navbar' },
  { label: 'Loading',      value: 'loading' },
  { label: 'Cursor',       value: 'cursor' },
]

const sortOptions = [
  { label: 'Latest',   value: 'latest' },
  { label: 'Popular',  value: 'popular' },
  { label: 'Featured', value: 'featured' },
]

const displayName = computed(() => {
  const found = sibling_scenes.find(s => s.value === scene.value)
  if (found) return found.label
  return scene.value.split('-').map(w => w[0].toUpperCase() + w.slice(1)).join(' ')
})

// ── SEO copy per scene ────────────────────────────────────────────────────────
const sceneMeta: Record<string, { h1Suffix: string; desc: string; seoText: string; keywords: string }> = {
  'landing-page': {
    h1Suffix: 'Landing Page Animation Effects HTML',
    desc: 'Animated HTML effects designed for landing pages — hero sections, scroll reveals, and conversion-focused motion design.',
    seoText: 'Landing page animations help guide the visitor\'s eye toward your CTA, communicate product value faster, and increase time on page. These effects are optimised for above-the-fold performance with minimal layout shift.',
    keywords: 'landing page animation HTML, hero animation HTML, landing page effects, scroll animation landing page, HTML landing page motion',
  },
  'hero-section': {
    h1Suffix: 'Hero Section Effects HTML',
    desc: 'Full-screen hero section effects — animated backgrounds, particle fields, gradient meshes, and entrance animations.',
    seoText: 'The hero section is the first thing every visitor sees. These effects create instant impact with animated backgrounds, floating elements, and reveal animations that load fast and degrade gracefully on slower devices.',
    keywords: 'hero section effects HTML, animated hero background, hero animation HTML, full screen animation HTML, hero section animation CSS',
  },
  'background': {
    h1Suffix: 'Interactive Background HTML Effects',
    desc: 'Animated background effects for web pages — mesh gradients, particle fields, noise textures, and Aurora-style blobs.',
    seoText: 'Animated backgrounds add depth and personality to a design without requiring heavy assets. These effects use CSS gradients, SVG filters, and Canvas to create backgrounds that react to mouse movement, scroll position, or run on a timer.',
    keywords: 'interactive background HTML, animated background CSS, particle background HTML, animated gradient background, CSS moving background',
  },
  'button': {
    h1Suffix: 'Button Hover Effects CSS HTML',
    desc: 'Creative button hover and click effects — ripples, magnetic pulls, glows, and morphing borders. Copy-paste ready.',
    seoText: 'Button micro-interactions communicate interactivity and improve perceived responsiveness. These effects range from subtle border transitions to dramatic hover states built with CSS pseudo-elements and clip-path animations.',
    keywords: 'button hover effects CSS, button animation HTML, CSS button effects, interactive button HTML, button click animation',
  },
  'card': {
    h1Suffix: 'Card Animation CSS Effects HTML',
    desc: 'Animated card components — 3D tilts, hover reveals, glassmorphism surfaces, and flip transitions.',
    seoText: 'Card components are the workhorse of modern UI design. These animations add depth, interactivity, and delight to product cards, pricing tables, and content grids with minimal additional JavaScript.',
    keywords: 'card animation CSS, animated card HTML, card hover effect CSS, 3D card tilt HTML, glassmorphism card CSS',
  },
  'navbar': {
    h1Suffix: 'Navbar Animation Effects HTML',
    desc: 'Animated navigation bars — scroll-aware headers, mobile menus, glassmorphism navbars, and transition effects.',
    seoText: 'A well-animated navbar improves navigation clarity and gives a site a polished feel. These effects cover sticky scroll behaviour, blur-on-scroll, animated hamburger menus, and smooth link underline transitions.',
    keywords: 'navbar effects HTML, animated navigation bar CSS, scroll navbar animation, glassmorphism navbar, sticky navbar animation',
  },
  'loading': {
    h1Suffix: 'Loading Animation HTML CSS Effects',
    desc: 'CSS and JavaScript loading animations — spinners, skeleton screens, progress bars, and branded loaders.',
    seoText: 'Loading states reduce perceived wait time and prevent users from thinking a page is broken. These animations cover the full spectrum from minimal CSS spinners to elaborate branded sequences.',
    keywords: 'loading animation HTML CSS, spinner animation HTML, CSS loader animation, skeleton loading animation, progress bar animation HTML',
  },
  'cursor': {
    h1Suffix: 'Custom Cursor Effects HTML',
    desc: 'Custom cursor and mouse-follow effects — trailing particles, magnetic elements, and cursor morphing on hover.',
    seoText: 'Custom cursors are a high-impact, low-cost detail that immediately differentiates a site from the default browser experience. These effects use JavaScript MouseEvent and CSS transforms to create cursors that trail, morph, and react to hoverable elements.',
    keywords: 'custom cursor HTML, cursor animation JavaScript, mouse follow effect HTML, cursor effect CSS, custom cursor CSS JavaScript',
  },
}

const sceneInfo = computed(() => sceneMeta[scene.value] ?? {
  h1Suffix: `${displayName.value} HTML Effects`,
  desc: `HTML effects designed for ${displayName.value} use cases. Live preview, edit, and download.`,
  seoText: `A curated set of HTML effects for ${displayName.value}. Each is a single self-contained file you can drop into any project.`,
  keywords: `${displayName.value} HTML effects, ${displayName.value} animation, ${displayName.value} CSS JavaScript`,
})

const pageH1   = computed(() => sceneInfo.value.h1Suffix)
const pageDesc = computed(() => sceneInfo.value.desc)
const seoText  = computed(() => sceneInfo.value.seoText)

// ── API ───────────────────────────────────────────────────────────────────────
interface Effect {
  id: string; title: string; category: string; scene: string
  cover_url: string; cover_static_url: string
  is_featured: number; view_count: number
}
interface ApiResponse { effects: Effect[]; total: number }

const activeSort = ref((route.query.sort as string) || 'latest')
const page       = ref(Number(route.query.page) || 1)

const apiParams = computed(() => ({
  scene:  scene.value,
  sort:   activeSort.value,
  page:   page.value,
  limit:  LIMIT,
}))

const { data, pending } = await useAsyncData<ApiResponse>(
  `effects-scene-${scene.value}`,
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
const canonicalUrl = computed(() => `https://uimaster.cc/effects/scene/${scene.value}`)
const metaTitle    = computed(() => `${pageH1.value} — Free Download | uimaster.cc`)
const metaDesc     = computed(() => sceneInfo.value.desc)

useHead({
  title: metaTitle.value,
  meta: [
    { name: 'description',         content: metaDesc.value },
    { name: 'keywords',            content: sceneInfo.value.keywords },
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
      keywords: sceneInfo.value.keywords,
    }),
  }],
})
</script>

<style scoped>
/* All styles identical to category page — CSS variables ensure visual consistency */
.filter-page {
  max-width: 1280px; margin: 0 auto;
  padding: 24px 24px 80px;
  display: flex; flex-direction: column; gap: 0;
}
.filter-breadcrumb { margin-bottom: 20px; }
.filter-breadcrumb-list {
  display: flex; align-items: center; gap: 6px;
  list-style: none; margin: 0; padding: 0;
  font-size: 13px; color: var(--color-text-muted, #6B7280);
}
.filter-breadcrumb-list a { color: var(--color-text-muted); text-decoration: none; }
.filter-breadcrumb-list a:hover { color: var(--color-text, #111827); text-decoration: underline; }
.filter-header { display: flex; flex-direction: column; gap: 12px; margin-bottom: 24px; }
.filter-h1 {
  font-size: 28px; font-weight: 700; letter-spacing: -0.5px;
  color: var(--color-primary, #1D1D1F); margin: 0; line-height: 1.2;
}
.filter-desc { font-size: 14px; color: var(--color-text-muted, #6B7280); line-height: 1.65; margin: 0; max-width: 640px; }
.filter-siblings { display: flex; flex-wrap: wrap; gap: 6px; }
.filter-sibling-chip {
  display: inline-flex; align-items: center; padding: 5px 14px;
  border-radius: 9999px; border: 1.5px solid var(--color-border, #E5E7EB);
  font-size: 13px; font-weight: 500; color: var(--color-text-muted, #6B7280);
  text-decoration: none;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
}
.filter-sibling-chip:hover { border-color: var(--color-text-muted, #6B7280); color: var(--color-text, #111827); }
.filter-sibling-chip--active { border-color: var(--color-primary, #1D1D1F); background: var(--color-primary, #1D1D1F); color: #fff; }
.filter-controls { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-bottom: 20px; }
.filter-total { font-size: 13px; color: var(--color-text-muted, #6B7280); margin: 0; }
.filter-total strong { color: var(--color-text, #111827); }
.filter-total em { font-style: normal; }
.filter-sort { display: flex; gap: 2px; background: var(--color-bg, #F8F9FA); border: 1px solid var(--color-border, #E5E7EB); border-radius: 8px; padding: 3px; }
.filter-sort-btn { padding: 4px 10px; border: none; border-radius: 5px; background: transparent; font-size: 12px; font-weight: 500; color: var(--color-text-muted, #6B7280); cursor: pointer; font-family: inherit; white-space: nowrap; transition: background 150ms ease, color 150ms ease; }
.filter-sort-btn:hover { color: var(--color-text, #111827); }
.filter-sort-btn--active { background: var(--color-surface, #fff); color: var(--color-primary, #1D1D1F); font-weight: 600; box-shadow: 0 1px 2px rgba(0,0,0,0.06); }
.filter-grid-wrap { display: grid; grid-template-columns: repeat(4, 1fr); gap: 16px; align-items: start; margin-bottom: 32px; }
.filter-inline-ad { grid-column: 1 / -1; display: flex; justify-content: center; }
.filter-skeleton { aspect-ratio: 8 / 5; border-radius: 10px; background: var(--color-border, #E5E7EB); animation: shimmer 1.8s ease-in-out infinite; }
@keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }
.filter-empty { grid-column: 1 / -1; padding: 60px 24px; text-align: center; color: var(--color-text-muted, #6B7280); font-size: 14px; display: flex; flex-direction: column; align-items: center; gap: 12px; }
.filter-back-link { font-size: 13px; color: var(--color-accent, #3B82F6); text-decoration: none; }
.filter-back-link:hover { text-decoration: underline; }
.filter-pagination { display: flex; align-items: center; justify-content: center; gap: 4px; flex-wrap: wrap; margin-bottom: 48px; }
.filter-page-btn { display: flex; align-items: center; justify-content: center; min-width: 34px; height: 34px; padding: 0 6px; border: 1.5px solid var(--color-border, #E5E7EB); border-radius: 7px; background: var(--color-surface, #fff); font-size: 13px; font-weight: 500; color: var(--color-text-muted, #6B7280); cursor: pointer; font-family: inherit; transition: border-color 150ms ease, color 150ms ease, background 150ms ease; }
.filter-page-btn:hover:not(:disabled) { border-color: var(--color-text-muted); color: var(--color-text, #111827); }
.filter-page-btn--active { background: var(--color-primary, #1D1D1F); border-color: var(--color-primary, #1D1D1F); color: #fff; }
.filter-page-btn:disabled { opacity: 0.35; cursor: not-allowed; }
.filter-page-ellipsis { font-size: 13px; color: var(--color-text-muted, #6B7280); padding: 0 4px; }
.filter-seo-block { border-top: 1px solid var(--color-border, #E5E7EB); padding-top: 32px; }
.filter-seo-h2 { font-size: 18px; font-weight: 700; letter-spacing: -0.3px; color: var(--color-primary, #1D1D1F); margin: 0 0 14px; }
.filter-seo-text { font-size: 14px; color: var(--color-text-muted, #6B7280); line-height: 1.75; margin: 0 0 10px; max-width: 720px; }
@media (max-width: 1023px) { .filter-grid-wrap { grid-template-columns: repeat(2, 1fr); } }
@media (max-width: 767px) {
  .filter-page { padding: 16px 16px 80px; }
  .filter-h1 { font-size: 22px; }
  .filter-grid-wrap { grid-template-columns: 1fr; }
  .filter-inline-ad { display: none; }
}
</style>