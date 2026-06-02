# uimaster.cc — 产品需求说明书

> UI/UX Pro Max 可视化预览站 + 设计系统生成器 + HTML Effects Gallery

**域名：** uimaster.cc
**技术栈：** Nuxt 4 + Vue 3 + Tailwind CSS + Cloudflare Pages + Cloudflare D1 + Cloudflare R2
**变现方式：** Google AdSense 广告
**开源协议：** MIT，数据来源注明 ui-ux-pro-max

---

## 一、产品定位

uimaster.cc 由两条产品线构成，共享域名、导航和流量，互相导流：

| 产品线 | 路由前缀 | 核心价值 | 目标用户 |
|--------|---------|---------|---------|
| **Design System Preview** | `/preview/` `/compare/` | 为 ui-ux-pro-max 补上可视化前端，看着选风格，一键下载 MASTER.md | 使用 Claude Code / Cursor / Windsurf 的 AI 编码开发者 |
| **HTML Effects Gallery** | `/effects/` | 展示可运行的 HTML 特效，实时预览 + 代码编辑 + 下载 | 前端开发者、独立开发者、设计师 |

两条产品线独立运营，但共用以下基础设施：
- 导航栏（两个入口）
- Google AdSense 广告位
- SEO 基础设施（sitemap、meta、Schema.org）
- GitHub 仓库（两个贡献目录）

---

## 二、产品线 A — Design System Preview

### 2.1 产品背景

ui-ux-pro-max 是一个拥有 80k+ stars 的 AI 编码设计系统工具，提供 67 种 UI 风格、161 套配色、57 套字体组合。但所有内容全是文字描述，开发者在使用前完全不知道生成效果长什么样，导致大量用户反馈"不知道怎么选"。

uimaster.cc 解决这个痛点：用户选择产品类型 + UI 风格，即可实时预览对应的落地页效果，并一键下载可直接用于 Claude Code / Cursor / Windsurf 的 MASTER.md 设计系统文件。

### 2.2 核心功能

**风格 × 产品类型预览**
- 左侧：风格选择器（卡片形式）+ 产品类型下拉搜索
- 右侧：iframe 实时渲染 demo HTML
- 支持桌面 / 移动端预览切换
- 每个组合独立 URL：`/preview/[style]-[product]`

**Demo 源码展示**
- 预览页 iframe 下方提供可折叠源码面板
- `$fetch` 加载 `/demos/official|community/[slug].html`，只读展示
- highlight.js 语法高亮，SEO 爬虫可抓取完整 HTML 源码
- 源码内含风格相关 class 名、CSS 变量、关键词，提升页面正文密度

**MASTER.md 下载**
- 前端 JS 版 BM25（对齐官方 core.py，k1=1.5，b=0.75）匹配设计系统参数
- 生成包含完整 CSS 实现的 MASTER.md
- 文件结构：色值 token + 字体 + 间距 + 核心组件 CSS + 反模式 + 检查清单
- 主从结构：MASTER.md + pages/ 子文件

**风格对比**
- URL：`/compare/[style1]-vs-[style2]`
- 左右两个 iframe 并排展示，产品类型联动切换
- 对比维度：性能、可访问性、适用场景

**社区贡献（PR 机制）**
- 通过 GitHub PR 提交 demo HTML + meta.json
- 合并后贡献者外链永久展示在对应预览页（do-follow）
- 区分 official / community 两个来源

### 2.3 页面结构

```
/                              首页（选择器 + 预览）
/preview/[style]-[product]     组合预览页（SEO 核心）
/compare/[style1]-vs-[style2]  风格对比页
/styles/[style]                风格详情页
/products/[product]            产品类型详情页
/how-to-use                    使用说明页
```

### 2.4 数据层

```
public/data/
├── styles.json        67 种 UI 风格（官方 CSV 转换）
├── colors.json        161 套配色
├── typography.json    57 套字体
├── products.json      161 种产品类型
├── landing.json       落地页模式
└── ui-reasoning.json  161 条推理规则

public/demos/
├── official/          自产 demo HTML
└── community/         社区贡献 demo HTML

public/meta/
└── [style]-[product].json
```

### 2.5 MASTER.md 生成逻辑

1. BM25 在本地 JSON 数据中匹配最佳设计系统参数
2. design_system.js 组装设计系统对象
3. 生成 MASTER.md，包含色值 token、字体导入、间距变量、核心组件 CSS、反模式、检查清单

### 2.6 半自动化 Demo 生成流程

1. `scripts/scripts.py convert` — CSV 转 JSON
2. `scripts/scripts.py combinations` — 生成组合列表
3. `scripts/scripts.py prompts` — 生成提示词文件
4. 人工：每天打开若干 `.txt`，丢给 Claude chat，保存输出 HTML
5. `scripts/scripts.py extract` — 提取核心 CSS

### 2.7 MVP 范围

- 首页选择器 + iframe 预览
- 至少 30 个 demo HTML（8 种热门风格 × 主要产品类型）
- MASTER.md 下载功能
- 每个组合独立 URL + 基本 SEO meta
- Google AdSense 接入
- GitHub 仓库 + CONTRIBUTING.md

---

## 三、产品线 B — HTML Effects Gallery

### 3.1 产品背景

基于已有的 demo HTML 资产延伸，将单独的落地页 demo 扩展为完整的 HTML 特效画廊，覆盖 canvas 动画、WebGL、CSS Animation 等纯前端特效，面向更广泛的前端开发者群体。

### 3.2 核心功能

**画廊列表**
- 卡片展示，默认静图，hover 切换动图
- 按分类、场景筛选
- 关键词搜索（标题、描述、标签）
- 热门排序（view_count）

