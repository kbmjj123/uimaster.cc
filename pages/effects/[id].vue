<template>
  <div class="effect-detail">

    <!-- ── Breadcrumb ──────────────────────────────────────────────────────── -->
    <nav class="effect-breadcrumb" aria-label="Breadcrumb">
      <ol class="effect-breadcrumb-list">
        <li><NuxtLink to="/effects">Effects Gallery</NuxtLink></li>
        <li aria-hidden="true">›</li>
        <li><NuxtLink :to="`/effects/category/${effect.category}`">{{ effect.category }}</NuxtLink></li>
        <li aria-hidden="true">›</li>
        <li aria-current="page">{{ effect.title }}</li>
      </ol>
    </nav>

    <!-- ── H1 + meta ───────────────────────────────────────────────────────── -->
    <div class="effect-header">
      <h1 class="effect-h1">{{ effect.title }}</h1>
      <div class="effect-header-tags">
        <NuxtLink :to="`/effects/category/${effect.category}`" class="effect-tag effect-tag--category">
          {{ effect.category }}
        </NuxtLink>
        <template v-if="parsedTags.length">
          <span v-for="tag in parsedTags" :key="tag" class="effect-tag">{{ tag }}</span>
        </template>
        <span v-if="effect.is_featured" class="effect-tag effect-tag--featured">★ Featured</span>
      </div>

      <!-- AI description (SEO text — visible to crawlers) -->
      <p v-if="effect.description" class="effect-description">{{ effect.description }}</p>

      <!-- Scene / usage -->
      <p v-if="effect.scene" class="effect-scene">
        <strong>Use case:</strong> {{ effect.scene }}
      </p>
    </div>

    <!-- ── Main editor / preview split ───────────────────────────────────── -->
    <div class="effect-workspace">

      <!-- Left: iframe preview (50%) -->
      <div class="effect-workspace-preview">
        <div class="effect-workspace-label">
          <span>Live Preview</span>
          <button class="effect-open-new" title="Open in new tab" @click="openInNewTab">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
              <path d="M5 2H2a1 1 0 00-1 1v7a1 1 0 001 1h7a1 1 0 001-1V7"
                    stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
              <path d="M8 1h3m0 0v3m0-3L5.5 6.5" stroke="currentColor" stroke-width="1.3"
                    stroke-linecap="round" stroke-linejoin="round"/>
            </svg>
          </button>
        </div>
        <EffectPreview :source-code="editorCode" />
      </div>

      <!-- Right: code editor (50%) -->
      <div class="effect-workspace-editor">
        <div class="effect-workspace-label">
          <span>HTML Source</span>
          <span class="effect-char-count">{{ editorCode.length.toLocaleString() }} chars</span>
        </div>
        <CodeEditor
          v-model="editorCode"
          language="html"
          @change="onCodeChange"
        />
      </div>
    </div>

    <!-- ── Editor actions ─────────────────────────────────────────────────── -->
    <div class="effect-actions">
      <!-- Reset to original -->
      <button
        class="effect-action-btn effect-action-btn--ghost"
        :disabled="editorCode === originalCode"
        @click="resetCode"
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="none" aria-hidden="true">
          <path d="M1.5 6.5A5 5 0 1 1 3 10" stroke="currentColor" stroke-width="1.4"
                stroke-linecap="round"/>
          <path d="M1.5 3.5v3h3" stroke="currentColor" stroke-width="1.4"
                stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
        Reset
      </button>

      <!-- Download HTML (T12 will wrap this with unlock gate) -->
      <button
        class="effect-action-btn effect-action-btn--primary"
        :class="{ 'effect-action-btn--loading': downloading }"
        :disabled="downloading"
        @click="downloadHtml"
      >
        <svg v-if="!downloading" width="14" height="14" viewBox="0 0 14 14" fill="none"
             aria-hidden="true">
          <path d="M7 1v8m0 0L4 6m3 3l3-3M2 11v.5A1.5 1.5 0 003.5 13h7A1.5 1.5 0 0012 11.5V11"
                stroke="currentColor" stroke-width="1.4" stroke-linecap="round"
                stroke-linejoin="round"/>
        </svg>
        <svg v-else class="effect-spinner" width="14" height="14" viewBox="0 0 14 14"
             fill="none" aria-hidden="true">
          <circle cx="7" cy="7" r="5.5" stroke="currentColor" stroke-width="1.6"
                  stroke-linecap="round" stroke-dasharray="24" stroke-dashoffset="8"/>
        </svg>
        {{ downloading ? 'Preparing…' : 'Download HTML' }}
      </button>

      <!-- Stats -->
      <div class="effect-stats">
        <span class="effect-stat">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M1 6s2-4 5-4 5 4 5 4-2 4-5 4-5-4-5-4z"
                  stroke="currentColor" stroke-width="1.2"/>
            <circle cx="6" cy="6" r="1.5" stroke="currentColor" stroke-width="1.2"/>
          </svg>
          {{ effect.view_count?.toLocaleString() ?? 0 }} views
        </span>
        <span class="effect-stat">
          <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
            <path d="M6 1v7m0 0L3 5m3 3l3-3M1 10h10" stroke="currentColor"
                  stroke-width="1.2" stroke-linecap="round"/>
          </svg>
          {{ effect.export_count?.toLocaleString() ?? 0 }} downloads
        </span>
      </div>
    </div>

    <!-- ── Source code (hidden, for SEO crawlers) ─────────────────────────── -->
    <!-- SEO spec: "完整 HTML 源码（爬虫可抓取）" -->
    <details class="effect-source-seo">
      <summary class="effect-source-summary">View full HTML source</summary>
      <pre class="effect-source-pre"><code>{{ originalCode }}</code></pre>
    </details>

    <!-- ── Ad below editor ────────────────────────────────────────────────── -->
    <div class="effect-ad-row">
      <AdSlot size="728x90" position="ad-mid-content" />
    </div>

    <!-- ── Related effects ────────────────────────────────────────────────── -->
    <section v-if="related.length" class="effect-section" aria-labelledby="related-heading">
      <h2 id="related-heading" class="effect-h2">Related Effects</h2>
      <div class="effect-related-grid">
        <EffectCard
          v-for="rel in related"
          :key="rel.id"
          :effect="rel"
        />
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
// ── Route ─────────────────────────────────────────────────────────────────────
const route = useRoute()
const id    = computed(() => route.params.id as string)

