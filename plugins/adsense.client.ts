/**
 * plugins/adsense.client.ts
 *
 * Loads the Google AdSense script asynchronously so it never blocks LCP.
 *
 * Configuration (via .env / Nuxt runtimeConfig):
 *   NUXT_PUBLIC_ADSENSE_ID=ca-pub-xxxxxxxxxx
 *
 * Behaviour:
 *   - Skipped entirely in development (NODE_ENV !== 'production')
 *   - Skipped if NUXT_PUBLIC_ADSENSE_ID is not set
 *   - Script tag carries `async` + `crossorigin="anonymous"` for best perf
 *   - Exposes `window.adsbygoogle` array so AdSlot.vue's `initAd()` works
 */

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()
  const adClientId: string = config.public.adsenseId as string

  // Guard 1 — skip in dev to avoid accidental AdSense impressions / policy risk
  if (process.env.NODE_ENV !== 'production') {
    if (import.meta.dev) {
      console.info('[AdSense] Skipped — development environment')
    }
    return
  }

  // Guard 2 — skip if the publisher ID hasn't been configured
  if (!adClientId || adClientId === 'ca-pub-xxxxxxxxxx') {
    console.warn('[AdSense] Skipped — NUXT_PUBLIC_ADSENSE_ID is not set')
    return
  }

  // Initialise the adsbygoogle command queue before the script loads so that
  // any AdSlot that calls push({}) before the script arrives doesn't throw.
  ;(window as any).adsbygoogle = (window as any).adsbygoogle || []

  useHead({
    script: [
      {
        // Async so it never blocks the main thread / LCP
        async: true,
        crossorigin: 'anonymous',
        src: `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${adClientId}`,
        'data-ad-client': adClientId,
      },
    ],
  })
})