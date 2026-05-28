<template>
  <div class="code-editor">
    <!-- Toolbar -->
    <div class="code-editor-toolbar">
      <span class="code-editor-lang">HTML</span>
      <div class="code-editor-actions">
        <button
          class="code-editor-btn"
          :class="{ 'code-editor-btn--done': copied }"
          :aria-label="copied ? 'Copied!' : 'Copy source code'"
          @click="copyCode"
        >
          <svg v-if="!copied" width="13" height="13" viewBox="0 0 14 14" fill="none"
               aria-hidden="true">
            <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor"
                  stroke-width="1.3"/>
            <path d="M9 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5a1 1 0 001 1h2"
                  stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
          </svg>
          <svg v-else width="13" height="13" viewBox="0 0 13 13" fill="none"
               aria-hidden="true">
            <path d="M2 6.5l3 3 6-6" stroke="currentColor" stroke-width="1.5"
                  stroke-linecap="round" stroke-linejoin="round"/>
          </svg>
          {{ copied ? 'Copied!' : 'Copy' }}
        </button>
      </div>
    </div>

    <!-- Monaco mount point -->
    <div ref="editorMount" class="code-editor-mount" />

    <!-- Fallback textarea (used if Monaco fails to load) -->
    <textarea
      v-if="useFallback"
      :value="modelValue"
      class="code-editor-fallback"
      spellcheck="false"
      autocomplete="off"
      autocorrect="off"
      autocapitalize="off"
      aria-label="HTML source code editor"
      @input="$emit('update:modelValue', ($event.target as HTMLTextAreaElement).value)"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{
  modelValue: string
  language?: string
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
}>()

const editorMount = ref<HTMLElement | null>(null)
const copied      = ref(false)
const useFallback = ref(false)

// ── Monaco editor setup ───────────────────────────────────────────────────────
let monacoEditor: { getValue(): string; setValue(v: string): void;
                    dispose(): void; onDidChangeModelContent(fn: () => void): void } | null = null

onMounted(async () => {
  try {
    // Dynamically import Monaco to avoid SSR issues
    const monaco = await import('monaco-editor').catch(() => null)

    if (!monaco || !editorMount.value) {
      useFallback.value = true
      return
    }

    monacoEditor = monaco.editor.create(editorMount.value, {
      value:              props.modelValue,
      language:           props.language ?? 'html',
      theme:              'vs-dark',
      fontSize:           13,
      lineHeight:         20,
      fontFamily:         "'Fira Code', 'SF Mono', Menlo, monospace",
      fontLigatures:      true,
      minimap:            { enabled: false },
      scrollBeyondLastLine: false,
      wordWrap:           'on',
      lineNumbers:        'on',
      renderLineHighlight:'line',
      automaticLayout:    true,
      tabSize:            2,
      insertSpaces:       true,
      scrollbar: {
        verticalScrollbarSize:   6,
        horizontalScrollbarSize: 6,
      },
    })

    // Emit changes upward
    monacoEditor.onDidChangeModelContent(() => {
      const val = monacoEditor!.getValue()
      emit('update:modelValue', val)
      emit('change', val)
    })

  } catch {
    useFallback.value = true
  }
})

// Keep Monaco in sync if parent updates modelValue externally
watch(() => props.modelValue, (newVal) => {
  if (monacoEditor && monacoEditor.getValue() !== newVal) {
    monacoEditor.setValue(newVal)
  }
})

onUnmounted(() => {
  monacoEditor?.dispose()
})

// ── Copy ──────────────────────────────────────────────────────────────────────
async function copyCode() {
  const text = monacoEditor ? monacoEditor.getValue() : props.modelValue
  try {
    await navigator.clipboard.writeText(text)
  } catch {
    // Fallback
    const ta = document.createElement('textarea')
    ta.value = text
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
  }
  copied.value = true
  setTimeout(() => { copied.value = false }, 2000)
}
</script>

<style scoped>
.code-editor {
  display: flex;
  flex-direction: column;
  height: 100%;
  background: #1e1e1e;   /* Monaco dark bg */
  border-radius: 10px;
  overflow: hidden;
}

/* Toolbar */
.code-editor-toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: #1D1D1F;
  border-bottom: 1px solid rgba(255,255,255,0.07);
  flex-shrink: 0;
}

.code-editor-lang {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: rgba(255,255,255,0.35);
  font-family: var(--font-mono, monospace);
}

.code-editor-actions { display: flex; gap: 6px; }

.code-editor-btn {
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 4px 10px;
  border: 1px solid rgba(255,255,255,0.12);
  border-radius: 6px;
  background: rgba(255,255,255,0.06);
  color: rgba(255,255,255,0.6);
  font-size: 12px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: background 150ms ease, color 150ms ease, border-color 150ms ease;
}

.code-editor-btn:hover { background: rgba(255,255,255,0.1); color: #fff; }

.code-editor-btn--done {
  border-color: rgba(74, 222, 128, 0.4);
  color: #4ADE80;
  background: rgba(74, 222, 128, 0.08);
}

/* Monaco mount */
.code-editor-mount {
  flex: 1;
  min-height: 0;
  /* Monaco sets its own overflow */
}

/* Fallback textarea */
.code-editor-fallback {
  flex: 1;
  padding: 16px;
  background: #1e1e1e;
  color: #D4D4D4;
  font-family: 'Fira Code', 'SF Mono', Menlo, monospace;
  font-size: 13px;
  line-height: 1.7;
  border: none;
  outline: none;
  resize: none;
  tab-size: 2;
}
</style>