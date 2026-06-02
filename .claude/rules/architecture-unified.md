# Architecture — Unified Data Pipeline & Site Architecture

> 整合站点架构与数据源策略。
> generate.js 是统一数据流水线，uimaster.cc 是 Design System Preview 前端站点。

---

## 一、架构总览

```
generate.js（统一数据流水线，本地运行）
  │
  ├── --type=design
  │     ├── Puppeteer 截图 demo HTML
  │     ├── 注入 <link rel="canonical">
  │     ├── 上传封面到 R2 covers/{slug}.webp
  │     └── 更新 public/meta/{slug}.json（写入 cover_url）
  │     ← uimaster.cc 消费
  │
  └── --type=effects
        ├── Puppeteer 录制动图 + 静图
        ├── OG Image 合成
        ├── AI 生成描述
        ├── 注入 og:image + noindex
        ├── 上传 R2（covers/ effects/ og/）
        └── 写入 D1 html_effects 表
        ← 其他站点消费（不在 uimaster.cc 渲染）
```

### 核心原则

**uimaster.cc 只做 Design System Preview**，不包含 Effects Gallery 的任何页面或路由。

Effects 数据通过 generate.js 输出到 R2 + D1，供独立的消费者站点使用。uimaster.cc 的 generate.js 只是顺带一起处理 Effects 数据，省一套 Puppeteer 环境。

---

## 二、数据存储策略

```
git 仓库（public/）:
  public/demos/official/*.html   ← Design System demo 源码
  public/meta/*.json             ← demo 元数据（封面 URL 指向 R2）
  public/data/*.json             ← 风格/配色/产品静态数据
  public/covers/                 ← ❌ 不进 git（仅本地临时）

R2 存储（cdn.uimaster.cc）:
  covers/{slug}.webp             ← Design System 封面

D1 数据库:
  html_effects 表                ← Effects 元数据（uimaster.cc 不读）
  share_records 表               ← 分享记录（uimaster.cc 不读）
```

---

## 三、generate.js 统一流水线

```bash
node generate.js --type=design          # 全量处理 Design System
node generate.js --type=design --new    # 只处理新增
node generate.js --type=design --file x # 处理单个

node generate.js --type=effects         # 全量处理 Effects
node generate.js --type=effects --new
node generate.js --type=effects --file x
```

### type=design 流程

```
输入: public/demos/official/{slug}.html
  ↓
① Puppeteer 截图 640×400 WebP（首帧静态）
  ↓
② 注入 <link rel="canonical" href="/preview/{slug}">
  ↓
③ 上传 R2 covers/{slug}.webp
  ↓
④ 更新 public/meta/{slug}.json → 写入 cover_url
  ↓
⑤ 完成（不移动文件）
```

### type=effects 流程

```
输入: demos/{id}.html
  ↓
① Puppeteer 录制动图 + 提取首帧
  ↓
② OG Image 合成 1200×630
  ↓
③ 注入 og:image + noindex
  ↓
④ AI 生成描述
  ↓
⑤ 上传 R2（covers/ effects/ og/）
  ↓
⑥ 写入 D1 html_effects + share_records 表
  ↓
⑦ 移动到 demos/done/
```

### 脚本目录结构

```
scripts/
├── generate.js           # 统一入口
├── modules/
│   ├── cover.js          # Puppeteer 截图/录制（共用）
│   ├── og-image.js       # OG Image 合成
│   ├── r2.js             # R2 上传
│   ├── d1.js             # D1 写入
│   ├── ai-description.js # AI 描述
│   ├── html-rewrite.js   # 回写 canonical/noindex/og
│   └── meta.js           # Design System meta.json 更新
└── config.js
```

---

## 四、首页布局

```
┌──────────────────────────────────────────────┐
│  Navbar                                       │
├──────────────────────────────────────────────┤
│                                              │
│  ┌── Layer 1: 交互预览区 ─────────────────┐  │
│  │  左侧：StyleSelector + ProductSelector  │  │
│  │        + 下载 MASTER.md                 │  │
│  │  右侧：DemoPreview iframe               │  │
│  └─────────────────────────────────────────┘  │
│                                              │
│  ──── 分隔线 ────                            │
│                                              │
│  ┌── Layer 2: Demo 卡片网格 ─────────────┐  │
│  │  展示所有 Design System demo 的卡片    │  │
│  │  封面 WebP + 标题 + 风格标签           │  │
│  │  hover → 小 iframe 实时预览            │  │
│  │  click → /preview/{slug} 详情页        │  │
│  │  数据源：public/meta/*.json             │  │
│  └─────────────────────────────────────────┘  │
│                                              │
└──────────────────────────────────────────────┘
```

Layer 2 卡片只包含 Design System demos，无 Effects 卡片。

---

## 五、SEO 策略

原始 HTML 文件注入 canonical，权重归集到 Nuxt 详情页：

```html
<link rel="canonical" href="https://uimaster.cc/preview/{slug}">
<title>{Style} {Product} UI Design</title>
<meta name="description" content="...">
```

原始 HTML 不需要完整 SEO（Schema.org / OG / 内链），这些只在 Nuxt 详情页实现。canonical 确保 Google 索引的是详情页。

---

## 六、路由总表（uimaster.cc 仅包含 Design System 路由）

| 路由 | 文件 | 数据源 |
|------|------|--------|
| `/` | `pages/index.vue` | 本地 JSON + meta |
| `/preview/[slug]` | `pages/preview/[slug].vue` | 本地 HTML + meta |
| `/compare/[slug]` | `pages/compare/[slug].vue` | 本地 HTML + meta |
| `/styles/[style]` | `pages/styles/[style].vue` | 本地 JSON |
| `/how-to-use` | `pages/how-to-use.vue` | - |

**无 `/effects/*` 路由。** uimaster.cc 纯静态，无后端 API 依赖。

---

## 七、核心约定

1. **generate.js 是唯一数据入口** — 所有封面生成、canonical 注入、meta 更新都通过 generate.js
2. **封面不进 git** — `covers/` `og/` 列入 `.gitignore`，仅本地临时存在
3. **HTML 只增不改** — `public/demos/official/` 的 HTML 仅 canonical 注入时可写，其他场合只读
4. **uimaster.cc 只渲染 Design System** — 不包含 Effects Gallery 页面
5. **Effects 数据仅供下游** — uimaster.cc 不读 D1，不调用 effects API

---

*最后更新: 2026-06-02*
