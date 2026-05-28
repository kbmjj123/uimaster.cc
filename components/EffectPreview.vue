<template>
  <div class="effect-preview">
    <!-- Loading overlay -->
    <Transition name="fade">
      <div v-if="loading" class="effect-preview-loading">
        <div class="effect-preview-spinner" />
      </div>
    </Transition>

    <iframe
      ref="iframeEl"
      class="effect-preview-iframe"
      sandbox="allow-scripts"
      title="Effect preview"
      @load="loading = false"
    />
  </div>
</template>

<script setup lang="ts">
const props = defineProps<{ sourceCode: string }>()

const iframeEl = ref<HTMLIFrameElement | null>(null)
const loading  = ref(true)

// Update srcdoc whenever source changes (debounced 120ms for editor typing)
let updateTimer: ReturnType<typeof setTimeout> | null = null

watch(() => props.sourceCode, (code) => {
  if (updateTimer) clearTimeout(updateTimer)
  loading.value = true
  updateTimer = setTimeout(() => {
    if (iframeEl.value) {
      iframeEl.value.srcdoc = code
    }
  }, 120)
}, { immediate: true })

onUnmounted(() => {
  if (updateTimer) clearTimeout(updateTimer)
})
</script>

<style scoped>
.effect-preview {
  position: relative;
  width: 100%;
  height: 100%;
  background: var(--color-bg, #F8F9FA);
  border-radius: 10px;
  overflow: hidden;
}

.effect-preview-iframe {
  width: 100%;
  height: 100%;
  border: none;
  display: block;
}

.effect-preview-loading {
  position: absolute;
  inset: 0;
  background: rgba(248, 249, 250, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 5;
}

.effect-preview-spinner {
  width: 26px;
  height: 26px;
  border: 2.5px solid var(--color-border, #E5E7EB);
  border-top-color: var(--color-primary, #1D1D1F);
  border-radius: 50%;
  animation: spin 0.7s linear infinite;
}

@keyframes spin { to { transform: rotate(360deg); } }

.fade-enter-active, .fade-leave-active { transition: opacity 150ms ease; }
.fade-enter-from, .fade-leave-to { opacity: 0; }
</style>