<template>
  <div class="download-btn-wrapper">
    <!-- Main button -->
    <button
      class="download-btn"
      :class="[
        `download-btn--${state}`,
        { 'download-btn--disabled': !canDownload }
      ]"
      :disabled="!canDownload || state === 'loading'"
      :aria-label="ariaLabel"
      :aria-busy="state === 'loading'"
      @click="handleClick"
    >
      <!-- Icon slot: changes per state -->
      <span class="download-btn-icon" aria-hidden="true">
        <!-- idle: download arrow -->
        <svg
          v-if="state === 'idle'"
          width="15" height="15" viewBox="0 0 15 15" fill="none"
        >
          <path
            d="M7.5 1v8m0 0L4.5 6m3 3l3-3M2 11v1a2 2 0 002 2h7a2 2 0 002-2v-1"
            stroke="currentColor" stroke-width="1.6"
            stroke-linecap="round" stroke-linejoin="round"
          />
        </svg>

        <!-- loading: spinner -->
        <svg
          v-else-if="state === 'loading'"
          class="download-btn-spinner"
          width="15" height="15" viewBox="0 0 15 15" fill="none"
        >
          <circle
            cx="7.5" cy="7.5" r="6"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round"
            stroke-dasharray="28"
            stroke-dashoffset="10"
          />
        </svg>

        <!-- success: checkmark -->
        <svg
          v-else-if="state === 'success'"
          width="15" height="15" viewBox="0 0 15 15" fill="none"
        >
          <path
            d="M2.5 8l3.5 3.5 6.5-7"
            stroke="currentColor" stroke-width="1.8"
            stroke-linecap="round" stroke-linejoin="round"
          />
        </svg>

        <!-- error: retry icon -->
        <svg
          v-else-if="state === 'error'"
          width="15" height="15" viewBox="0 0 15 15" fill="none"
        >
          <path
            d="M1.5 7.5A6 6 0 1013.5 7.5 6 6 0 001.5 7.5zm6-3v3.5m0 1.5v.5"
            stroke="currentColor" stroke-width="1.5"
            stroke-linecap="round"
          />
        </svg>
      </span>

      <span class="download-btn-label">{{ label }}</span>
    </button>

    <!-- Compatibility hint -->
    <p class="download-btn-hint">
      <span class="download-btn-hint-dot" /> Claude Code
      <span class="download-btn-hint-sep">·</span> Cursor
      <span class="download-btn-hint-sep">·</span> Windsurf
    </p>

    <!-- Error Toast -->
    <Transition name="toast">
      <div
        v-if="toastVisible"
        class="download-btn-toast"
        role="alert"
        aria-live="assertive"
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.4"/>
          <path d="M7 4v3.5M7 9.5v.5" stroke="currentColor" stroke-width="1.4"
                stroke-linecap="round"/>
        </svg>
        <span>{{ toastMessage }}</span>
        <button
          class="download-btn-toast-close"
          aria-label="Dismiss error"
          @click="toastVisible = false"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none" aria-hidden="true">
            <path d="M1 1l8 8M9 1L1 9" stroke="currentColor" stroke-width="1.4"
                  stroke-linecap="round"/>
          </svg>
        </button>
      </div>
    </Transition>
  </div>
</template>

<script setup lang="ts">
import { useMasterMd } from '~/composables/useMasterMd'
import { useDesignSystem } from '~/composables/useDesignSystem'
import type { DesignSystem } from '~/types/design-system'

// ── Props ─────────────────────────────────────────────────────────────────────

const props = withDefaults(defineProps<{
  /**
   * Pre-resolved DesignSystem object.
   * If provided, the button generates directly from this.
   * If omitted, it will call useDesignSystem().generateDesignSystem(query).
   */
  designSystem?: DesignSystem | null
  /**
   * Fallback query passed to generateDesignSystem when designSystem prop is null.
   */
  query?: string
  /**
   * Project name embedded in MASTER.md header.
   */
  projectName?: string
  /**
   * Disable the button explicitly (e.g. no style/product selected yet).
   */
  disabled?: boolean
}>(), {
  designSystem: null,
  query: '',
  projectName: 'My Project',
  disabled: false,
})

// ── State ─────────────────────────────────────────────────────────────────────

type BtnState = 'idle' | 'loading' | 'success' | 'error'

const state = ref<BtnState>('idle')
const toastVisible = ref(false)
const toastMessage = ref('')
let successTimer: ReturnType<typeof setTimeout> | null = null
let toastTimer:   ReturnType<typeof setTimeout> | null = null

const canDownload = computed(() => !props.disabled && !!props.designSystem || !!props.query)

const label = computed(() => {
  switch (state.value) {
    case 'loading': return 'Generating…'
    case 'success': return 'Downloaded!'
    case 'error':   return 'Retry Download'
    default:        return 'Download MASTER.md'
  }
})

const ariaLabel = computed(() => {
  if (!canDownload.value) return 'Download MASTER.md (select a style and product first)'
  return label.value
})

// ── Composables ───────────────────────────────────────────────────────────────

const { generate } = useMasterMd()
const { generateDesignSystem } = useDesignSystem()

// ── Core handler ──────────────────────────────────────────────────────────────

