<template>
  <section class="demo-card-grid-wrapper">
    <div class="demo-card-grid-header">
      <h2 class="demo-card-grid-title">{{ title }}</h2>
      <p v-if="description" class="demo-card-grid-desc">{{ description }}</p>
    </div>

    <div v-if="loading" class="demo-card-grid-loading">
      <span>Loading demos…</span>
    </div>

    <div v-else-if="filtered.length === 0" class="demo-card-grid-empty">
      <p>No demos yet. Run <code>generate.cjs --type=design</code> to generate covers.</p>
    </div>

    <div v-else class="demo-card-grid">
      <DemoCard v-for="demo in filtered" :key="demo.slug" :meta="demo" />
    </div>
  </section>
</template>

<script setup lang="ts">
import type { DemoMeta } from '~/types/design-system'

const props = withDefaults(defineProps<{
  title?: string
  description?: string
  metas?: DemoMeta[]
  loading?: boolean
}>(), {
  title: 'All Demos',
  description: '',
})

const filtered = computed(() => {
  if (!props.metas) return []
  return props.metas
})
</script>

<style scoped>
.demo-card-grid-wrapper {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.demo-card-grid-header {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.demo-card-grid-title {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--color-text, #111827);
}

.demo-card-grid-desc {
  margin: 0;
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
}

.demo-card-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  gap: 16px;
}

.demo-card-grid-loading {
  display: flex;
  justify-content: center;
  padding: 32px 0;
  color: var(--color-text-muted, #6B7280);
  font-size: 13px;
}

.demo-card-grid-empty {
  display: flex;
  justify-content: center;
  padding: 32px 0;
  color: var(--color-text-muted, #6B7280);
  font-size: 13px;
}
.demo-card-grid-empty code {
  font-size: 12px;
  background: var(--color-border, #E5E7EB);
  padding: 1px 5px;
  border-radius: 4px;
}
</style>
