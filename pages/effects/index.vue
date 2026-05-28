<template>
  <div class="gallery-page">

    <!-- ── Page header ────────────────────────────────────────────────────── -->
    <div class="gallery-header">
      <h1 class="gallery-h1">HTML Effects Gallery</h1>
      <p class="gallery-desc">
        Browse {{ totalCount.toLocaleString() }} copy-paste HTML effects — canvas,
        WebGL, CSS animations and more. Preview live, edit in-browser, download free.
      </p>
    </div>

    <!-- ── Filter / sort bar ──────────────────────────────────────────────── -->
    <div class="gallery-controls">
      <!-- Category tabs -->
      <div class="gallery-tabs" role="tablist" aria-label="Filter by category">
        <button
          v-for="cat in categories"
          :key="cat.value"
          class="gallery-tab"
          :class="{ 'gallery-tab--active': activeCategory === cat.value }"
          role="tab"
          :aria-selected="activeCategory === cat.value"
          @click="setCategory(cat.value)"
        >
          {{ cat.label }}
        </button>
      </div>

      <div class="gallery-controls-right">
        <!-- Scene dropdown -->
        <div class="gallery-scene-wrap" ref="sceneWrapEl">
          <button class="gallery-scene-btn" @click="sceneOpen = !sceneOpen">
            {{ activeScene ? activeScene : 'Scene' }}
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none"
                 :class="{ rotated: sceneOpen }" class="gallery-chevron" aria-hidden="true">
              <path d="M2 3.5l3 3 3-3" stroke="currentColor" stroke-width="1.4"
                    stroke-linecap="round"/>
            </svg>
          </button>
          <Transition name="dropdown">
            <div v-if="sceneOpen" class="gallery-scene-dropdown">
              <button
                v-for="sc in scenes"
                :key="sc"
                class="gallery-scene-option"
                :class="{ 'gallery-scene-option--active': activeScene === sc }"
                @click="setScene(sc)"
              >{{ sc || 'All scenes' }}</button>
            </div>
          </Transition>
        </div>

        <!-- Keyword search -->
        <div class="gallery-search-wrap">
          <svg width="13" height="13" viewBox="0 0 14 14" fill="none"
               class="gallery-search-icon" aria-hidden="true">
            <circle cx="6" cy="6" r="4.5" stroke="currentColor" stroke-width="1.4"/>
            <path d="M10 10l2.5 2.5" stroke="currentColor" stroke-width="1.4"
                  stroke-linecap="round"/>
          </svg>
          <input
            v-model="searchQuery"
            class="gallery-search-input"
            placeholder="Search effects…"
            aria-label="Search effects"
            @input="onSearch"
          >
          <button
            v-if="searchQuery"
            class="gallery-search-clear"
            aria-label="Clear search"
            @click="clearSearch"
          >
            <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
              <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.4"
                    stroke-linecap="round"/>
            </svg>
          </button>
        </div>

        <!-- Sort -->
        <div class="gallery-sort">
          <button
            v-for="s in sortOptions"
            :key="s.value"
            class="gallery-sort-btn"
            :class="{ 'gallery-sort-btn--active': activeSort === s.value }"
            @click="setSort(s.value)"
          >{{ s.label }}</button>
        </div>
      </div>
    </div>

    <!-- ── Grid + inline ads ───────────────────────────────────────────────── -->
    <div class="gallery-grid-wrap">
      <!-- Loading skeleton (client navigation) -->
      <div v-if="pending" class="gallery-grid">
        <div v-for="i in 12" :key="i" class="gallery-skeleton" />
      </div>

      <template v-else-if="effects.length">
        <template v-for="(item, idx) in effects" :key="item.id ?? idx">
          <!-- Inline 728×90 ad every 12 cards -->
          <div
            v-if="idx > 0 && idx % 12 === 0"
            class="gallery-inline-ad"
          >
            <AdSlot size="728x90" position="ad-gallery-inline" />
          </div>
          <EffectCard :effect="item" />
        </template>
      </template>

      <div v-else class="gallery-empty">
        <p>No effects found{{ searchQuery ? ` for "${searchQuery}"` : '' }}.</p>
        <button v-if="hasFilters" class="gallery-clear-btn" @click="clearAll">
          Clear filters
        </button>
      </div>
    </div>

    <!-- ── Pagination ──────────────────────────────────────────────────────── -->
    <div v-if="totalPages > 1" class="gallery-pagination">
      <button
        class="gallery-page-btn"
        :disabled="page === 1"
        aria-label="Previous page"
        @click="goPage(page - 1)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M9 2L4 7l5 5" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>

      <template v-for="p in paginationRange" :key="p">
        <span v-if="p === '…'" class="gallery-page-ellipsis">…</span>
        <button
          v-else
          class="gallery-page-btn"
          :class="{ 'gallery-page-btn--active': p === page }"
          :aria-current="p === page ? 'page' : undefined"
          @click="goPage(Number(p))"
        >{{ p }}</button>
      </template>

      <button
        class="gallery-page-btn"
        :disabled="page === totalPages"
        aria-label="Next page"
        @click="goPage(page + 1)"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M5 2l5 5-5 5" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
    </div>

  </div>
