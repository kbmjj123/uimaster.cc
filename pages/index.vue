<template>
  <div class="home">
    <!-- ── Above-fold hero text (minimal, not competing with preview) ── -->
    <div class="home-hero">
      <h1 class="home-hero-title">
        UI Design System Preview
      </h1>
      <p class="home-hero-desc">
        Pick a style and product type — instantly preview the demo and download
        your <code>MASTER.md</code> for Claude Code, Cursor, or Windsurf.
      </p>
    </div>

    <!-- ── Main layout: selector sidebar + preview area ── -->
    <div class="home-layout">

      <!-- ── Left: selector panel ── -->
      <aside class="home-sidebar">
        <!-- Style selector -->
        <StyleSelector
          v-model="selectedStyle"
          class="home-sidebar-section"
        />

        <!-- Product selector -->
        <div class="home-sidebar-section">
          <ProductSelector v-model="selectedProduct" />
        </div>

        <!-- Download button (T04 will replace this stub) -->
        <div class="home-sidebar-section home-sidebar-download">
          <button
            class="home-download-btn"
            :disabled="!canDownload"
            @click="onDownload"
          >
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none" aria-hidden="true">
              <path d="M7.5 1v9m0 0l-3-3m3 3l3-3M2 11v1a2 2 0 002 2h7a2 2 0 002-2v-1"
                    stroke="currentColor" stroke-width="1.5" stroke-linecap="round"
                    stroke-linejoin="round"/>
            </svg>
            {{ downloadLabel }}
          </button>
          <p class="home-download-hint">
            Compatible with Claude Code · Cursor · Windsurf
          </p>
        </div>

        <!-- Ad B: 160×600 sidebar (hidden on mobile per ads.md) -->
        <div class="home-sidebar-ad">
          <AdSlot size="160x600" position="ad-sidebar" />
        </div>
      </aside>

      <!-- ── Right: preview area ── -->
      <main class="home-preview-area">
        <DemoPreview
          :demo-url="demoUrl"
          :style="selectedStyleName"
          :product="selectedProductName"
          :source="demoSource"
          @mode-change="onModeChange"
        />

        <!-- Ad A: 728×90 below preview (hidden on mobile) -->
        <div class="home-ad-below-preview">
          <AdSlot size="728x90" position="ad-below-preview" />
        </div>

        <!-- Mobile ad: 320×50 (shown only on mobile, fixed position handled in layout) -->
        <!-- The default.vue layout already renders the mobile strip; no duplicate here -->
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useDemos, loadStyles, loadProducts } from '~/composables/useDemos'
import type { RawStyle, RawProduct } from '~/types/design-system'

// ── Page meta ────────────────────────────────────────────────────────────────
useHead({
  title: 'uimaster.cc — UI Style Preview & Design System Generator',
  meta: [
    {
      name: 'description',
      content:
        'Preview 67 UI styles × 161 product types. Select your style, preview live demos, and download MASTER.md for Claude Code, Cursor, or Windsurf.',
    },
  ],
})

// ── State ─────────────────────────────────────────────────────────────────────
const route = useRoute()
const router = useRouter()
const { resolveDemoInfo, generateSlug } = useDemos()

const selectedStyle   = ref<string | null>(null)
const selectedProduct = ref<string | null>(null)
const demoUrl         = ref<string | null>(null)
const demoSource      = ref<'official' | 'community' | null>(null)
const downloadState   = ref<'idle' | 'loading' | 'done'>('idle')

// Human-readable names for the toolbar
const styleNames   = ref<Record<string, string>>({})
const productNames = ref<Record<string, string>>({})

const selectedStyleName   = computed(() => styleNames.value[selectedStyle.value ?? ''] ?? '')
const selectedProductName = computed(() => productNames.value[selectedProduct.value ?? ''] ?? '')

const canDownload = computed(() => !!selectedStyle.value && !!selectedProduct.value)

const downloadLabel = computed(() => {
  if (downloadState.value === 'loading') return 'Generating…'
  if (downloadState.value === 'done')    return '✓ Downloaded'
  return 'Download MASTER.md'
})

// ── Load name maps (slug → display name) ─────────────────────────────────────
onMounted(async () => {
  const [rawStyles, rawProducts] = await Promise.all([loadStyles(), loadProducts()])

  for (const r of rawStyles as RawStyle[]) {
    const slug = r['Style Category']
      .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
    styleNames.value[slug] = r['Style Category']
  }
  for (const r of rawProducts as RawProduct[]) {
    const slug = r['Product Type']
      .toLowerCase().replace(/[^a-z0-9\s]/g, '').replace(/\s+/g, '-')
    productNames.value[slug] = r['Product Type']
  }

  // Initialise from URL query if present (e.g. /preview/glass-fintech → /)
  // Or from route query params ?style=&product=
  const qStyle   = route.query.style as string | undefined
  const qProduct = route.query.product as string | undefined
  if (qStyle)   selectedStyle.value   = qStyle
  if (qProduct) selectedProduct.value = qProduct
})

