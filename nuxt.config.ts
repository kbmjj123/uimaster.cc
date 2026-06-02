// nuxt.config.ts — uimaster.cc
// T15: SEO 基础设施配置
// 注意：此文件为增量更新，合并时请保留已有配置，仅添加/替换 SEO 相关部分

export default defineNuxtConfig({
  compatibilityDate: '2024-11-01',
  devtools: { enabled: true },
	css: ['~/assets/css/main.css'],
	components: [
    {
      path: '~/components',
      pathPrefix: false
    }
  ],
	postcss: {
    plugins: {
      '@tailwindcss/postcss': {},
    },
  },
  // ─── 模块 ────────────────────────────────────────────────────────────────
  modules: [
		'@nuxt/content',
    '@nuxtjs/seo',
  ],

  // ─── 全局 App Head（默认 meta 兜底）────────────────────────────────────
  app: {
    head: {
      htmlAttrs: { lang: 'en' },
      charset: 'utf-8',
      viewport: 'width=device-width, initial-scale=1',

      // 默认 title（各页面可覆盖）
      title: 'uimaster.cc - UI Style Preview & Design System Generator',
      titleTemplate: '%s | uimaster.cc',

      meta: [
        // ── 基础 ──
        {
          name: 'description',
          content:
            'Preview 67+ UI styles across 161 product types. Download MASTER.md design system files for Claude Code, Cursor, and Windsurf. Browse HTML effects gallery with live code editor.',
        },
        { name: 'author', content: 'uimaster.cc' },
        { name: 'robots', content: 'index, follow' },

        // ── Open Graph 默认值（各页面可覆盖）──
        { property: 'og:type', content: 'website' },
        { property: 'og:site_name', content: 'uimaster.cc' },
        {
          property: 'og:title',
          content: 'uimaster.cc - UI Style Preview & Design System Generator',
        },
        {
          property: 'og:description',
          content:
            'Preview 67+ UI styles across 161 product types. Download MASTER.md design system files for Claude Code, Cursor, and Windsurf.',
        },
        {
          property: 'og:image',
          content: 'https://uimaster.cc/og-default.png',
        },
        { property: 'og:image:width', content: '1200' },
        { property: 'og:image:height', content: '630' },
        { property: 'og:image:alt', content: 'uimaster.cc - UI Style Preview' },
        { property: 'og:url', content: 'https://uimaster.cc' },

        // ── Twitter Card 默认值 ──
        { name: 'twitter:card', content: 'summary_large_image' },
        { name: 'twitter:site', content: '@uimastercc' },
        {
          name: 'twitter:title',
          content: 'uimaster.cc - UI Style Preview & Design System Generator',
        },
        {
          name: 'twitter:description',
          content:
            'Preview 67+ UI styles across 161 product types. Download MASTER.md design system files for Claude Code, Cursor, and Windsurf.',
        },
        {
          name: 'twitter:image',
          content: 'https://uimaster.cc/og-default.png',
        },
      ],

      link: [
        { rel: 'icon', type: 'image/x-icon', href: '/favicon.ico' },
        { rel: 'canonical', href: 'https://uimaster.cc' }, // 各页面会覆盖
      ],
    },
  },

  // ─── Sitemap 配置 ────────────────────────────────────────────────────────
  sitemap: {
    // 站点根 URL
    siteUrl: 'https://uimaster.cc',

    // 静态 + 动态路由
    urls: async () => {
      const urls: Array<{
        loc: string
        priority?: number
        changefreq?: string
        lastmod?: string
      }> = []

      // ── 静态页面 ──────────────────────────────────────────────────────────
      urls.push(
        { loc: '/', priority: 1.0, changefreq: 'daily' },
        { loc: '/how-to-use', priority: 0.5, changefreq: 'monthly' },
      )

      // ── A 线：Design System Preview ───────────────────────────────────────
      // preview/[slug]
      try {
        const { $fetch } = await import('ofetch')
        // 读取本地 styles.json + products.json 生成组合（静态构建时）
        // 运行时通过内部 API 获取
        const previewSlugs: string[] = await $fetch('/api/_sitemap/preview-slugs').catch(
          () => [],
        )
        previewSlugs.forEach((slug) => {
          urls.push({ loc: `/preview/${slug}`, priority: 0.8, changefreq: 'weekly' })
        })

        // compare/[slug]
        const compareSlugs: string[] = await $fetch('/api/_sitemap/compare-slugs').catch(
          () => [],
        )
        compareSlugs.forEach((slug) => {
          urls.push({ loc: `/compare/${slug}`, priority: 0.6, changefreq: 'weekly' })
        })

        // styles/[style]
        const styles: string[] = await $fetch('/api/_sitemap/styles').catch(() => [])
        styles.forEach((style) => {
          urls.push({ loc: `/styles/${style}`, priority: 0.6, changefreq: 'weekly' })
        })

        // products/[product]
        const products: string[] = await $fetch('/api/_sitemap/products').catch(() => [])
        products.forEach((product) => {
          urls.push({ loc: `/products/${product}`, priority: 0.6, changefreq: 'weekly' })
        })
      } catch {
        // 静态构建时可能无法请求，忽略
      }



      return urls
    },

    // 默认值（会被 urls 数组中的 priority 覆盖）
    defaults: {
      changefreq: 'weekly',
      priority: 0.8,
      lastmod: new Date().toISOString(),
    },

    // 排除不需要收录的路径
    exclude: [
      '/demos/**',
      '/api/**',
      '/admin/**',
    ],
  },

  // ─── Robots 配置（@nuxtjs/robots 模块）──────────────────────────────────
  // robots.txt 通过 public/robots.txt 静态文件提供（见 T15 输出）
  // 此处保持模块引入即可

  // ─── 运行时配置 ──────────────────────────────────────────────────────────
  runtimeConfig: {
    // 服务端专用
    cloudflareD1ApiUrl: process.env.CLOUDFLARE_D1_API_URL || '',
    cloudflareAccountId: process.env.CLOUDFLARE_ACCOUNT_ID || '',
    cloudflareApiToken: process.env.CLOUDFLARE_API_TOKEN || '',
    cloudflareD1DatabaseId: process.env.CLOUDFLARE_D1_DATABASE_ID || '',
    cloudflareR2BucketName: process.env.CLOUDFLARE_R2_BUCKET_NAME || '',
    cloudflareR2Endpoint: process.env.CLOUDFLARE_R2_ENDPOINT || '',

    // 客户端可见
    public: {
      siteUrl: process.env.NUXT_PUBLIC_SITE_URL || 'https://uimaster.cc',
      googleAdsenseId: process.env.GOOGLE_ADSENSE_ID || '',
    },
  },

  // ─── Nitro（Cloudflare Pages 部署）──────────────────────────────────────
  nitro: {
    preset: 'cloudflare-pages',
    prerender: {
      routes: ['/api/metas.json'],
    },
  },
})
