<template>
  <div class="demo-preview">
    <!-- Toolbar -->
    <div class="demo-preview-toolbar">
      <div class="demo-preview-info">
        <span v-if="style && product" class="demo-preview-title">
          {{ style }} × {{ product }}
        </span>
        <span v-else class="demo-preview-title demo-preview-title--empty">
          Select a style and product type
        </span>
        <span
          v-if="source"
          class="demo-preview-badge"
          :class="`demo-preview-badge--${source}`"
        >{{ source }}</span>
      </div>

      <div class="demo-preview-controls">
        <!-- Desktop toggle -->
        <button
          class="demo-preview-toggle"
          :class="{ 'demo-preview-toggle--active': viewMode === 'desktop' }"
          title="Desktop preview"
          aria-label="Switch to desktop preview"
          @click="viewMode = 'desktop'"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="1" y="2" width="14" height="9" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
            <path d="M5 13h6M8 11v2" stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
          </svg>
        </button>
        <!-- Mobile toggle -->
        <button
          class="demo-preview-toggle"
          :class="{ 'demo-preview-toggle--active': viewMode === 'mobile' }"
          title="Mobile preview"
          aria-label="Switch to mobile preview"
          @click="viewMode = 'mobile'"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <rect x="4" y="1" width="8" height="14" rx="1.5" stroke="currentColor" stroke-width="1.4"/>
            <circle cx="8" cy="12.5" r="0.8" fill="currentColor"/>
          </svg>
        </button>

        <!-- Code toggle -->
        <button
          v-if="sourceCode"
          class="demo-preview-toggle"
          :class="{ 'demo-preview-toggle--active': viewMode === 'code' }"
          title="View source code"
          aria-label="Switch to source code view"
          @click="viewMode = 'code'"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
            <path d="M5 4L1 8l4 4M11 4l4 4-4 4" stroke="currentColor" stroke-width="1.4"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </button>

        <!-- Open in new tab -->
        <a
          v-if="demoUrl"
          :href="demoUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="demo-preview-external"
          title="Open in new tab"
          aria-label="Open demo in new tab"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
            <path d="M6 2H2a1 1 0 00-1 1v9a1 1 0 001 1h9a1 1 0 001-1V8"
                  stroke="currentColor" stroke-width="1.4" stroke-linecap="round"/>
            <path d="M9 1h4m0 0v4m0-4L7 7" stroke="currentColor" stroke-width="1.4"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
        </a>
      </div>
    </div>

    <!-- Preview stage -->
    <div
      class="demo-preview-stage"
      :class="`demo-preview-stage--${viewMode}`"
    >
      <!-- Mobile phone frame -->
      <Transition name="mode-fade">
        <div
          v-if="viewMode === 'mobile'"
          key="mobile-frame"
          class="demo-preview-phone-wrapper"
        >
          <div class="demo-preview-phone-frame">
            <div class="demo-preview-phone-notch" />
            <div class="demo-preview-phone-screen">
              <Transition name="iframe-fade" mode="out-in">
                <iframe
                  v-if="demoUrl"
                  :key="demoUrl"
                  :src="demoUrl"
                  class="demo-preview-iframe demo-preview-iframe--mobile"
                  sandbox="allow-scripts allow-same-origin"
                  title="Demo preview"
                  @load="onLoad"
                />
                <div v-else class="demo-preview-placeholder" />
              </Transition>

              <!-- Mobile loading overlay (inside screen) -->
              <Transition name="fade">
                <div v-if="loading && demoUrl" class="demo-preview-loading demo-preview-loading--mobile">
                  <div class="demo-preview-spinner" />
                </div>
              </Transition>
            </div>
            <div class="demo-preview-phone-home" />
          </div>
        </div>
      </Transition>

      <!-- Desktop full-width iframe -->
      <Transition name="mode-fade">
        <div
          v-if="viewMode === 'desktop'"
          key="desktop-frame"
          class="demo-preview-desktop-frame"
        >
          <Transition name="iframe-fade" mode="out-in">
            <iframe
              v-if="demoUrl"
              :key="demoUrl"
              :src="demoUrl"
              class="demo-preview-iframe demo-preview-iframe--desktop"
              sandbox="allow-scripts allow-same-origin"
              title="Demo preview"
              @load="onLoad"
            />
            <div v-else class="demo-preview-placeholder">
              <div class="demo-preview-placeholder-inner">
                <svg width="40" height="40" viewBox="0 0 40 40" fill="none" aria-hidden="true">
                  <rect x="4" y="6" width="32" height="22" rx="3"
                        stroke="currentColor" stroke-width="1.5" opacity="0.3"/>
                  <path d="M13 31h14M20 28v3" stroke="currentColor" stroke-width="1.5"
                        stroke-linecap="round" opacity="0.3"/>
                </svg>
                <p class="demo-preview-placeholder-text">
                  Select a style and product type<br>to preview the demo
                </p>
              </div>
            </div>
          </Transition>

          <!-- Loading overlay -->
          <Transition name="fade">
            <div v-if="loading && demoUrl" class="demo-preview-loading">
              <div class="demo-preview-spinner" />
            </div>
          </Transition>
        </div>
      </Transition>

      <!-- Code panel -->
      <Transition name="mode-fade">
        <div
          v-if="viewMode === 'code'"
          key="code-frame"
          class="demo-preview-code-frame"
        >
          <pre class="demo-preview-code-pre"><code class="hljs" v-html="highlightedCode" /></pre>
          <button class="demo-preview-code-copy" @click="copySource">
            {{ sourceCopied ? 'Copied!' : 'Copy' }}
          </button>
        </div>
      </Transition>
    </div>
  </div>