// ── Resolve demo URL when selection changes ───────────────────────────────────
watchEffect(async () => {
  const style   = selectedStyle.value
  const product = selectedProduct.value

  if (!style || !product) {
    demoUrl.value    = null
    demoSource.value = null
    return
  }

  const info = await resolveDemoInfo(
    styleNames.value[style]   || style,
    productNames.value[product] || product
  )

  demoUrl.value    = info.url
  demoSource.value = info.source
})

// ── URL sync: update route without navigating ─────────────────────────────────
// Writes /preview/[slug] into the browser bar via replaceState
watch(
  [selectedStyle, selectedProduct],
  ([style, product]) => {
    if (style && product) {
      const slug = generateSlug(
        styleNames.value[style]   || style,
        productNames.value[product] || product
      )
      // Update URL without triggering navigation (History API)
      window.history.replaceState(null, '', `/preview/${slug}`)
    } else {
      window.history.replaceState(null, '', '/')
    }
  }
)

// ── Download stub (T04 will wire up useMasterMd) ──────────────────────────────
async function onDownload() {
  if (!canDownload.value || downloadState.value === 'loading') return
  // T04 will replace this with: const { generate } = useMasterMd(); ...
  downloadState.value = 'loading'
  await new Promise(r => setTimeout(r, 500))
  downloadState.value = 'done'
  setTimeout(() => { downloadState.value = 'idle' }, 3000)
}

function onModeChange(_mode: string) {
  // Could persist mode preference in localStorage
}
</script>

<style scoped>
/* ── Hero ──────────────────────────────────────────────────────────────────── */
.home {
  max-width: 1280px;
  margin: 0 auto;
  padding: 32px 24px 64px;
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.home-hero {
  display: flex;
  flex-direction: column;
  gap: 8px;
  max-width: 640px;
}

.home-hero-title {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.5px;
  color: var(--color-primary, #1D1D1F);
  margin: 0;
  line-height: 1.2;
}

.home-hero-desc {
  font-size: 14px;
  color: var(--color-text-muted, #6B7280);
  margin: 0;
  line-height: 1.6;
}

.home-hero-desc code {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  background: var(--color-border, #E5E7EB);
  padding: 1px 5px;
  border-radius: 4px;
  color: var(--color-text, #111827);
}

/* ── Main layout ───────────────────────────────────────────────────────────── */
.home-layout {
  display: flex;
  gap: 24px;
  align-items: flex-start;
}

/* ── Sidebar ───────────────────────────────────────────────────────────────── */
.home-sidebar {
  width: 256px;   /* w-64 */
  flex-shrink: 0;
  display: flex;
  flex-direction: column;
  gap: 20px;
  position: sticky;
  top: calc(var(--navbar-height, 60px) + 16px);
}

.home-sidebar-section {
  /* individual section spacing handled by gap above */
}

/* Download button */
.home-sidebar-download {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.home-download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 16px;
  background: var(--color-primary, #1D1D1F);
  color: #fff;
  border: none;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 150ms ease, transform 150ms ease;
}

.home-download-btn:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.home-download-btn:active:not(:disabled) {
  transform: translateY(0);
}

.home-download-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.home-download-hint {
  font-size: 11px;
  color: var(--color-text-muted, #6B7280);
  text-align: center;
  margin: 0;
  line-height: 1.4;
}

/* Sidebar ad */
.home-sidebar-ad {
  /* 160x600 — hidden on mobile via AdSlot component */
}

/* ── Preview area ──────────────────────────────────────────────────────────── */
.home-preview-area {
  flex: 1;
  min-width: 0;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

/* Ad below preview — hidden on mobile per ads.md */
.home-ad-below-preview {
  display: flex;
  justify-content: center;
}

/* ── Mobile layout ─────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .home {
    padding: 16px 16px 80px; /* 80px for mobile ad strip */
  }

  .home-hero-title {
    font-size: 20px;
  }

  .home-layout {
    flex-direction: column;
    gap: 20px;
  }

  .home-sidebar {
    width: 100%;
    position: static;
  }

  /* On mobile, sidebar ad (160x600) is hidden by AdSlot component automatically */
  .home-sidebar-ad {
    display: none;
  }

  /* Below-preview 728x90 is hidden on mobile by AdSlot component */
  .home-ad-below-preview {
    display: none;
  }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .home-sidebar {
    width: 220px;
  }
}
</style>
