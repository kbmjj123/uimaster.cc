// composables/useExportLimit.ts
// uimaster.cc — Export limit + share-unlock logic
//
// Rules (per html-effects.md):
//   - First 3 exports: unrestricted
//   - 4th export onward: triggers share gate
//   - After someone visits the share link: count resets, download proceeds
//
// Storage keys:
//   export_count          — number of exports since last reset
//   share_token           — current pending share token (if any)
//   share_effect_id       — effect id the token was created for

const LIMIT = 3
const KEY_COUNT     = 'export_count'
const KEY_TOKEN     = 'share_token'
const KEY_EFFECT_ID = 'share_effect_id'

export interface ExportLimitState {
  count: Ref<number>
  needsUnlock: ComputedRef<boolean>
  pendingToken: Ref<string | null>
  canExport: () => boolean
  recordExport: () => void
  reset: () => void
  saveToken: (token: string, effectId: string) => void
  clearToken: () => void
  restoreToken: () => { token: string | null; effectId: string | null }
}

export function useExportLimit(): ExportLimitState {
  const count = ref<number>(0)
  const pendingToken = ref<string | null>(null)

  if (import.meta.client) {
    count.value = Number(localStorage.getItem(KEY_COUNT) ?? 0)
    pendingToken.value = localStorage.getItem(KEY_TOKEN)
  }

  const needsUnlock = computed(() => count.value >= LIMIT)

  function canExport(): boolean {
    return count.value < LIMIT
  }

  function recordExport(): void {
    count.value++
    if (import.meta.client) {
      localStorage.setItem(KEY_COUNT, String(count.value))
    }
  }

  function reset(): void {
    count.value = 0
    if (import.meta.client) {
      localStorage.setItem(KEY_COUNT, '0')
    }
  }

  function saveToken(token: string, effectId: string): void {
    pendingToken.value = token
    if (import.meta.client) {
      localStorage.setItem(KEY_TOKEN, token)
      localStorage.setItem(KEY_EFFECT_ID, effectId)
    }
  }

  function clearToken(): void {
    pendingToken.value = null
    if (import.meta.client) {
      localStorage.removeItem(KEY_TOKEN)
      localStorage.removeItem(KEY_EFFECT_ID)
    }
  }

  function restoreToken(): { token: string | null; effectId: string | null } {
    if (!import.meta.client) return { token: null, effectId: null }
    return {
      token:    localStorage.getItem(KEY_TOKEN),
      effectId: localStorage.getItem(KEY_EFFECT_ID),
    }
  }

  return { count, needsUnlock, pendingToken, canExport, recordExport, reset, saveToken, clearToken, restoreToken }
}

// ── Poll helper (used by ShareUnlockModal) ────────────────────────────────────

export interface PollOptions {
  token: string
  onUnlocked: () => void
  onTimeout?: () => void
  intervalMs?: number
  timeoutMs?: number
}

export function startUnlockPolling(opts: PollOptions): () => void {
  const {
    token,
    onUnlocked,
    onTimeout,
    intervalMs = 3_000,
    timeoutMs  = 10 * 60 * 1_000,
  } = opts

  let stopped = false

  const timer = setInterval(async () => {
    if (stopped) return
    try {
      const res = await $fetch<{ unlocked: boolean }>(`/api/share/verify/${token}`)
      if (res.unlocked) {
        stop()
        onUnlocked()
      }
    } catch {
      // Network error — keep polling silently
    }
  }, intervalMs)

  const timeout = setTimeout(() => {
    stop()
    onTimeout?.()
  }, timeoutMs)

  function stop() {
    stopped = true
    clearInterval(timer)
    clearTimeout(timeout)
  }

  return stop
}