<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="modelValue"
        class="unlock-overlay"
        role="dialog"
        aria-modal="true"
        aria-labelledby="unlock-title"
      >
        <div class="unlock-modal">

          <button class="unlock-close" aria-label="Close" @click="close">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 1l12 12M13 1L1 13" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"/>
            </svg>
          </button>

          <!-- Creating -->
          <div v-if="phase === 'creating'" class="unlock-phase">
            <div class="unlock-spinner-wrap"><div class="unlock-spinner" /></div>
            <p class="unlock-phase-text">Generating your share link…</p>
          </div>

          <!-- Share -->
          <template v-else-if="phase === 'share'">
            <div class="unlock-icon" aria-hidden="true">🔗</div>
            <h2 id="unlock-title" class="unlock-title">One share to unlock</h2>
            <p class="unlock-desc">
              You've used {{ count }} free downloads today.<br>
              Share this link — your download unlocks the moment someone visits it.
            </p>
            <div class="unlock-link-row">
              <input ref="linkInputEl" :value="shareUrl" class="unlock-link-input"
                     readonly aria-label="Share link" @click="selectLink">
              <button class="unlock-copy-btn" :class="{ 'unlock-copy-btn--done': linkCopied }"
                      @click="copyLink">
                <svg v-if="!linkCopied" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <rect x="5" y="5" width="8" height="8" rx="1.5" stroke="currentColor" stroke-width="1.3"/>
                  <path d="M9 5V3a1 1 0 00-1-1H3a1 1 0 00-1 1v5a1 1 0 001 1h2" stroke="currentColor" stroke-width="1.3" stroke-linecap="round"/>
                </svg>
                <svg v-else width="13" height="13" viewBox="0 0 13 13" fill="none">
                  <path d="M2 6.5l3 3 6-6" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>
                </svg>
                {{ linkCopied ? 'Copied!' : 'Copy' }}
              </button>
            </div>
            <div class="unlock-share-row">
              <a :href="twitterUrl" target="_blank" rel="noopener noreferrer"
                 class="unlock-share-btn unlock-share-btn--twitter">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
                Share on X
              </a>
            </div>
            <div class="unlock-waiting">
              <div class="unlock-waiting-dots"><span /><span /><span /></div>
              <p class="unlock-waiting-text">Waiting for someone to visit your link…</p>
            </div>
            <p class="unlock-hint">Link expires after 10 minutes of inactivity.</p>
          </template>

          <!-- Unlocked -->
          <div v-else-if="phase === 'unlocked'" class="unlock-phase unlock-phase--success">
            <div class="unlock-success-icon" aria-hidden="true">✓</div>
            <h2 id="unlock-title" class="unlock-title">Unlocked!</h2>
            <p class="unlock-desc">Someone visited your link. Your download is starting…</p>
            <div class="unlock-progress"><div class="unlock-progress-bar" /></div>
          </div>

          <!-- Timeout -->
          <div v-else-if="phase === 'timeout'" class="unlock-phase">
            <div class="unlock-icon" aria-hidden="true">⏱</div>
            <h2 id="unlock-title" class="unlock-title">Link expired</h2>
            <p class="unlock-desc">Nobody visited in time. Generate a new link to try again.</p>
            <button class="unlock-retry-btn" @click="retry">Generate new link</button>
          </div>

          <!-- Error -->
          <div v-else-if="phase === 'error'" class="unlock-phase">
            <div class="unlock-icon" aria-hidden="true">⚠️</div>
            <h2 id="unlock-title" class="unlock-title">Something went wrong</h2>
            <p class="unlock-desc">{{ errorMessage }}</p>
            <button class="unlock-retry-btn" @click="retry">Try again</button>
          </div>

        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { useExportLimit, startUnlockPolling } from '~/composables/useExportLimit'

const props = defineProps<{ modelValue: boolean; effectId: string }>()
const emit  = defineEmits<{
  'update:modelValue': [value: boolean]
  'unlocked': []
}>()

type Phase = 'creating' | 'share' | 'unlocked' | 'timeout' | 'error'

const phase        = ref<Phase>('creating')
const shareToken   = ref('')
const linkCopied   = ref(false)
const errorMessage = ref('')
const linkInputEl  = ref<HTMLInputElement | null>(null)

