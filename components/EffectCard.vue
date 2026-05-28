<template>
  <NuxtLink
    :to="`/effects/${effect.id}`"
    class="effect-card"
    :aria-label="`${effect.title} — ${effect.category}`"
    @mouseenter="onEnter"
    @mouseleave="onLeave"
    @focusin="onEnter"
    @focusout="onLeave"
  >
    <!-- Thumbnail area -->
    <div class="effect-card-thumb">
      <!-- Static image (always rendered, hidden when playing) -->
      <img
        ref="staticImg"
        :src="effect.cover_static_url"
        :alt="`${effect.title} preview`"
        class="effect-card-img effect-card-img--static"
        :class="{ 'effect-card-img--hidden': playing }"
        loading="lazy"
        width="320"
        height="200"
        @error="onImgError"
      >
      <!-- Animated image (only src-set when hovered, so browsers don't prefetch) -->
      <img
        v-if="animSrc"
        :src="animSrc"
        :alt="`${effect.title} animated preview`"
        class="effect-card-img effect-card-img--anim"
        :class="{ 'effect-card-img--visible': playing }"
        aria-hidden="true"
      >

      <!-- Category badge -->
      <span class="effect-card-category">{{ effect.category }}</span>

      <!-- Featured star -->
      <span v-if="effect.is_featured" class="effect-card-featured" aria-label="Featured">
        ★
      </span>
    </div>

    <!-- Card body -->
    <div class="effect-card-body">
      <h3 class="effect-card-title">{{ effect.title }}</h3>
      <div class="effect-card-meta">
        <span class="effect-card-scene">{{ effect.scene }}</span>
        <span class="effect-card-views">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z"
                  stroke="currentColor" stroke-width="1.2"/>
            <circle cx="6" cy="6" r="1.5" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          {{ formatCount(effect.view_count) }}
        </span>
      </div>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
interface Effect {
  id: string
  title: string
  category: string
  scene: string
  cover_url: string
  cover_static_url: string
  is_featured: number
  view_count: number
}

const props = defineProps<{ effect: Effect }>()

const playing  = ref(false)
const animSrc  = ref<string | null>(null)

function onEnter() {
  // Only set animSrc the first time to avoid re-fetch
  if (!animSrc.value) animSrc.value = props.effect.cover_url
  playing.value = true
}

function onLeave() {
  playing.value = false
}

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.visibility = 'hidden'
}

function formatCount(n: number): string {
  if (!n) return '0'
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`
  return String(n)
}
</script>

<style scoped>
.effect-card {
  display: flex;
  flex-direction: column;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
  overflow: hidden;
  text-decoration: none;
  background: var(--color-surface, #fff);
  transition: border-color 150ms ease, box-shadow 150ms ease, transform 150ms ease;
  cursor: pointer;
}

.effect-card:hover,
.effect-card:focus-within {
  border-color: var(--color-text-muted, #6B7280);
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.09);
  transform: translateY(-2px);
}

.effect-card:focus-visible {
  outline: 2px solid var(--color-accent, #3B82F6);
  outline-offset: 2px;
}

/* Thumbnail */
.effect-card-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 8 / 5;   /* 640×400 native ratio */
  background: var(--color-bg, #F8F9FA);
  overflow: hidden;
}

.effect-card-img {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.effect-card-img--static {
  opacity: 1;
  transition: opacity 180ms ease;
}

.effect-card-img--hidden {
  opacity: 0;
}

.effect-card-img--anim {
  opacity: 0;
  transition: opacity 180ms ease;
}

.effect-card-img--visible {
  opacity: 1;
}

/* Badges */
.effect-card-category {
  position: absolute;
  top: 8px;
  left: 8px;
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 9999px;
  background: rgba(17, 24, 39, 0.65);
  color: #fff;
  backdrop-filter: blur(4px);
}

.effect-card-featured {
  position: absolute;
  top: 8px;
  right: 8px;
  font-size: 13px;
  color: #FBBF24;
  filter: drop-shadow(0 1px 2px rgba(0,0,0,0.4));
}

/* Body */
.effect-card-body {
  padding: 10px 12px;
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.effect-card-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0;
  line-height: 1.35;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.effect-card-meta {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.effect-card-scene {
  font-size: 11px;
  color: var(--color-text-muted, #6B7280);
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.effect-card-views {
  display: flex;
  align-items: center;
  gap: 3px;
  font-size: 11px;
  color: var(--color-text-muted, #6B7280);
  flex-shrink: 0;
}
</style>