</template>

<script setup lang="ts">
import hljs from 'highlight.js/lib/core'
import xml from 'highlight.js/lib/languages/xml'
import 'highlight.js/styles/github.css'
hljs.registerLanguage('xml', xml)

export type ViewMode = 'desktop' | 'mobile' | 'code'

const props = withDefaults(defineProps<{
  demoUrl: string | null
  style?: string
  product?: string
  source?: 'official' | 'community' | null
  sourceCode?: string
  initialMode?: ViewMode
}>(), {
  demoUrl: null,
  style: '',
  product: '',
  source: null,
  sourceCode: '',
  initialMode: 'desktop',
})

const emit = defineEmits<{
  modeChange: [mode: ViewMode]
}>()

const viewMode = ref<ViewMode>(props.initialMode)
const loading = ref(false)
const sourceCopied = ref(false)

const highlightedCode = computed(() => {
  if (!props.sourceCode) return ''
  return hljs.highlight(props.sourceCode, { language: 'xml' }).value
})

watch(() => props.demoUrl, (newUrl) => {
  if (newUrl) loading.value = true
})

watch(viewMode, (mode) => {
  emit('modeChange', mode)
})

function onLoad() {
  loading.value = false
}

async function copySource() {
  try {
    await navigator.clipboard.writeText(props.sourceCode || '')
    sourceCopied.value = true
    setTimeout(() => { sourceCopied.value = false }, 2000)
  } catch {
    // noop
  }
}
</script>

<style scoped>
/* ── Wrapper ──────────────────────────────────────────────────────────────── */
.demo-preview {
  display: flex;
  flex-direction: column;
  gap: 0;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 12px;
  overflow: hidden;
}

