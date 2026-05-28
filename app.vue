<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

<script setup lang="ts">
/**
 * app.vue — T15 SEO 基础设施
 *
 * 职责：
 * 1. 全局默认 meta（title / description / OG / Twitter Card）
 * 2. 每个路由自动生成 canonical
 * 3. Open Graph 默认值兜底（各页面可用 useHead() 覆盖）
 */

const route = useRoute()
const config = useRuntimeConfig()

// ── 站点基础信息 ─────────────────────────────────────────────────────────────
const SITE_URL = config.public.siteUrl || 'https://uimaster.cc'
const SITE_NAME = 'uimaster.cc'
const DEFAULT_TITLE = 'uimaster.cc - UI Style Preview & Design System Generator'
const DEFAULT_DESCRIPTION =
  'Preview 67+ UI styles across 161 product types. Download MASTER.md design system files for Claude Code, Cursor, and Windsurf. Browse HTML effects gallery with live code editor.'
const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`

// ── 自动 canonical（跟随当前路由）────────────────────────────────────────────
const canonicalUrl = computed(() => {
  // 去掉 query string，只保留 pathname
  const path = route.path.endsWith('/') && route.path !== '/'
    ? route.path.slice(0, -1)
    : route.path
  return `${SITE_URL}${path}`
})

// ── 全局 useHead（各页面 useHead/useSeoMeta 会合并并覆盖同名字段）────────────
useHead({
  // titleTemplate 由 nuxt.config.ts 统一处理，此处不重复
  link: [
    // canonical 随路由动态更新
    { rel: 'canonical', href: canonicalUrl },
    // 预连接常用资源
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' },
  ],
})

// ── 默认 SEO meta（兜底，各页面可完全覆盖）──────────────────────────────────
useSeoMeta({
  // 基础
  title: DEFAULT_TITLE,
  description: DEFAULT_DESCRIPTION,
  robots: 'index, follow',

  // Open Graph
  ogType: 'website',
  ogSiteName: SITE_NAME,
  ogTitle: DEFAULT_TITLE,
  ogDescription: DEFAULT_DESCRIPTION,
  ogImage: DEFAULT_OG_IMAGE,
  ogImageWidth: '1200',
  ogImageHeight: '630',
  ogImageAlt: `${SITE_NAME} - UI Style Preview`,
  ogUrl: canonicalUrl,

  // Twitter Card
  twitterCard: 'summary_large_image',
  twitterSite: '@uimastercc',
  twitterTitle: DEFAULT_TITLE,
  twitterDescription: DEFAULT_DESCRIPTION,
  twitterImage: DEFAULT_OG_IMAGE,
})

// ── Schema.org WebSite（全局结构化数据）──────────────────────────────────────
useSchemaOrg([
  {
    '@type': 'WebSite',
    name: SITE_NAME,
    url: SITE_URL,
    description: DEFAULT_DESCRIPTION,
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${SITE_URL}/effects?q={search_term_string}`,
      },
      'query-input': 'required name=search_term_string',
    },
  },
])
</script>