**详情页**
- 左侧：iframe 实时预览（srcdoc 注入，无跨域）
- 右侧：Monaco Editor / CodeMirror 代码编辑器，语法高亮，一键复制
- 编辑器与预览联动：修改代码 → 实时更新 iframe
- 导出/下载 HTML 文件（受分享解锁机制控制）
- 相关推荐（同分类/场景）

**分享解锁机制**
- 每次导出计数 +1（localStorage）
- 累计超过 3 次触发强制分享拦截
- 系统生成专属分享 token，写入 D1
- 有人通过分享链接访问后，解锁继续下载，计数重置

### 3.3 页面结构

```
/effects/                      画廊首页（列表）
/effects/[id]                  详情页（预览 + 代码编辑器）
/effects/category/[category]   分类页
/effects/scene/[scene]         场景页
```

### 3.4 技术架构

| 层级 | 技术 |
|------|------|
| 数据库 | Cloudflare D1（SQLite） |
| 文件存储 | Cloudflare R2 |
| 服务端逻辑 | Cloudflare Workers |
| 封面生成 | Puppeteer + ffmpeg |
| 代码编辑器 | Monaco Editor / CodeMirror |
| 语法高亮 | highlight.js / shiki |

### 3.5 自动化流水线

针对 `demos/` 目录下每个 HTML 文件：

```
① 录制动图（640×400 webp）+ 提取首帧静图 → 上传 R2
② 渲染 og-template.html → 截图 1200×630 → 上传 R2
③ 回写原 HTML：注入 og:image meta + noindex meta
④ 解析技术关键词 → AI 生成 150~200 字描述
⑤ 写入 Cloudflare D1
⑥ 移动文件到 demos/done/
```

触发方式：
```bash
node generate.js           # 全量处理
node generate.js --new     # 只处理新增
node generate.js --file x  # 处理单个文件
```

### 3.6 数据库设计

**主表 `html_effects`**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PK | slug |
| `title` | TEXT | 效果标题 |
| `description` | TEXT | AI 生成描述（150~200字）|
| `category` | TEXT | 分类 |
| `scene` | TEXT | 使用场景 |
| `tags` | TEXT | 技术标签（JSON 数组）|
| `source_url` | TEXT | R2 HTML 文件地址 |
| `cover_url` | TEXT | R2 动图地址 |
| `cover_static_url` | TEXT | R2 静图地址 |
| `og_image_url` | TEXT | R2 og:image 地址 |
| `date` | TEXT | 入库日期 |
| `is_featured` | INTEGER | 是否推荐（0/1）|
| `view_count` | INTEGER | 浏览次数 |
| `export_count` | INTEGER | 导出次数 |
| `share_count` | INTEGER | 分享次数 |
| `created_at` | TEXT | 创建时间 |
| `updated_at` | TEXT | 更新时间 |

**分享记录表 `share_records`**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | TEXT PK | 唯一 ID |
| `effect_id` | TEXT | 关联 effect |
| `share_token` | TEXT | 专属 token |
| `created_at` | TEXT | 创建时间 |
| `unlocked_at` | TEXT | 解锁时间（NULL=未解锁）|
| `visitor_count` | INTEGER | 访问次数 |

### 3.7 文件存储结构（R2）

```
effects/{id}.html          原始 HTML（回写 og meta 后）
covers/{id}.webp           动图封面（640×400）
covers/{id}-static.webp    静图封面（首帧）
og/{id}-og.webp            OG Image（1200×630）
```

### 3.8 API 接口

| 接口 | 方法 | 说明 |
|------|------|------|
| `/api/sitemap.xml` | GET | 动态 sitemap |
| `/api/effects` | GET | 列表（分类/场景/排序/分页）|
| `/api/effects/:id` | GET | 单条详情 |
| `/api/effects/:id/view` | POST | 浏览计数 +1 |
| `/api/effects/:id/export` | POST | 导出计数 +1 |
| `/api/share/create` | POST | 创建分享 token |
| `/api/share/verify/:token` | GET | 验证是否已解锁 |
| `/api/share/visit/:token` | GET | 标记 token 被访问 |

### 3.9 SEO 内容保障

详情页包含实质性文本内容：
- 标题 + 分类 + 技术标签
- AI 生成描述（150~200 字）
- 使用场景说明
- 完整 HTML 源码（爬虫可抓取，技术关键词密度高）
- 相关推荐

原始 HTML 文件统一注入 `<meta name="robots" content="noindex, nofollow">`，流量集中到详情页。

---

## 四、共用广告位规划

| 位置 | 尺寸 | 适用页面 |
|------|------|---------|
| 侧边栏下方 | 160×600 | 首页、画廊列表页 |
| 预览区域下方 | 728×90 | 所有预览/详情页 |
| 内容中部 | 728×90 | 详情页（iframe 和参数之间）|
| 页面底部 | 728×90 | 所有页面（相关推荐上方）|
| 移动端底部 | 320×50 | 全部页面（仅移动端）|

原则：iframe 预览区域内不放广告，下载/导出按钮周围不放广告，移动端只保留一个广告位。

---

## 五、增长策略

**冷启动：** MVP 后联系 @nextlevelbuilder，争取 README 收录，直接吃 80k stars 流量

**社区传播：** 贡献者外链激励（do-follow）驱动开发者自发贡献和传播

**SEO 主力：** 风格 × 产品类型长尾词（每个 /preview/ 页面）+ HTML 特效词（每个 /effects/ 页面）

**分享裂变：** HTML Effects Gallery 的分享解锁机制，每次下载带来真实访问流量

**对比页：** `/compare/` 系列覆盖"glassmorphism vs neumorphism"类高价值比较词