// ── Types ─────────────────────────────────────────────────────────────────────
interface Effect {
  id: string
  title: string
  description: string
  category: string
  scene: string
  tags: string           // JSON array string
  source_url: string
  cover_url: string
  cover_static_url: string
  og_image_url: string
  is_featured: number
  view_count: number
  export_count: number
}

// ── SSR data fetch ────────────────────────────────────────────────────────────
const { data: pageData } = await useAsyncData(`effect-${id.value}`, async () => {
  const [effectRes, relatedRes] = await Promise.all([
    $fetch<Effect>(`/api/effects/${id.value}`),
    $fetch<{ effects: Effect[] }>('/api/effects', {
      params: { limit: 6, page: 1 },
    }),
  ])

  // Fetch source HTML from R2
  let sourceCode = ''
  try {
    if (effectRes.source_url) {
      sourceCode = await $fetch<string>(effectRes.source_url)
    }
  } catch {
    sourceCode = '<!-- Source not available -->'
  }

  // Filter out self from related, get same category first
  const related = (relatedRes.effects ?? [])
    .filter(e => e.id !== id.value)
    .slice(0, 6)

  return { effect: effectRes, sourceCode, related }
})

const effect      = computed(() => pageData.value?.effect ?? {} as Effect)
const originalCode = ref(pageData.value?.sourceCode ?? '')
const editorCode  = ref(pageData.value?.sourceCode ?? '')
const related     = computed(() => pageData.value?.related ?? [])

const parsedTags = computed(() => {
  try {
    return JSON.parse(effect.value.tags || '[]') as string[]
  } catch {
    return (effect.value.tags || '').split(',').map((t: string) => t.trim()).filter(Boolean)
  }
})

// ── Editor sync ───────────────────────────────────────────────────────────────
function onCodeChange(val: string) {
  editorCode.value = val
}

function resetCode() {
  editorCode.value = originalCode.value
}

// ── Download (plain, T12 will add unlock gate around this) ───────────────────
const downloading = ref(false)

