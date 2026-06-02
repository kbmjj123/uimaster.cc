# 产品需求说明书
# HTML Effects Gallery

**版本：** v1.0  
**状态：** 待开发  
**最后更新：** 2026-05-21

---

## 目录

1. [产品概述](#1-产品概述)
2. [技术架构](#2-技术架构)
3. [自动化流水线](#3-自动化流水线)
4. [封面生成规范](#4-封面生成规范)
5. [OG Image 规范](#5-og-image-规范)
6. [数据库设计（Cloudflare D1）](#6-数据库设计cloudflare-d1)
7. [文件存储（Cloudflare R2）](#7-文件存储cloudflare-r2)
8. [站点页面结构](#8-站点页面结构)
9. [详情页功能规范](#9-详情页功能规范)
10. [导出与分享解锁机制](#10-导出与分享解锁机制)
11. [SEO 规范](#11-seo-规范)
12. [Sitemap 动态生成](#12-sitemap-动态生成)
13. [Nuxt.js API 接口](#13-nuxtjs-api-接口)

---

## 1. 产品概述

一个展示 HTML 特效的画廊站点，托管于 Nuxt.js 容器中。用户可以浏览、预览、查看代码、下载 HTML 效果文件。站点支持按分类、场景进行筛选，以及关联推荐功能。

**核心特点：**
- 每个 HTML 效果拥有独立详情页，包含实时预览 + 完整源码展示
- 封面支持动图/静图切换，hover 时播放动图
- 数据存储于 Cloudflare D1，文件资源存储于 Cloudflare R2
- 免费使用，通过分享机制控制导出频率

---

## 2. 技术架构

| 层级 | 技术选型 |
|------|----------|
| 前端框架 | Nuxt.js |
| 数据库 | Cloudflare D1（关系型，SQLite） |
| 文件存储 | Cloudflare R2 |
| 服务端逻辑 | Cloudflare Workers |
| 自动化脚本 | Node.js + Puppeteer |
| 动图合成 | ffmpeg |
| 代码编辑器 | Monaco Editor / CodeMirror |
| 语法高亮 | highlight.js / shiki |

---

## 3. 自动化流水线

### 3.1 触发方式

```bash
node generate.js          # 全量处理 demos/ 目录下所有 HTML
node generate.js --new    # 只处理新增文件（demos/ 中尚未入库的）
node generate.js --file demo1.html  # 只处理指定单个文件
```

### 3.2 完整流程

针对 `demos/` 目录下每一个 HTML 文件，按以下顺序执行：

```
① 录制动图 + 提取首帧静图
      → 上传 R2（动图：xxx.webp，静图：xxx-static.webp）

② 渲染 og-template.html → 截图 1200×630
      → 上传 R2（og_image：xxx-og.webp）

③ 回写原 HTML 文件
      → 替换/注入 og:image meta 标签
      → 同步更新 JSON-LD 中的 image 字段
      → 注入 <meta name="robots" content="noindex, nofollow">

④ 解析 HTML 源码
      → 提取技术关键词（canvas、WebGL、CSS Animation 等）
      → 调用 AI 接口，基于文件名 + 技术关键词 + 分类标签，
        自动生成 150~200 字的自然语言描述

⑤ 写入 Cloudflare D1
      → 插入/更新完整记录（含所有字段）

⑥ 移动文件
      → 将 HTML 从 demos/ 移动到 demos/done/
      → 避免重复处理
```

### 3.3 目录结构

```
项目根目录/
├── generate.js           # 自动化脚本
├── og-template.html      # og:image 合成模板
├── demos/                # 待处理的 HTML 文件放这里
├── demos/done/           # 处理完成后自动移入
└── covers/               # 本地临时存放，上传后可清理
```

---

## 4. 封面生成规范

### 4.1 动图（xxx.webp）

- **尺寸：** 640×400 px
- **录制时长：** 足够长，确保用户能看到效果的完整概况
- **帧数/帧率：** 由 ffmpeg 合成，`-loop 0` 无限循环
- **格式：** 动态 WebP
- **降级方案：** 若 ffmpeg 不可用，保存静态 PNG

### 4.2 静图（xxx-static.webp）

- **来源：** 从动图的**第一帧**提取，不单独截图
- **目的：** 保证静图与动图画面完全一致，无缝切换
- **格式：** 静态 WebP

### 4.3 前端 hover 交互

- 默认展示静图（`xxx-static.webp`）
- 鼠标 hover 时切换为动图（`xxx.webp`）
- 避免页面加载时所有动图同时播放，节省性能

---

## 5. OG Image 规范

### 5.1 尺寸

标准 `1200×630` px（横版）

### 5.2 合成内容布局

```
┌─────────────────────────────────────────────────────┐
│  左侧 60%                    │  右侧 40%             │
│                              │                       │
│  效果截图                     │  站点 Logo / 名称     │
│  居中展示，带圆角              │  效果标题             │
│  object-fit: contain         │  所属分类 tag         │
│  上下左右留边                  │  简短描述             │
│  背景用深色 / 品牌色           │                       │
└─────────────────────────────────────────────────────┘
```

### 5.3 生成方式

- 准备独立的 `og-template.html`，通过 URL 参数或注入变量传入：截图路径、标题、分类、描述
- Puppeteer 渲染该模板后，截图输出 1200×630 的 og:image

### 5.4 回写规则

处理完成后，自动回写到原始 HTML 文件的 `<head>` 中：

```html
<meta property="og:image" content="R2上的URL">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
```

- 如原 HTML 已有上述标签 → 替换
- 如原 HTML 没有上述标签 → 自动注入到 `<head>` 末尾
- 如原 HTML 有 `<script type="application/ld+json">` → 同步更新其中的 `image` 字段

---

## 6. 数据库设计（Cloudflare D1）

### 6.1 主表：`html_effects`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | TEXT PK | slug，如 `particle-bg` |
| `title` | TEXT | 效果标题 |
| `description` | TEXT | AI 生成的自然语言描述（150~200字） |
| `category` | TEXT | 所属分类 |
| `scene` | TEXT | 使用场景 |
| `tags` | TEXT | 技术标签，JSON 数组存储 |
| `source_url` | TEXT | R2 上的原始 HTML 文件访问地址 |
| `cover_url` | TEXT | R2 上的动图封面地址（xxx.webp） |
| `cover_static_url` | TEXT | R2 上的静图封面地址（xxx-static.webp） |
| `og_image_url` | TEXT | R2 上的 og:image 地址（xxx-og.webp） |
| `date` | TEXT | 入库日期，ISO 格式 |
| `is_featured` | INTEGER | 是否人工推荐/置顶（0/1） |
| `view_count` | INTEGER | 浏览次数（热门排行依据） |
| `export_count` | INTEGER | 总导出/下载次数 |
| `last_exported_at` | TEXT | 最近一次导出时间 |
| `share_count` | INTEGER | 该条目被分享次数 |
| `share_unlock_count` | INTEGER | 通过分享解锁的次数 |
| `created_at` | TEXT | 创建时间 |
| `updated_at` | TEXT | 最后更新时间 |

### 6.2 分享记录表：`share_records`

| 字段名 | 类型 | 说明 |
|--------|------|------|
| `id` | TEXT PK | 唯一 ID |
| `effect_id` | TEXT | 关联的 html_effects.id |
| `share_token` | TEXT | 用户专属分享 token |
| `created_at` | TEXT | 分享创建时间 |
| `unlocked_at` | TEXT | 被访问后解锁时间（NULL 表示未解锁） |
| `visitor_count` | INTEGER | 通过该分享链接的访问次数 |

---

## 7. 文件存储（Cloudflare R2）

每个 HTML 效果在 R2 上存储以下文件：

| 文件 | 说明 |
|------|------|
| `effects/{id}.html` | 原始 HTML 文件（回写 og meta 后的版本） |
| `covers/{id}.webp` | 动图封面 |
| `covers/{id}-static.webp` | 静图封面（首帧提取） |
| `og/{id}-og.webp` | og:image（1200×630） |

---

## 8. 站点页面结构

### 8.1 首页（画廊列表）

- 读取 D1，渲染 HTML 效果卡片列表
- 支持按**分类**、**场景**筛选
- 支持关键词搜索（标题、描述、标签）
- 卡片默认展示静图，hover 切换动图
- 支持热门排序（按 `view_count`）

### 8.2 详情页

见第 9 节。

### 8.3 分类/场景页

- 独立 URL，如 `/category/canvas`、`/scene/landing-page`
- 有利于 SEO 长尾词收录

---

## 9. 详情页功能规范

### 9.1 页面结构

```
标题 + 分类标签 + 技术标签
AI 生成描述文字
使用场景说明

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
左侧：iframe 实时预览
      src 指向 R2 上的 HTML 文件地址
      或使用 srcdoc 注入源码（无跨域问题）

右侧：代码编辑器
      加载完整 HTML 源码（从 R2 的 source_url fetch）
      Monaco Editor / CodeMirror 展示
      语法高亮
      一键复制按钮
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

编辑器与预览联动：
  用户修改编辑器内容 → 同步更新 iframe 的 srcdoc → 实时预览

导出/下载按钮（受分享解锁机制控制）

相关推荐（从 D1 查询同分类/场景的其他效果）
```

### 9.2 代码使用方式

**方式一：代码编辑器（Monaco / CodeMirror）**
- fetch `source_url` 获取完整 HTML 源码
- 加载到编辑器，支持阅读、修改、复制

**方式二：iframe 直接预览**
- 使用 `srcdoc` 属性将源码注入 iframe，不依赖文件路径，无跨域问题
- 编辑器内容变更时，实时更新 `srcdoc`，形成 Playground 体验

### 9.3 SEO 内容深度保障

详情页包含以下实质性文本内容，确保搜索引擎判定为高质量页面：
- 标题、分类、技术标签
- AI 生成描述（150~200 字）
- 使用场景说明
- 完整 HTML 源码（爬虫可抓取，技术关键词密度高）
- 相关推荐模块

---

## 10. 导出与分享解锁机制

### 10.1 规则

- 用户每次导出/下载 HTML 文件，本地计数 +1（存储于 `localStorage`）
- 累计导出超过 **3 次**，触发强制分享拦截，暂停下载
- 用户完成分享并带来真实访问后，解锁继续下载，计数重置

### 10.2 分享解锁流程（方式三：真实访问解锁）

```
用户触发第 4 次导出
  → 弹出分享引导弹窗
  → 系统生成专属分享 token，写入 D1 share_records 表
  → 用户复制分享链接（含 token）并分享出去
  → 有人通过该链接访问站点
  → Workers 检测到 token 被访问，标记 unlocked_at
  → 用户刷新或轮询后，解锁下载，localStorage 计数重置
```

**选择此方式的理由：**
- 必须带来真实流量才能解锁，形成正向增长循环
- 分享数据同时作为热度统计依据

### 10.3 相关 D1 字段

已在 `html_effects` 表预留：
- `export_count` — 总导出次数
- `last_exported_at` — 最近导出时间
- `share_count` — 被分享次数
- `share_unlock_count` — 通过分享解锁的次数

`share_records` 表记录每一条分享链接的生命周期。

---

## 11. SEO 规范

### 11.1 原始 HTML 文件

所有 `demos/done/` 中的 HTML 文件，在流水线回写阶段统一注入：

```html
<meta name="robots" content="noindex, nofollow">
```

防止搜索引擎直接收录原始 HTML 文件，避免与详情页形成重复内容，流量集中到详情页。

### 11.2 详情页 Meta

每个详情页由 Nuxt.js 服务端渲染，输出：

```html
<title>{效果标题} - HTML Effects Gallery</title>
<meta name="description" content="{AI生成描述}">
<meta property="og:title" content="{效果标题}">
<meta property="og:description" content="{AI生成描述}">
<meta property="og:image" content="{og_image_url}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "{效果标题}",
  "description": "{AI生成描述}",
  "image": "{og_image_url}",
  "programmingLanguage": "HTML",
  "keywords": "{tags}"
}
</script>
```

---

## 12. Sitemap 动态生成

- Nuxt.js 提供 `/api/sitemap.xml` 接口
- 从 D1 查询所有已入库的效果条目
- 动态生成标准 `sitemap.xml`，包含：
  - `<loc>` — 详情页完整 URL
  - `<lastmod>` — `updated_at` 字段
  - `<changefreq>` — `monthly`
  - `<priority>` — 普通页 `0.8`，featured 页 `1.0`
- 数据增量更新，新 HTML 入库后 sitemap 自动包含，无需手动维护

---

## 13. Nuxt.js API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/sitemap.xml` | GET | 动态返回 sitemap |
| `/api/effects` | GET | 列表查询，支持分类、场景、排序、分页参数 |
| `/api/effects/:id` | GET | 单条详情 |
| `/api/effects/:id/view` | POST | 浏览计数 +1 |
| `/api/effects/:id/export` | POST | 导出计数 +1，记录 last_exported_at |
| `/api/share/create` | POST | 创建分享 token，写入 share_records |
| `/api/share/verify/:token` | GET | 验证 token 是否已被访问解锁 |
| `/api/share/visit/:token` | GET | 分享链接被访问时触发，标记 unlocked_at |

---

*本文档覆盖产品讨论中的所有决策，编码阶段按模块逐步实现。*