const { count, saveToken, clearToken, reset, restoreToken } = useExportLimit()

let stopPolling: (() => void) | null = null

const shareUrl = computed(() => {
  if (!shareToken.value) return ''
  const base = import.meta.client ? window.location.origin : 'https://uimaster.cc'
  return `${base}/api/share/visit/${shareToken.value}?ref=share`
})

const twitterUrl = computed(() =>
  `https://x.com/intent/tweet?text=${encodeURIComponent(`Check out this HTML effect 👀 ${shareUrl.value}`)}`
)

watch(() => props.modelValue, async (open) => {
  if (!open) { stopPolling?.(); return }
  const { token, effectId } = restoreToken()
  if (token && effectId === props.effectId) {
    shareToken.value = token
    phase.value = 'share'
    beginPolling(token)
    return
  }
  await createToken()
})

async function createToken() {
  phase.value = 'creating'
  errorMessage.value = ''
  try {
    const res = await $fetch<{ token: string }>('/api/share/create', {
      method: 'POST', body: { effect_id: props.effectId },
    })
    shareToken.value = res.token
    saveToken(res.token, props.effectId)
    phase.value = 'share'
    beginPolling(res.token)
  } catch (err: unknown) {
    phase.value = 'error'
    errorMessage.value = err instanceof Error ? err.message : 'Failed to create share link.'
  }
}

function beginPolling(token: string) {
  stopPolling?.()
  stopPolling = startUnlockPolling({
    token,
    onUnlocked: () => {
      phase.value = 'unlocked'
      setTimeout(() => { reset(); clearToken(); emit('unlocked'); close() }, 1800)
    },
    onTimeout: () => { phase.value = 'timeout' },
  })
}

async function copyLink() {
  try { await navigator.clipboard.writeText(shareUrl.value) }
  catch { linkInputEl.value?.select(); document.execCommand('copy') }
  linkCopied.value = true
  setTimeout(() => { linkCopied.value = false }, 2000)
}

function selectLink() { linkInputEl.value?.select() }

function retry() { stopPolling?.(); clearToken(); createToken() }

function close() {
  stopPolling?.()
  emit('update:modelValue', false)
  setTimeout(() => { phase.value = 'creating' }, 300)
}

onMounted(() => {
  const h = (e: KeyboardEvent) => { if (e.key === 'Escape' && props.modelValue) close() }
  document.addEventListener('keydown', h)
  onUnmounted(() => document.removeEventListener('keydown', h))
})
onUnmounted(() => stopPolling?.())
</script>

