<template>
  <NuxtLink
    :to="`/preview/${meta.slug}`"
    class="demo-card"
    @mouseenter="hover = true"
    @mouseleave="hover = false"
  >
    <div class="demo-card-cover">
      <img
        v-if="hover && meta.cover_url"
        :src="meta.cover_url"
        :alt="`${meta.style} ${meta.product} preview`"
        class="demo-card-img"
        loading="lazy"
      />
      <img
        v-else-if="meta.cover_static_url"
        :src="meta.cover_static_url"
        :alt="`${meta.style} ${meta.product} preview`"
        class="demo-card-img"
        loading="lazy"
      />
      <div v-else class="demo-card-placeholder">
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" aria-hidden="true">
          <rect x="3" y="3" width="18" height="18" rx="3" />
          <circle cx="8.5" cy="8.5" r="1.5" />
          <path d="M21 15l-5-5L5 21" />
        </svg>
      </div>
    </div>
    <div class="demo-card-body">
      <h3 class="demo-card-title">{{ meta.style }} {{ meta.product }}</h3>
      <span class="demo-card-tag">{{ meta.style }}</span>
    </div>
  </NuxtLink>
</template>

<script setup lang="ts">
import type { DemoMeta } from '~/types/design-system'

defineProps<{
  meta: DemoMeta
}>()

const hover = ref(false)
</script>

<style scoped>
.demo-card {
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border, #E5E7EB);
  background: var(--color-card, #fff);
  text-decoration: none;
  color: inherit;
  transition: box-shadow 200ms ease, transform 200ms ease;
  cursor: pointer;
}
.demo-card:hover {
  box-shadow: 0 8px 24px rgba(0,0,0,0.08);
  transform: translateY(-2px);
}

.demo-card-cover {
  position: relative;
  width: 100%;
  aspect-ratio: 16 / 9;
  background: var(--color-muted, #F3F4F6);
  overflow: hidden;
}
.demo-card-img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}
.demo-card-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: var(--color-text-muted, #9CA3AF);
}

.demo-card-body {
  padding: 10px 14px 12px;
  display: flex;
  flex-direction: column;
  gap: 4px;
}
.demo-card-title {
  margin: 0;
  font-size: 13px;
  font-weight: 600;
  line-height: 1.3;
  color: var(--color-text, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
.demo-card-tag {
  align-self: flex-start;
  font-size: 11px;
  padding: 2px 8px;
  border-radius: 4px;
  background: var(--color-muted, #F3F4F6);
  color: var(--color-text-muted, #6B7280);
  font-weight: 500;
}
</style>