</template>

<script setup lang="ts">
const LIMIT = 24

// ── Route sync ────────────────────────────────────────────────────────────────
const route  = useRoute()
const router = useRouter()

const activeCategory = ref((route.query.category as string) || '')
const activeScene    = ref((route.query.scene    as string) || '')
const activeSort     = ref((route.query.sort     as string) || 'latest')
const searchQuery    = ref((route.query.q        as string) || '')
const page           = ref(Number(route.query.page) || 1)

// ── Static filter options ─────────────────────────────────────────────────────
const categories = [
  { label: 'All',        value: '' },
  { label: 'Canvas',     value: 'canvas' },
  { label: 'WebGL',      value: 'webgl' },
  { label: 'CSS',        value: 'css' },
  { label: 'Particles',  value: 'particles' },
  { label: 'Scroll',     value: 'scroll' },
  { label: 'Three.js',   value: 'threejs' },
]

const scenes = [
  '', 'landing-page', 'hero-section', 'background', 'button',
  'card', 'navbar', 'loading', 'cursor',
]

const sortOptions = [
  { label: 'Latest',   value: 'latest' },
  { label: 'Popular',  value: 'popular' },
  { label: 'Featured', value: 'featured' },
]

// ── API fetch (SSR on first load) ─────────────────────────────────────────────
interface Effect {
  id: string; title: string; category: string; scene: string
  cover_url: string; cover_static_url: string
  is_featured: number; view_count: number
}

interface ApiResponse { effects: Effect[]; total: number }

const apiParams = computed(() => ({
  ...(activeCategory.value && { category: activeCategory.value }),
  ...(activeScene.value    && { scene:    activeScene.value }),
  ...(activeSort.value     && { sort:     activeSort.value }),
  ...(searchQuery.value    && { q:        searchQuery.value }),
  page: page.value,
  limit: LIMIT,
}))

const { data, pending, refresh } = await useAsyncData<ApiResponse>(
  'effects-gallery',
  () => $fetch('/api/effects', { params: apiParams.value }),
  { watch: [apiParams] }
)

const effects    = computed(() => data.value?.effects ?? [])
const totalCount = computed(() => data.value?.total ?? 0)
const totalPages = computed(() => Math.ceil(totalCount.value / LIMIT))

// ── Scene dropdown ────────────────────────────────────────────────────────────
const sceneOpen   = ref(false)
const sceneWrapEl = ref<HTMLElement | null>(null)

onMounted(() => document.addEventListener('mousedown', onOutside))
onUnmounted(() => document.removeEventListener('mousedown', onOutside))

function onOutside(e: MouseEvent) {
  if (sceneWrapEl.value && !sceneWrapEl.value.contains(e.target as Node)) {
    sceneOpen.value = false
  }
}

// ── Filter / sort actions ─────────────────────────────────────────────────────
function setCategory(val: string) {
  activeCategory.value = val
  page.value = 1
  syncUrl()
}

function setScene(val: string) {
  activeScene.value = val
  sceneOpen.value   = false
  page.value        = 1
  syncUrl()
}

function setSort(val: string) {
  activeSort.value = val
  page.value       = 1
  syncUrl()
}

let searchTimer: ReturnType<typeof setTimeout> | null = null
function onSearch() {
  if (searchTimer) clearTimeout(searchTimer)
  searchTimer = setTimeout(() => {
    page.value = 1
    syncUrl()
  }, 350)
}

function clearSearch() {
  searchQuery.value = ''
  page.value        = 1
  syncUrl()
}

function clearAll() {
  activeCategory.value = ''
  activeScene.value    = ''
  searchQuery.value    = ''
  activeSort.value     = 'latest'
  page.value           = 1
  syncUrl()
}