<style scoped>
.unlock-overlay {
  position: fixed; inset: 0;
  background: rgba(0,0,0,0.55);
  backdrop-filter: blur(4px);
  display: flex; align-items: center; justify-content: center;
  z-index: 1000; padding: 16px;
}
.unlock-modal {
  position: relative;
  background: var(--color-surface, #fff);
  border-radius: 16px; padding: 40px 36px 36px;
  width: 100%; max-width: 440px;
  box-shadow: 0 24px 64px rgba(0,0,0,0.18);
  display: flex; flex-direction: column; gap: 16px;
}
.unlock-close {
  position: absolute; top: 16px; right: 16px;
  background: none; border: none; cursor: pointer;
  color: var(--color-text-muted, #6B7280);
  display: flex; align-items: center; padding: 4px;
  border-radius: 6px; transition: color 150ms ease;
}
.unlock-close:hover { color: var(--color-text, #111827); }
.unlock-phase {
  display: flex; flex-direction: column; align-items: center;
  gap: 12px; text-align: center; padding: 8px 0;
}
.unlock-icon { font-size: 36px; line-height: 1; }
.unlock-spinner-wrap { width: 48px; height: 48px; display: flex; align-items: center; justify-content: center; }
.unlock-spinner {
  width: 32px; height: 32px;
  border: 3px solid var(--color-border, #E5E7EB);
  border-top-color: var(--color-primary, #1D1D1F);
  border-radius: 50%; animation: spin 0.75s linear infinite;
}
.unlock-phase-text { font-size: 14px; color: var(--color-text-muted, #6B7280); margin: 0; }
@keyframes spin { to { transform: rotate(360deg); } }
.unlock-title {
  font-size: 20px; font-weight: 700; color: var(--color-primary, #1D1D1F);
  margin: 0; letter-spacing: -0.3px;
}
.unlock-desc {
  font-size: 14px; color: var(--color-text-muted, #6B7280);
  line-height: 1.65; margin: 0; text-align: center;
}
.unlock-link-row { display: flex; gap: 8px; width: 100%; }
.unlock-link-input {
  flex: 1; min-width: 0; padding: 9px 12px;
  border: 1.5px solid var(--color-border, #E5E7EB); border-radius: 8px;
  font-size: 12px; font-family: var(--font-mono, monospace);
  color: var(--color-text, #111827); background: var(--color-bg, #F8F9FA);
  outline: none; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
}
.unlock-link-input:focus { border-color: var(--color-primary, #1D1D1F); }
.unlock-copy-btn {
  display: flex; align-items: center; gap: 6px;
  padding: 9px 16px; border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 8px; background: var(--color-surface, #fff);
  font-size: 13px; font-weight: 600; color: var(--color-text, #111827);
  cursor: pointer; font-family: inherit; white-space: nowrap; flex-shrink: 0;
  transition: border-color 150ms ease, color 150ms ease, background 150ms ease;
}
.unlock-copy-btn:hover { border-color: var(--color-text-muted, #6B7280); }
.unlock-copy-btn--done { border-color: #16a34a; color: #16a34a; background: #F0FDF4; }
.unlock-share-row { display: flex; gap: 8px; width: 100%; }
.unlock-share-btn {
  display: inline-flex; align-items: center; gap: 7px;
  padding: 8px 16px; border-radius: 8px; font-size: 13px; font-weight: 600;
  text-decoration: none; transition: opacity 150ms ease;
}
.unlock-share-btn:hover { opacity: 0.85; }
.unlock-share-btn--twitter { background: #000; color: #fff; }
.unlock-waiting { display: flex; flex-direction: column; align-items: center; gap: 10px; padding: 4px 0; }
.unlock-waiting-dots { display: flex; gap: 6px; align-items: center; }
.unlock-waiting-dots span {
  width: 7px; height: 7px; border-radius: 50%;
  background: var(--color-accent, #3B82F6);
  animation: bounce-dot 1.2s ease-in-out infinite;
}
.unlock-waiting-dots span:nth-child(2) { animation-delay: 0.2s; }
.unlock-waiting-dots span:nth-child(3) { animation-delay: 0.4s; }
@keyframes bounce-dot {
  0%, 80%, 100% { transform: scale(0.7); opacity: 0.5; }
  40% { transform: scale(1.1); opacity: 1; }
}
.unlock-waiting-text { font-size: 13px; color: var(--color-text-muted, #6B7280); margin: 0; }
.unlock-hint { font-size: 11px; color: var(--color-text-muted, #6B7280); margin: 0; text-align: center; opacity: 0.7; }
.unlock-retry-btn {
  padding: 10px 24px; background: var(--color-primary, #1D1D1F); color: #fff;
  border: none; border-radius: 8px; font-size: 14px; font-weight: 600;
  cursor: pointer; font-family: inherit; transition: opacity 150ms ease;
}
.unlock-retry-btn:hover { opacity: 0.88; }
.unlock-phase--success .unlock-success-icon {
  width: 52px; height: 52px; border-radius: 50%;
  background: #16a34a; color: #fff; font-size: 24px;
  display: flex; align-items: center; justify-content: center;
}
.unlock-progress {
  width: 100%; height: 4px; background: var(--color-border, #E5E7EB);
  border-radius: 9999px; overflow: hidden;
}
.unlock-progress-bar {
  height: 100%; background: #16a34a; border-radius: 9999px;
  animation: fill-bar 1.8s linear forwards;
}
@keyframes fill-bar { from { width: 0%; } to { width: 100%; } }
.modal-fade-enter-active, .modal-fade-leave-active { transition: opacity 200ms ease; }
.modal-fade-enter-from, .modal-fade-leave-to { opacity: 0; }
@media (max-width: 480px) {
  .unlock-modal { padding: 32px 20px 28px; }
  .unlock-title { font-size: 18px; }
}
</style>