async function downloadHtml() {
  if (downloading.value) return
  downloading.value = true

  try {
    // Count export
    await $fetch(`/api/effects/${id.value}/export`, { method: 'POST' }).catch(() => {})

    const blob = new Blob([editorCode.value], { type: 'text/html;charset=utf-8' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `${id.value}.html`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setTimeout(() => URL.revokeObjectURL(url), 100)
  } finally {
    downloading.value = false
  }
}

// ── Open preview in new tab ───────────────────────────────────────────────────
function openInNewTab() {
  const blob = new Blob([editorCode.value], { type: 'text/html' })
  const url  = URL.createObjectURL(blob)
  window.open(url, '_blank', 'noopener')
  setTimeout(() => URL.revokeObjectURL(url), 5000)
}

// ── Track view count ──────────────────────────────────────────────────────────
onMounted(() => {
  $fetch(`/api/effects/${id.value}/view`, { method: 'POST' }).catch(() => {})
})

// ── SEO ───────────────────────────────────────────────────────────────────────
const metaTitle   = computed(() => `${effect.value.title} — HTML Effect | uimaster.cc`)
const metaDesc    = computed(() => effect.value.description ||
  `${effect.value.title} HTML effect. Live preview, edit in-browser, free download. Category: ${effect.value.category}.`)
const metaKeywords = computed(() => {
  const tags = parsedTags.value.join(', ')
  return `${tags}, HTML effect, CSS animation, free download, ${effect.value.category}`
})
const canonicalUrl = computed(() => `https://uimaster.cc/effects/${id.value}`)
const ogImage      = computed(() => effect.value.og_image_url || 'https://uimaster.cc/og-default.png')

useHead({
  title: metaTitle.value,
  meta: [
    { name: 'description',         content: metaDesc.value },
    { name: 'keywords',            content: metaKeywords.value },
    { property: 'og:type',         content: 'website' },
    { property: 'og:title',        content: metaTitle.value },
    { property: 'og:description',  content: metaDesc.value },
    { property: 'og:image',        content: ogImage.value },
    { property: 'og:image:width',  content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:url',          content: canonicalUrl.value },
    { name: 'twitter:card',        content: 'summary_large_image' },
    { name: 'twitter:title',       content: metaTitle.value },
    { name: 'twitter:description', content: metaDesc.value },
    { name: 'twitter:image',       content: ogImage.value },
  ],
  link: [{ rel: 'canonical', href: canonicalUrl.value }],
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'SoftwareSourceCode',
      name: effect.value.title,
      description: metaDesc.value,
      image: ogImage.value,
      programmingLanguage: 'HTML',
      keywords: metaKeywords.value,
      url: canonicalUrl.value,
      codeRepository: 'https://github.com/uimaster-cc/uimaster',
    }),
  }],
})
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */
.effect-detail {
  max-width: 1280px;
  margin: 0 auto;
  padding: 24px 24px 80px;
  display: flex;
  flex-direction: column;
  gap: 0;
}

