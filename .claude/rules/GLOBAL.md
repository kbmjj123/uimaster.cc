# GLOBAL — 全局框架与技术约束

## 技术栈

| 层级 | 技术 | 版本 |
|------|------|------|
| 框架 | Nuxt | 4.x |
| UI 框架 | Vue | 3.x |
| 样式 | Tailwind CSS | 3.x |
| 部署 | Cloudflare Pages | - |
| 包管理 | pnpm | - |
| 语言 | TypeScript | 严格模式 |

---

## 项目结构

```
uimaster/
├── CLAUDE.md
├── PRD.md
├── CONTRIBUTING.md
├── generate.js                  # HTML Effects 自动化流水线
├── og-template.html             # OG Image 合成模板
├── .claude/rules/
├── pages/
│   ├── index.vue                # 首页（Design System Preview 入口）
│   ├── preview/[slug].vue
│   ├── compare/[slug].vue
│   ├── styles/[style].vue
│   ├── how-to-use.vue
│   └── effects/
│       ├── index.vue            # HTML Effects 画廊首页
│       ├── [id].vue             # 特效详情页
│       ├── category/[category].vue
│       └── scene/[scene].vue
├── components/
│   ├── StyleSelector.vue
│   ├── ProductSelector.vue
│   ├── DemoPreview.vue          # Design System iframe 预览
│   ├── DownloadBtn.vue
│   ├── AdSlot.vue
│   ├── EffectCard.vue           # 静图/动图切换卡片
│   ├── EffectPreview.vue        # srcdoc 注入 iframe
│   ├── CodeEditor.vue           # Monaco/CodeMirror
│   └── ShareUnlockModal.vue     # 分享解锁弹窗
├── composables/
│   ├── useBM25.ts
│   ├── useDesignSystem.ts
│   ├── useMasterMd.ts
│   ├── useDemos.ts
│   └── useExportLimit.ts        # 导出计数 + 分享解锁
├── server/api/
│   ├── effects/index.get.ts
│   ├── effects/[id].get.ts
│   ├── effects/[id]/view.post.ts
│   ├── effects/[id]/export.post.ts
│   ├── share/create.post.ts
│   ├── share/verify/[token].get.ts
│   ├── share/visit/[token].get.ts
│   └── sitemap.xml.get.ts
├── public/
│   ├── data/                    # JSON（Design System）
│   ├── demos/official/
│   ├── demos/community/
│   └── meta/
├── migrations/
│   └── 0001_create_html_effects.sql
├── demos/                       # 待处理 HTML（generate.js）
├── demos/done/
└── scripts/scripts.py           # Design System 数据处理
```

---

## 代码规范

- 组件名：PascalCase，如 `StyleSelector.vue`
- composable 名：camelCase，以 `use` 开头
- 所有组件必须有 TypeScript 类型定义
- 不使用 Options API，统一使用 Composition API + `<script setup>`
- CSS 优先使用 Tailwind utility class，避免自定义 CSS
- 禁止在组件里直接操作 DOM，使用 Vue 响应式

---

## 路由约定

| 页面 | 路由 | 文件 |
|------|------|------|
| 首页 | `/` | `pages/index.vue` |
| 组合预览 | `/preview/[slug]` | `pages/preview/[slug].vue` |
| 风格对比 | `/compare/[slug]` | `pages/compare/[slug].vue` |
| 风格详情 | `/styles/[style]` | `pages/styles/[style].vue` |
| 使用说明 | `/how-to-use` | `pages/how-to-use.vue` |

slug 格式：`[style-slug]-[product-slug]`，如 `glassmorphism-fintech-dashboard`

---

## 环境变量

```env
# .env
NUXT_PUBLIC_SITE_URL=https://uimaster.cc
NUXT_PUBLIC_ADSENSE_ID=ca-pub-xxxxxxxxxx
```

---

## 禁止事项

- ❌ 不直接修改 `public/data/*.json`（由脚本生成）
- ❌ 不在 `public/demos/` 里修改已有 HTML 文件
- ❌ 不使用 localStorage / sessionStorage（Effects Gallery 导出计数除外）
- ❌ 不引入重量级 UI 组件库（shadcn 除外）
- ❌ 不在 Design System iframe 内注入任何脚本
- ❌ 不在 Effects Gallery iframe 内注入来自外部的脚本（srcdoc 内容为用户代码）
- ❌ 不把 generate.js 的逻辑搬到 Cloudflare Workers（本地脚本，不部署）
- ❌ 原始 HTML 文件（demos/done/）不能暴露给搜索引擎（必须有 noindex）
