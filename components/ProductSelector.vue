<template>
  <div class="product-selector" ref="rootEl">
    <div class="product-selector-header">
      <span class="product-selector-label">Product Type</span>
    </div>

    <!-- Trigger input -->
    <div
      class="product-selector-trigger"
      :class="{ 'product-selector-trigger--open': open }"
    >
      <svg class="product-selector-search-icon" width="14" height="14" viewBox="0 0 16 16"
           fill="none" aria-hidden="true">
        <circle cx="7" cy="7" r="5" stroke="currentColor" stroke-width="1.5"/>
        <path d="M11 11l3 3" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <input
        ref="inputEl"
        v-model="search"
        class="product-selector-input"
        :placeholder="selectedLabel || 'Search product type…'"
        aria-label="Search product type"
        autocomplete="off"
        @focus="open = true"
        @keydown.escape="close"
        @keydown.enter.prevent="selectHighlighted"
        @keydown.arrow-down.prevent="moveHighlight(1)"
        @keydown.arrow-up.prevent="moveHighlight(-1)"
      >
      <!-- Clear / chevron -->
      <button
        v-if="modelValue"
        class="product-selector-clear"
        aria-label="Clear selection"
        tabindex="-1"
        @click.stop="clear"
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
          <path d="M2 2l8 8M10 2l-8 8" stroke="currentColor" stroke-width="1.5"
                stroke-linecap="round"/>
        </svg>
      </button>
      <svg v-else class="product-selector-chevron" :class="{ rotated: open }"
           width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
        <path d="M2 4l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
    </div>

    <!-- Dropdown -->
    <Transition name="dropdown">
      <div v-if="open" class="product-selector-dropdown" role="listbox" aria-label="Product types">
        <div v-if="filtered.length === 0" class="product-selector-empty">
          No results for "{{ search }}"
        </div>
        <button
          v-for="(item, idx) in filtered"
          :key="item.slug"
          class="product-selector-option"
          :class="{
            'product-selector-option--selected': modelValue === item.slug,
            'product-selector-option--highlighted': highlightIdx === idx,
          }"
          role="option"
          :aria-selected="modelValue === item.slug"
          @mouseenter="highlightIdx = idx"
          @click="selectItem(item)"
        >
          <span class="product-selector-option-name">{{ item.name }}</span>
          <svg v-if="modelValue === item.slug" width="12" height="12" viewBox="0 0 12 12" fill="none">
            <path d="M2 6l3 3 5-5" stroke="currentColor" stroke-width="1.8"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { loadProducts } from '~/composables/useDemos'
import type { RawProduct } from '~/types/design-system'

interface ProductItem {
  slug: string
  name: string
  keywords: string
}

const props = defineProps<{
  modelValue: string | null
}>()

const emit = defineEmits<{
  'update:modelValue': [slug: string]
}>()

const rootEl = ref<HTMLElement | null>(null)
const inputEl = ref<HTMLInputElement | null>(null)
const open = ref(false)
const search = ref('')
const highlightIdx = ref(0)
const allProducts = ref<ProductItem[]>([])

// Load products on mount
onMounted(async () => {
  const raw = await loadProducts()
  allProducts.value = raw.map((r: RawProduct) => ({
    slug: r['Product Type']
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, '')
      .replace(/\s+/g, '-'),
    name: r['Product Type'],
    keywords: r['Keywords'] || '',
  }))
})

// Fuzzy filter — checks name and keywords
const filtered = computed<ProductItem[]>(() => {
  const q = search.value.trim().toLowerCase()
  if (!q) return allProducts.value
  return allProducts.value.filter(
    p =>
      p.name.toLowerCase().includes(q) ||
      p.keywords.toLowerCase().includes(q)
  )
})

const selectedLabel = computed(() => {
  if (!props.modelValue) return ''
  return allProducts.value.find(p => p.slug === props.modelValue)?.name ?? ''
})

// Reset highlight when filtered list changes
watch(filtered, () => { highlightIdx.value = 0 })

// When opening, clear search so user sees all options
watch(open, (v) => {
  if (v) {
    search.value = ''
    nextTick(() => inputEl.value?.focus())
  }
})

function selectItem(item: ProductItem) {
  emit('update:modelValue', item.slug)
  close()
}

function selectHighlighted() {
  const item = filtered.value[highlightIdx.value]
  if (item) selectItem(item)
}

function moveHighlight(dir: 1 | -1) {
  const max = filtered.value.length - 1
  highlightIdx.value = Math.max(0, Math.min(max, highlightIdx.value + dir))
}

function clear() {
  emit('update:modelValue', '')
  search.value = ''
}

function close() {
  open.value = false
  search.value = ''
}

// Close on outside click
onMounted(() => {
  document.addEventListener('mousedown', onOutsideClick)
})
onUnmounted(() => {
  document.removeEventListener('mousedown', onOutsideClick)
})

function onOutsideClick(e: MouseEvent) {
  if (rootEl.value && !rootEl.value.contains(e.target as Node)) {
    close()
  }
}
</script>

<style scoped>
.product-selector {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

/* Header label */
.product-selector-header {
  padding: 0 2px;
}

.product-selector-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.07em;
  text-transform: uppercase;
  color: var(--color-text-muted, #6B7280);
}

/* Trigger */
.product-selector-trigger {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 10px;
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  cursor: text;
  transition: border-color 150ms ease, box-shadow 150ms ease;
}

.product-selector-trigger--open,
.product-selector-trigger:focus-within {
  border-color: var(--color-primary, #1D1D1F);
  box-shadow: 0 0 0 3px rgba(17, 24, 39, 0.08);
}

.product-selector-search-icon {
  color: var(--color-text-muted, #6B7280);
  flex-shrink: 0;
}

.product-selector-input {
  flex: 1;
  border: none;
  outline: none;
  background: transparent;
  font-size: 13px;
  color: var(--color-text, #111827);
  min-width: 0;
  font-family: inherit;
}

.product-selector-input::placeholder {
  color: var(--color-text-muted, #6B7280);
}

.product-selector-clear,
.product-selector-chevron {
  flex-shrink: 0;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  color: var(--color-text-muted, #6B7280);
  display: flex;
  align-items: center;
  transition: color 150ms ease;
}

.product-selector-clear:hover {
  color: var(--color-text, #111827);
}

.product-selector-chevron {
  transition: transform 150ms ease, color 150ms ease;
}

.product-selector-chevron.rotated {
  transform: rotate(180deg);
}

/* Dropdown */
.product-selector-dropdown {
  position: absolute;
  top: calc(100% + 4px);
  left: 0;
  right: 0;
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.10);
  z-index: 100;
  max-height: 280px;
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 4px;
}

.product-selector-empty {
  padding: 12px 10px;
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  text-align: center;
}

.product-selector-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  padding: 8px 10px;
  border-radius: 6px;
  border: none;
  background: transparent;
  cursor: pointer;
  text-align: left;
  gap: 8px;
  transition: background-color 100ms ease;
  color: var(--color-text-muted, #6B7280);
}

.product-selector-option--highlighted,
.product-selector-option:hover {
  background-color: var(--color-bg, #F8F9FA);
  color: var(--color-text, #111827);
}

.product-selector-option--selected {
  color: var(--color-primary, #1D1D1F);
  font-weight: 500;
}

.product-selector-option-name {
  font-size: 13px;
  line-height: 1.4;
}

/* Dropdown transition */
.dropdown-enter-active,
.dropdown-leave-active {
  transition: opacity 120ms ease, transform 120ms ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