function goPage(p: number) {
  page.value = p
  syncUrl()
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const hasFilters = computed(() =>
  !!activeCategory.value || !!activeScene.value || !!searchQuery.value
)

// Sync state → URL query params
function syncUrl() {
  router.replace({
    query: {
      ...(activeCategory.value && { category: activeCategory.value }),
      ...(activeScene.value    && { scene:    activeScene.value }),
      ...(activeSort.value !== 'latest' && { sort: activeSort.value }),
      ...(searchQuery.value    && { q:        searchQuery.value }),
      ...(page.value > 1       && { page:     String(page.value) }),
    },
  })
}

// ── Pagination range ──────────────────────────────────────────────────────────
const paginationRange = computed((): (number | '…')[] => {
  const total = totalPages.value
  const cur   = page.value
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1)
  const pages: (number | '…')[] = [1]
  if (cur > 3)          pages.push('…')
  for (let p = Math.max(2, cur - 1); p <= Math.min(total - 1, cur + 1); p++) pages.push(p)
  if (cur < total - 2)  pages.push('…')
  pages.push(total)
  return pages
})

// ── SEO ───────────────────────────────────────────────────────────────────────
useHead({
  title: 'HTML Effects Gallery — Free Canvas, WebGL & CSS Animations | uimaster.cc',
  meta: [
    { name: 'description', content:
      'Browse free HTML effects: canvas animations, WebGL demos, CSS animations, particles, scroll effects. Live preview, edit in-browser, download source code.' },
    { name: 'keywords', content:
      'HTML effects, CSS animation examples, canvas animation HTML, WebGL effects demo, particle animation, scroll animation, free HTML download' },
    { property: 'og:type',        content: 'website' },
    { property: 'og:title',       content: 'HTML Effects Gallery | uimaster.cc' },
    { property: 'og:description', content: 'Free HTML canvas, WebGL and CSS animation effects.' },
    { property: 'og:url',         content: 'https://uimaster.cc/effects' },
    { property: 'og:image',       content: 'https://uimaster.cc/og-default.png' },
    { name: 'twitter:card',       content: 'summary_large_image' },
  ],
  link: [{ rel: 'canonical', href: 'https://uimaster.cc/effects' }],
})
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */
.gallery-page {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

/* ── Header ───────────────────────────────────────────────────────────────── */
.gallery-header { display: flex; flex-direction: column; gap: 8px; }

.gallery-h1 {
  font-size: 28px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--color-primary, #1D1D1F);
  margin: 0;
}

.gallery-desc {
  font-size: 14px;
  color: var(--color-text-muted, #6B7280);
  margin: 0;
  line-height: 1.6;
}

/* ── Controls bar ─────────────────────────────────────────────────────────── */
.gallery-controls {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

/* Category tabs */
.gallery-tabs {
  display: flex;
  gap: 2px;
  background: var(--color-bg, #F8F9FA);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  padding: 3px;
  flex-shrink: 0;
  overflow-x: auto;
}

.gallery-tab {
  padding: 5px 12px;
  border: none;
  border-radius: 6px;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted, #6B7280);
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: background 150ms ease, color 150ms ease;
}

.gallery-tab:hover { color: var(--color-text, #111827); }

.gallery-tab--active {
  background: var(--color-surface, #fff);
  color: var(--color-primary, #1D1D1F);
  font-weight: 600;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.06));
}

/* Right controls */
.gallery-controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
  margin-left: auto;
}

/* Scene dropdown */
.gallery-scene-wrap { position: relative; }

.gallery-scene-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  background: var(--color-surface, #fff);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted, #6B7280);
  cursor: pointer;
  font-family: inherit;
  white-space: nowrap;
  transition: border-color 150ms ease;
}

.gallery-scene-btn:hover { border-color: var(--color-text-muted, #6B7280); }

.gallery-chevron { transition: transform 150ms ease; }
.gallery-chevron.rotated { transform: rotate(180deg); }

.gallery-scene-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0,0,0,0.10);
  z-index: 80;
  min-width: 160px;
  padding: 4px;
  max-height: 240px;
  overflow-y: auto;
}

.gallery-scene-option {
  display: block;
  width: 100%;
  padding: 7px 10px;
  border: none;
  border-radius: 6px;
  background: transparent;
  text-align: left;
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  cursor: pointer;
  font-family: inherit;
  transition: background 100ms ease;
}

.gallery-scene-option:hover { background: var(--color-bg, #F8F9FA); color: var(--color-text, #111827); }
.gallery-scene-option--active { color: var(--color-primary, #1D1D1F); font-weight: 600; }

/* Search */
.gallery-search-wrap {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 10px;
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  background: var(--color-surface, #fff);
  transition: border-color 150ms ease;
}

.gallery-search-wrap:focus-within { border-color: var(--color-primary, #1D1D1F); }

.gallery-search-icon { color: var(--color-text-muted, #6B7280); flex-shrink: 0; }

.gallery-search-input {
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--color-text, #111827);
  font-family: inherit;
  width: 140px;
}

.gallery-search-input::placeholder { color: var(--color-text-muted, #6B7280); }

.gallery-search-clear {
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-text-muted, #6B7280);
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

/* Sort */
.gallery-sort {
  display: flex;
  gap: 2px;
  background: var(--color-bg, #F8F9FA);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  padding: 3px;
}

.gallery-sort-btn {
  padding: 4px 10px;
  border: none;
  border-radius: 5px;
  background: transparent;
  font-size: 12px;
  font-weight: 500;
  color: var(--color-text-muted, #6B7280);
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms ease, color 150ms ease;
  white-space: nowrap;
}

.gallery-sort-btn:hover { color: var(--color-text, #111827); }
.gallery-sort-btn--active {
  background: var(--color-surface, #fff);
  color: var(--color-primary, #1D1D1F);
  font-weight: 600;
  box-shadow: var(--shadow-sm, 0 1px 2px rgba(0,0,0,0.06));
}

/* ── Grid ─────────────────────────────────────────────────────────────────── */
.gallery-grid-wrap {
  /* Inline ads + cards share the same flow */
  display: grid;
  grid-template-columns: repeat(4, 1fr);
  gap: 16px;
  align-items: start;
}

/* Inline ad spans full width */
.gallery-inline-ad {
  grid-column: 1 / -1;
  display: flex;
  justify-content: center;
}

/* Skeleton cards */
.gallery-skeleton {
  aspect-ratio: 8 / 5;
  border-radius: 10px;
  background: var(--color-border, #E5E7EB);
  animation: shimmer 1.8s ease-in-out infinite;
}

@keyframes shimmer { 0%, 100% { opacity: 1; } 50% { opacity: 0.45; } }

/* Empty state */
.gallery-empty {
  grid-column: 1 / -1;
  padding: 60px 24px;
  text-align: center;
  color: var(--color-text-muted, #6B7280);
  font-size: 14px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
}

.gallery-clear-btn {
  padding: 8px 18px;
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  background: none;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text, #111827);
  cursor: pointer;
  font-family: inherit;
  transition: border-color 150ms ease;
}

.gallery-clear-btn:hover { border-color: var(--color-text-muted); }

/* ── Pagination ───────────────────────────────────────────────────────────── */
.gallery-pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  flex-wrap: wrap;
}

.gallery-page-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  min-width: 34px;
  height: 34px;
  padding: 0 6px;
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 7px;
  background: var(--color-surface, #fff);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted, #6B7280);
  cursor: pointer;
  font-family: inherit;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
}

.gallery-page-btn:hover:not(:disabled) {
  border-color: var(--color-text-muted, #6B7280);
  color: var(--color-text, #111827);
}

.gallery-page-btn--active {
  background: var(--color-primary, #1D1D1F);
  border-color: var(--color-primary, #1D1D1F);
  color: #fff;
}

.gallery-page-btn:disabled {
  opacity: 0.35;
  cursor: not-allowed;
}

.gallery-page-ellipsis {
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  padding: 0 4px;
}

/* Dropdown transition */
.dropdown-enter-active, .dropdown-leave-active { transition: opacity 120ms ease, transform 120ms ease; }
.dropdown-enter-from, .dropdown-leave-to { opacity: 0; transform: translateY(-4px); }

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 1023px) {
  .gallery-grid-wrap { grid-template-columns: repeat(2, 1fr); }
}

@media (max-width: 767px) {
  .gallery-page { padding: 16px 16px 80px; }
  .gallery-h1 { font-size: 22px; }
  .gallery-grid-wrap { grid-template-columns: 1fr; }
  .gallery-controls { gap: 8px; }
  .gallery-controls-right { width: 100%; margin-left: 0; }
  .gallery-search-input { width: 100px; }
  .gallery-tabs { max-width: 100%; }
}
</style>