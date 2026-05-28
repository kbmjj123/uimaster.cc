<template>
  <div
    class="ad-slot"
    :class="[`ad-slot--${size}`, `ad-slot--${position}`, { 'ad-slot--mobile-only': mobileOnly }]"
    :style="slotStyle"
    aria-hidden="true"
  >
    <!-- Placeholder shown before ad loads -->
    <div v-if="!adLoaded" class="ad-slot-placeholder" />

    <!-- Ad container — rendered lazily client-side -->
    <div
      v-if="isClient"
      ref="adContainer"
      class="ad-slot-inner"
    />
  </div>
</template>

<script setup lang="ts">
/**
 * AdSlot — Google AdSense compatible ad placeholder
 *
 * Props:
 *   size     — '728x90' | '160x600' | '320x50'
 *   position — descriptive slot label (e.g. 'below-preview', 'sidebar', 'mobile')
 *
 * Behaviour:
 *   - Always renders with fixed dimensions to prevent CLS
 *   - Placeholder grey box shown until ad loads
 *   - Only inits AdSense on client after intersection (lazy)
 *   - On mobile, hides 728x90 and 160x600 unless position === 'mobile'
 */

type AdSize = '728x90' | '160x600' | '320x50'

const props = withDefaults(defineProps<{
  size: AdSize
  position: string
}>(), {
  size: '728x90',
  position: 'default',
})

const SIZE_MAP: Record<AdSize, { w: number; h: number }> = {
  '728x90':  { w: 728, h: 90 },
  '160x600': { w: 160, h: 600 },
  '320x50':  { w: 320, h: 50 },
}

const dims = computed(() => SIZE_MAP[props.size])

// The slot always occupies its declared size so layout is stable
const slotStyle = computed(() => ({
  width: `${dims.value.w}px`,
  height: `${dims.value.h}px`,
  maxWidth: '100%',
}))

// Only 320x50 is shown on mobile ("mobile" position)
const mobileOnly = computed(() => props.size === '320x50')

// Client-side hydration flag
const isClient = ref(false)
const adLoaded = ref(false)
const adContainer = ref<HTMLElement | null>(null)

onMounted(() => {
  isClient.value = true

  // Lazy-load ad on intersection to avoid blocking LCP
  if (!adContainer.value) return

  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting) {
        observer.disconnect()
        initAd()
      }
    },
    { rootMargin: '200px' }
  )

  observer.observe(adContainer.value)
})

function initAd() {
  // AdSense push — only if adsbygoogle is available (loaded by plugin)
  try {
    if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
      ;((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({})
      adLoaded.value = true
    }
  } catch {
    // AdSense not yet loaded — placeholder remains visible
  }
}
</script>

<style scoped>
.ad-slot {
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  /* Fixed dimensions prevent CLS */
  overflow: hidden;
}

.ad-slot-placeholder {
  width: 100%;
  height: 100%;
  background-color: var(--color-border, #E5E7EB);
  border-radius: var(--radius-sm, 4px);
  position: relative;
  overflow: hidden;
}

/* Subtle shimmer animation on placeholder */
.ad-slot-placeholder::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(
    90deg,
    transparent 0%,
    rgba(255, 255, 255, 0.4) 50%,
    transparent 100%
  );
  animation: ad-shimmer 2s ease-in-out infinite;
  transform: translateX(-100%);
}

@keyframes ad-shimmer {
  to { transform: translateX(100%); }
}

.ad-slot-inner {
  width: 100%;
  height: 100%;
}

/* Mobile-only: hide 728x90 and 160x600 on small screens */
@media (max-width: 767px) {
  .ad-slot--728x90:not(.ad-slot--mobile-only) {
    display: none;
  }
  .ad-slot--160x600:not(.ad-slot--mobile-only) {
    display: none;
  }
}

/* Desktop: hide 320x50 mobile strip */
@media (min-width: 768px) {
  .ad-slot--mobile-only {
    display: none;
  }
}
</style>