async function handleClick() {
  // Guard: no double-trigger while loading
  if (state.value === 'loading' || !canDownload.value) return

  // Clear any pending timers
  clearTimers()
  state.value = 'loading'
  toastVisible.value = false

  try {
    // 1. Resolve the DesignSystem
    let ds = props.designSystem

    if (!ds) {
      if (!props.query.trim()) throw new Error('No design system or query provided.')
      ds = await generateDesignSystem(props.query, props.projectName)
      if (!ds) throw new Error('Could not match a design system for this query.')
    }

    // 2. Generate the Markdown string
    const content = generate(ds, props.projectName)

    if (!content || content.length < 100) {
      throw new Error('Generated content appears to be empty. Please try again.')
    }

    // 3. Trigger browser download
    downloadFile(content, 'MASTER.md')

    // 4. Show success state for 3 s
    state.value = 'success'
    successTimer = setTimeout(() => {
      state.value = 'idle'
    }, 3000)

  } catch (err: unknown) {
    state.value = 'error'
    const msg = err instanceof Error ? err.message : 'Download failed. Please try again.'
    showToast(msg)
    // Reset to idle after 6 s so user can retry
    successTimer = setTimeout(() => {
      if (state.value === 'error') state.value = 'idle'
    }, 6000)
  }
}

// ── File download helper ──────────────────────────────────────────────────────

function downloadFile(content: string, filename: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Release object URL after short delay (Safari needs the element in DOM briefly)
  setTimeout(() => URL.revokeObjectURL(url), 100)
}

// ── Toast helpers ─────────────────────────────────────────────────────────────

function showToast(message: string) {
  toastMessage.value = message
  toastVisible.value = true
  toastTimer = setTimeout(() => {
    toastVisible.value = false
  }, 8000)
}

function clearTimers() {
  if (successTimer) clearTimeout(successTimer)
  if (toastTimer)   clearTimeout(toastTimer)
  successTimer = null
  toastTimer   = null
}

onUnmounted(clearTimers)
</script>

<style scoped>
/* ── Wrapper ──────────────────────────────────────────────────────────────── */
.download-btn-wrapper {
  position: relative;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

/* ── Button base ──────────────────────────────────────────────────────────── */
.download-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  width: 100%;
  padding: 10px 18px;
  border: none;
  border-radius: 8px;
  font-family: inherit;
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition:
    background-color 150ms ease,
    opacity          150ms ease,
    transform        150ms ease;
  white-space: nowrap;
  outline: none;
}

.download-btn:focus-visible {
  box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.45);
}

/* ── States ───────────────────────────────────────────────────────────────── */

/* idle */
.download-btn--idle {
  background: var(--color-primary, #1D1D1F);
  color: #fff;
}
.download-btn--idle:hover:not(.download-btn--disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}
.download-btn--idle:active:not(.download-btn--disabled) {
  transform: translateY(0);
  opacity: 1;
}

/* loading */
.download-btn--loading {
  background: var(--color-primary, #1D1D1F);
  color: rgba(255, 255, 255, 0.7);
  cursor: not-allowed;
}

/* success */
.download-btn--success {
  background: #16a34a;   /* green-600 */
  color: #fff;
}

/* error */
.download-btn--error {
  background: #dc2626;   /* red-600 */
  color: #fff;
}
.download-btn--error:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}

/* disabled */
.download-btn--disabled {
  opacity: 0.38;
  cursor: not-allowed;
  transform: none !important;
}

/* ── Icon ─────────────────────────────────────────────────────────────────── */
.download-btn-icon {
  display: flex;
  align-items: center;
  flex-shrink: 0;
}

.download-btn-spinner {
  animation: spin 0.75s linear infinite;
  transform-origin: center;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Label ────────────────────────────────────────────────────────────────── */
.download-btn-label {
  line-height: 1;
}

/* ── Compatibility hint ───────────────────────────────────────────────────── */
.download-btn-hint {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
  font-size: 11px;
  color: var(--color-text-muted, #6B7280);
  margin: 0;
  line-height: 1;
  flex-wrap: wrap;
}

.download-btn-hint-dot {
  display: inline-block;
  width: 4px;
  height: 4px;
  border-radius: 50%;
  background: var(--color-accent, #3B82F6);
  flex-shrink: 0;
}

.download-btn-hint-sep {
  opacity: 0.4;
}

/* ── Error Toast ──────────────────────────────────────────────────────────── */
.download-btn-toast {
  position: absolute;
  bottom: calc(100% + 8px);
  left: 0;
  right: 0;
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 10px 12px;
  background: #1f2937;    /* gray-800 */
  color: #fff;
  border-radius: 8px;
  font-size: 12px;
  line-height: 1.5;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.2);
  z-index: 200;
}

.download-btn-toast svg {
  flex-shrink: 0;
  margin-top: 1px;
  color: #fbbf24; /* amber-400 */
}

.download-btn-toast span {
  flex: 1;
}

.download-btn-toast-close {
  background: none;
  border: none;
  padding: 2px;
  cursor: pointer;
  color: rgba(255, 255, 255, 0.5);
  flex-shrink: 0;
  display: flex;
  align-items: center;
  margin-top: 1px;
  transition: color 150ms ease;
}

.download-btn-toast-close:hover {
  color: #fff;
}

/* ── Toast transition ─────────────────────────────────────────────────────── */
.toast-enter-active,
.toast-leave-active {
  transition: opacity 180ms ease, transform 180ms ease;
}
.toast-enter-from,
.toast-leave-to {
  opacity: 0;
  transform: translateY(6px);
}
</style>