/* ── Toolbar ──────────────────────────────────────────────────────────────── */
.demo-preview-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid var(--color-border, #E5E7EB);
  background: var(--color-bg, #F8F9FA);
  gap: 12px;
  min-height: 44px;
}

.demo-preview-info {
  display: flex;
  align-items: center;
  gap: 8px;
  min-width: 0;
  flex: 1;
}

.demo-preview-title {
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text, #111827);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.demo-preview-title--empty {
  color: var(--color-text-muted, #6B7280);
  font-weight: 400;
}

.demo-preview-badge {
  font-size: 10px;
  font-weight: 600;
  letter-spacing: 0.05em;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: 9999px;
  flex-shrink: 0;
}

.demo-preview-badge--official {
  background: #DBEAFE;
  color: #1E40AF;
}

.demo-preview-badge--community {
  background: #D1FAE5;
  color: #065F46;
}

.demo-preview-controls {
  display: flex;
  align-items: center;
  gap: 2px;
  flex-shrink: 0;
}

.demo-preview-toggle {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: none;
  border-radius: 6px;
  background: transparent;
  cursor: pointer;
  color: var(--color-text-muted, #6B7280);
  transition: background-color 150ms ease, color 150ms ease;
}

.demo-preview-toggle:hover {
  background: var(--color-border, #E5E7EB);
  color: var(--color-text, #111827);
}

.demo-preview-toggle--active {
  background: var(--color-primary, #1D1D1F);
  color: #fff;
}

.demo-preview-toggle--active:hover {
  background: var(--color-primary, #1D1D1F);
  color: #fff;
  opacity: 0.88;
}

.demo-preview-external {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border-radius: 6px;
  color: var(--color-text-muted, #6B7280);
  text-decoration: none;
  transition: background-color 150ms ease, color 150ms ease;
  margin-left: 4px;
}

.demo-preview-external:hover {
  background: var(--color-border, #E5E7EB);
  color: var(--color-text, #111827);
}

/* ── Stage ────────────────────────────────────────────────────────────────── */
.demo-preview-stage {
  position: relative;
  display: flex;
  align-items: flex-start;
  justify-content: center;
  background: var(--color-bg, #F8F9FA);
  overflow: hidden;
}

/* Desktop stage: full-width, 600px tall */
.demo-preview-stage--desktop {
  min-height: 600px;
}

/* Mobile stage: centred phone, 740px tall */
.demo-preview-stage--mobile {
  min-height: 740px;
  padding: 24px 0 32px;
}

/* Wrapper keeps phone centred during mode-fade (position:absolute on transition) */
.demo-preview-phone-wrapper {
  display: flex;
  align-items: flex-start;
  justify-content: center;
  width: 100%;
  padding: 24px 0 32px;
}

/* ── Desktop frame ────────────────────────────────────────────────────────── */
.demo-preview-desktop-frame {
  position: relative;
  width: 100%;
  height: 600px;
}

.demo-preview-iframe--desktop {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

/* ── Mobile phone frame ───────────────────────────────────────────────────── */
.demo-preview-phone-frame {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 393px;          /* iPhone 14 Pro width */
  background: #1D1D1F;
  border-radius: 48px;
  padding: 12px 8px 10px;
  box-shadow:
    0 0 0 1px rgba(255,255,255,0.08),
    0 24px 60px rgba(0,0,0,0.3);
  gap: 0;
}

.demo-preview-phone-notch {
  width: 120px;
  height: 34px;
  background: #1D1D1F;
  border-radius: 0 0 20px 20px;
  margin-bottom: 4px;
  flex-shrink: 0;
  position: relative;
  z-index: 1;
}

.demo-preview-phone-screen {
  width: 100%;
  flex: 1;
  overflow: hidden;
  border-radius: 40px;
  background: #fff;
  position: relative;
}

.demo-preview-iframe--mobile {
  width: 375px;
  height: 700px;
  border: none;
  display: block;
  transform-origin: top left;
}

.demo-preview-phone-home {
  width: 120px;
  height: 5px;
  background: rgba(255,255,255,0.3);
  border-radius: 9999px;
  margin-top: 10px;
  flex-shrink: 0;
}

/* ── Placeholder ──────────────────────────────────────────────────────────── */
.demo-preview-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-bg, #F8F9FA);
}

.demo-preview-placeholder-inner {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 12px;
  color: var(--color-text-muted, #6B7280);
}

.demo-preview-placeholder-text {
  font-size: 13px;
  text-align: center;
  line-height: 1.6;
  margin: 0;
}

/* ── Loading overlay ──────────────────────────────────────────────────────── */
.demo-preview-loading {
  position: absolute;
  inset: 0;
  background: rgba(248, 249, 250, 0.7);
  backdrop-filter: blur(2px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
}

/* Mobile loading sits inside the phone screen (already clipped by border-radius) */
.demo-preview-loading--mobile {
  border-radius: 40px;
}

.demo-preview-spinner {
  width: 28px;
  height: 28px;
  border: 2.5px solid var(--color-border, #E5E7EB);
  border-top-color: var(--color-primary, #1D1D1F);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* ── Code panel ──────────────────────────────────────────────────── */
.demo-preview-code-frame {
  position: relative;
  width: 100%;
  max-height: 600px;
  overflow: auto;
  background: #F8F9FA;
}

.demo-preview-code-pre {
  margin: 0;
  padding: 20px;
  font-size: 12px;
  line-height: 1.6;
  tab-size: 2;
  overflow: auto;
}

.demo-preview-code-pre code {
  font-family: var(--font-mono, 'SF Mono', 'Fira Code', monospace);
}

.demo-preview-code-copy {
  position: absolute;
  top: 10px;
  right: 10px;
  padding: 4px 10px;
  font-size: 11px;
  font-weight: 500;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 6px;
  background: var(--color-surface, #fff);
  color: var(--color-text-muted, #6B7280);
  cursor: pointer;
  font-family: inherit;
  opacity: 0;
  transition: opacity 150ms ease;
}

.demo-preview-code-frame:hover .demo-preview-code-copy {
  opacity: 1;
}

.demo-preview-code-copy:hover {
  color: var(--color-text, #111827);
  border-color: var(--color-text-muted, #6B7280);
}

/* ── Transitions ──────────────────────────────────────────────────────────── */
.iframe-fade-enter-active,
.iframe-fade-leave-active {
  transition: opacity 200ms ease;
}
.iframe-fade-enter-from,
.iframe-fade-leave-to {
  opacity: 0;
}

.mode-fade-enter-active,
.mode-fade-leave-active {
  transition: opacity 180ms ease;
  position: absolute;
  inset: 0;
  display: flex;
  align-items: flex-start;
  justify-content: center;
}
.mode-fade-enter-from,
.mode-fade-leave-to {
  opacity: 0;
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 150ms ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>