/* ── Breadcrumb ───────────────────────────────────────────────────────────── */
.effect-breadcrumb { margin-bottom: 20px; }
.effect-breadcrumb-list {
  display: flex; align-items: center; gap: 6px;
  list-style: none; margin: 0; padding: 0;
  font-size: 13px; color: var(--color-text-muted, #6B7280);
}
.effect-breadcrumb-list a { color: var(--color-text-muted); text-decoration: none; }
.effect-breadcrumb-list a:hover { color: var(--color-text, #111827); text-decoration: underline; }

/* ── Header ───────────────────────────────────────────────────────────────── */
.effect-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 20px;
}

.effect-h1 {
  font-size: 26px;
  font-weight: 700;
  letter-spacing: -0.4px;
  color: var(--color-primary, #1D1D1F);
  margin: 0;
  line-height: 1.2;
}

.effect-header-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  align-items: center;
}

.effect-tag {
  font-size: 11px;
  padding: 2px 9px;
  border-radius: 9999px;
  background: var(--color-border, #E5E7EB);
  color: var(--color-text-muted, #6B7280);
  font-weight: 500;
  text-decoration: none;
}

.effect-tag--category {
  background: #DBEAFE;
  color: #1E40AF;
  cursor: pointer;
}

.effect-tag--category:hover { background: #BFDBFE; }

.effect-tag--featured {
  background: #FEF3C7;
  color: #92400E;
}

.effect-description {
  font-size: 14px;
  color: var(--color-text-muted, #6B7280);
  line-height: 1.7;
  margin: 0;
  max-width: 720px;
}

.effect-scene {
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  margin: 0;
}

.effect-scene strong { color: var(--color-text, #111827); }

/* ── Workspace ────────────────────────────────────────────────────────────── */
.effect-workspace {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
  height: 560px;
  margin-bottom: 16px;
}

.effect-workspace-preview,
.effect-workspace-editor {
  display: flex;
  flex-direction: column;
  gap: 6px;
  min-height: 0;
}

.effect-workspace-label {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted, #6B7280);
  padding: 0 2px;
}

.effect-open-new {
  background: none;
  border: none;
  cursor: pointer;
  color: var(--color-text-muted, #6B7280);
  display: flex;
  align-items: center;
  padding: 2px;
  border-radius: 4px;
  transition: color 150ms ease;
}

.effect-open-new:hover { color: var(--color-text, #111827); }

.effect-char-count {
  font-size: 10px;
  font-weight: 400;
  text-transform: none;
  letter-spacing: 0;
}

/* Both panels fill remaining height */
.effect-workspace-preview > :last-child,
.effect-workspace-editor > :last-child {
  flex: 1;
  min-height: 0;
}

/* ── Actions ──────────────────────────────────────────────────────────────── */
.effect-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  margin-bottom: 24px;
}

.effect-action-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 9px 18px;
  border-radius: 8px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  cursor: pointer;
  border: none;
  transition: opacity 150ms ease, transform 150ms ease, background 150ms ease;
  white-space: nowrap;
}

.effect-action-btn--primary {
  background: var(--color-primary, #1D1D1F);
  color: #fff;
}

.effect-action-btn--primary:hover:not(:disabled) {
  opacity: 0.88;
  transform: translateY(-1px);
}

.effect-action-btn--ghost {
  background: transparent;
  color: var(--color-text-muted, #6B7280);
  border: 1.5px solid var(--color-border, #E5E7EB);
}

.effect-action-btn--ghost:hover:not(:disabled) {
  color: var(--color-text, #111827);
  border-color: var(--color-text-muted, #6B7280);
}

.effect-action-btn:disabled { opacity: 0.38; cursor: not-allowed; }

.effect-action-btn--loading { opacity: 0.7; cursor: not-allowed; }

.effect-spinner {
  animation: spin 0.75s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.effect-stats {
  display: flex;
  align-items: center;
  gap: 14px;
  margin-left: auto;
}

.effect-stat {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-muted, #6B7280);
}

/* ── SEO source block ─────────────────────────────────────────────────────── */
.effect-source-seo {
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
  overflow: hidden;
  margin-bottom: 20px;
}

.effect-source-summary {
  padding: 10px 16px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted, #6B7280);
  cursor: pointer;
  background: var(--color-bg, #F8F9FA);
  user-select: none;
  list-style: none;
}

.effect-source-summary:hover { color: var(--color-text, #111827); }

.effect-source-pre {
  margin: 0;
  padding: 16px;
  background: #111827;
  color: #D4D4D4;
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  line-height: 1.65;
  overflow-x: auto;
  max-height: 360px;
  overflow-y: auto;
}

/* ── Ad row ───────────────────────────────────────────────────────────────── */
.effect-ad-row {
  display: flex;
  justify-content: center;
  margin: 8px 0 32px;
}

/* ── Section ──────────────────────────────────────────────────────────────── */
.effect-section { margin-bottom: 48px; }

.effect-h2 {
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--color-primary, #1D1D1F);
  margin: 0 0 20px;
}

/* ── Related grid ─────────────────────────────────────────────────────────── */
.effect-related-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
}

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .effect-detail { padding: 16px 16px 80px; }

  .effect-h1 { font-size: 20px; }

  /* Stack preview + editor vertically on mobile */
  .effect-workspace {
    grid-template-columns: 1fr;
    height: auto;
  }

  .effect-workspace-preview { height: 300px; }
  .effect-workspace-editor  { height: 360px; }

  .effect-workspace-preview > :last-child,
  .effect-workspace-editor > :last-child {
    flex: none;
    height: 100%;
  }

  .effect-stats { display: none; }

  .effect-related-grid { grid-template-columns: 1fr; }

  .effect-ad-row { display: none; }
}

@media (min-width: 768px) and (max-width: 1023px) {
  .effect-workspace { height: 460px; }
  .effect-related-grid { grid-template-columns: repeat(2, 1fr); }
}
</style>