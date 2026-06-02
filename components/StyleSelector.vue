<template>
  <div class="style-selector">
    <div class="style-selector-header">
      <span class="style-selector-label">UI Style</span>
      <span class="style-selector-count">{{ styles.length }}</span>
    </div>

    <!-- Loading skeleton -->
    <div v-if="loading" class="style-selector-grid">
      <div v-for="i in 8" :key="i" class="style-card style-card--skeleton" />
    </div>

    <!-- Style card grid -->
    <div v-else class="style-selector-grid" role="listbox" aria-label="Select UI style">
      <button
        v-for="style in styles"
        :key="style.slug"
        class="style-card"
        :class="{ 'style-card--selected': modelValue === style.slug }"
        role="option"
        :aria-selected="modelValue === style.slug"
        :title="style.keywords"
        @click="$emit('update:modelValue', style.slug)"
      >
        <!-- Thumbnail -->
        <div class="style-card-thumb">
          <img
            :src="`/meta/${style.slug}-thumbnail.png`"
            :alt="`${style.name} preview thumbnail`"
            class="style-card-img"
            loading="lazy"
            @error="onImgError"
          >
          <!-- Fallback placeholder on img error -->
          <div class="style-card-thumb-placeholder" aria-hidden="true">
            <span class="style-card-thumb-icon">⬡</span>
          </div>
        </div>

        <!-- Name + type -->
        <div class="style-card-info">
          <span class="style-card-name">{{ style.name }}</span>
          <span class="style-card-type">{{ style.type }}</span>
        </div>

        <!-- Selected checkmark -->
        <span v-if="modelValue === style.slug" class="style-card-check" aria-hidden="true">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </span>
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { loadStyles } from '~/composables/useDemos'
import type { RawStyle } from '~/types/design-system'

interface StyleItem {
  slug: string
  name: string
  type: string
  keywords: string
}

defineProps<{
  modelValue: string | null
}>()

defineEmits<{
  'update:modelValue': [slug: string]
}>()

const loading = ref(true)
const styles = ref<StyleItem[]>([])

onMounted(async () => {
  try {
    const raw = await loadStyles()
    styles.value = raw.map((r: RawStyle) => ({
      slug: r['Style Category']
        .toLowerCase()
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '-'),
      name: r['Style Category'],
      type: r['Type'] || '',
      keywords: r['Keywords'] || '',
    }))
  } finally {
    loading.value = false
  }
})

function onImgError(e: Event) {
  const img = e.target as HTMLImageElement
  img.style.display = 'none'
  // Show the sibling placeholder
  const placeholder = img.nextElementSibling as HTMLElement | null
  if (placeholder) placeholder.style.display = 'flex'
}
</script>

<style scoped>
.style-selector {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

/* Header */
.style-selector-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 2px;
}

.style-selector-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-muted, #6B7280);
}

.style-selector-count {
  font-size: 11px;
  color: var(--color-text-muted, #6B7280);
  background: var(--color-border, #E5E7EB);
  padding: 1px 6px;
  border-radius: 9999px;
}

/* 2-column grid with scroll */
.style-selector-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 6px;
  max-height: 360px;
  overflow-y: auto;
  overflow-x: hidden;
  scrollbar-width: thin;
}

/* Card */
.style-card {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
  padding: 8px;
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  cursor: pointer;
  text-align: left;
  min-width: 0;
  transition:
    border-color 150ms ease,
    background-color 150ms ease,
    box-shadow 150ms ease;
  outline: none;
}

.style-card:hover {
  border-color: var(--color-text-muted, #6B7280);
}

.style-card:focus-visible {
  box-shadow: 0 0 0 2px var(--color-accent, #3B82F6);
  border-color: var(--color-accent, #3B82F6);
}

.style-card--selected {
  border-color: var(--color-primary, #1D1D1F);
  background-color: var(--color-bg, #F8F9FA);
}

.style-card--skeleton {
  height: 80px;
  background: var(--color-border, #E5E7EB);
  animation: shimmer 1.8s ease-in-out infinite;
  cursor: default;
}

@keyframes shimmer {
  0%, 100% { opacity: 1; }
  50%       { opacity: 0.5; }
}

/* Thumbnail */
.style-card-thumb {
  position: relative;
  width: 100%;
  aspect-ratio: 3 / 2;
  border-radius: 4px;
  overflow: hidden;
  background: var(--color-bg, #F8F9FA);
}

.style-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.style-card-thumb-placeholder {
  position: absolute;
  inset: 0;
  display: none;
  align-items: center;
  justify-content: center;
  background: var(--color-border, #E5E7EB);
  font-size: 18px;
  color: var(--color-text-muted, #6B7280);
}

/* Info */
.style-card-info {
  display: flex;
  flex-direction: column;
  gap: 1px;
}

.style-card-name {
  font-size: 11px;
  font-weight: 600;
  color: var(--color-text, #111827);
  line-height: 1.3;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.style-card-type {
  font-size: 10px;
  color: var(--color-text-muted, #6B7280);
  line-height: 1.2;
}

/* Selected checkmark */
.style-card-check {
  position: absolute;
  top: 6px;
  right: 6px;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background: var(--color-primary, #1D1D1F);
  color: #fff;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}
</style>
