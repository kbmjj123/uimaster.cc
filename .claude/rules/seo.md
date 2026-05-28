# SEO — 搜索引擎优化规范

## 关键词策略体系

uimaster.cc 的关键词分四个层级，覆盖从品牌词到长尾词的完整漏斗。

---

### 一、核心词（品牌定位）

首页 title / H1 必须覆盖，代表产品最直接的定位：

```
UI style preview
design system generator
UI theme preview
MASTER.md generator
CSS design system
UI style selector
landing page style preview
```

---

### 二、AI 编码工具词（精准受众，转化率最高）

**工具结合词**（Claude Code / Cursor / Windsurf 用户）：

```
Claude Code UI design
Cursor UI style
Windsurf design system
AI coding design system
SKILL.md UI design
Claude Code MASTER.md
vibe coding UI
```

**痛点搜索词**（覆盖有需求但不知道产品名的用户）：

```
AI generated UI looks generic
how to style AI generated code
design system for cursor rules
cursor rules UI style
```

---

### 三、风格 × 产品类型长尾词（SEO 主力）

每个 `/preview/[style]-[product]` 页面覆盖一组，数量极大（67 种风格 × 161 种产品类型）。

**风格词（每个 /styles/[style] 页面覆盖）：**

```
glassmorphism UI design
neumorphism landing page
brutalism web design
minimalist UI style
dark mode design system
cyberpunk UI template
retro UI design
material design preview
claymorphism components
aurora UI design
bento grid layout
skeuomorphism UI
```

**风格 × 产品类型组合词（/preview/ 页面核心）：**

```
glassmorphism SaaS landing page
brutalism portfolio design
minimalist e-commerce UI
dark mode dashboard design
neumorphism mobile app UI
cyberpunk game landing page
claymorphism education platform
glassmorphism fintech dashboard
```

**对比词（/compare/ 页面）：**

```
glassmorphism vs neumorphism
brutalism vs minimalism UI
dark mode vs light mode design
flat design vs material design
claymorphism vs glassmorphism
```

---

### 四、生态关联词（引用流量）

承接搜索 ui-ux-pro-max 相关词的流量：

**上游工具关联：**

```
ui-ux-pro-max preview
ui-ux-pro-max styles
ui-ux-pro-max visual
ui-ux-pro-max colors
ui-ux-pro-max typography
```

**技术栈词：**

```
Tailwind CSS design system
Nuxt UI template
CSS color tokens
Google Fonts pairing preview
color palette generator developer
typography scale preview
```

---

### 五、HTML Effects Gallery 专属词

HTML Effects 画廊的独立关键词体系，覆盖前端特效搜索需求：

**特效类型词（每个 /effects/category/[category] 页面）：**

```
CSS animation effects HTML
canvas animation examples
WebGL effects demo
particle animation HTML
scroll animation effects
hover effects CSS
loading animation HTML
background animation CSS
```

**使用场景词（每个 /effects/scene/[scene] 页面）：**

```
landing page animation HTML
hero section effects
interactive background HTML
button hover effects
card animation CSS
navbar effects
```

**长尾详情词（每个 /effects/[id] 页面）：**

```
[effect name] HTML source code
[effect name] CSS animation code
free HTML [effect type] download
[effect name] vanilla JS
```

---

## 页面级 SEO 规范

### Design System Preview 页面

```vue
<!-- /preview/[slug] -->
<Head>
  <Title>{{ style }} {{ product }} UI Design - Preview & Download | uimaster.cc</Title>
  <Meta name="description"
    :content="`Preview ${style} style ${product} UI design.
    Download MASTER.md design system for Claude Code, Cursor, Windsurf.`" />
  <Meta name="keywords"
    :content="`${style}, ${product}, UI design, design system,
    Claude Code, CSS template, MASTER.md`" />
  <Link rel="canonical" :href="`https://uimaster.cc/preview/${slug}`" />
</Head>
```

### HTML Effects Gallery 详情页

```vue
<!-- /effects/[id] -->
<Head>
  <Title>{{ effect.title }} - HTML Effect | uimaster.cc</Title>
  <Meta name="description" :content="effect.description" />
  <Meta name="keywords"
    :content="`${effect.tags.join(', ')}, HTML effect, CSS animation, free download`" />
  <Meta property="og:image" :content="effect.og_image_url" />
  <Meta property="og:image:width" content="1200" />
  <Meta property="og:image:height" content="630" />
</Head>
```

### Schema.org 结构化数据

Design System Preview 页面：

```json
{
  "@context": "https://schema.org",
  "@type": "WebPage",
  "name": "[style] [product] UI Design",
  "description": "...",
  "url": "https://uimaster.cc/preview/[slug]",
  "keywords": "[style], [product], UI design"
}
```

HTML Effects 详情页：

```json
{
  "@context": "https://schema.org",
  "@type": "SoftwareSourceCode",
  "name": "[effect title]",
  "description": "[ai description]",
  "image": "[og_image_url]",
  "programmingLanguage": "HTML",
  "keywords": "[tags]"
}
```

---

## 页面文字内容要求（防止空内容页面）

### /preview/[slug] 页面（iframe 下方必须有）

```
H1: [Style] [Product] UI Design
H2: Design System Parameters
    配色方案（色块 + 色值）
    字体组合
    适用场景

H2: How to Use
    三步说明

H2: Related Combinations
    相关组合内链（同风格 3 个 + 同产品 3 个）
```

### /effects/[id] 页面（编辑器下方必须有）

```
H1: [Effect Title]
    分类 tag + 技术 tag
    AI 生成描述（150~200 字）
    使用场景说明

完整 HTML 源码（爬虫可抓取）

H2: Related Effects
    相关推荐内链
```

---

## Sitemap 规范

Nuxt 自动生成，包含两条产品线所有页面：

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  sitemap: {
    urls: async () => [
      // Design System Preview
      ...getAllPreviewSlugs().map(s => `/preview/${s}`),
      ...getAllCompareSlugs().map(s => `/compare/${s}`),
      ...getAllStyles().map(s => `/styles/${s}`),
      // HTML Effects Gallery
      ...await getAllEffectIds().map(id => `/effects/${id}`),
      ...getAllCategories().map(c => `/effects/category/${c}`),
      ...getAllScenes().map(s => `/effects/scene/${s}`),
    ]
  }
})
```

Priority 规则：
- `is_featured = 1` 的 effects 页面：`1.0`
- 普通 effects 页面：`0.8`
- preview 页面：`0.8`
- compare / styles 页面：`0.6`

---

## 禁止事项

- ❌ 同一 meta description 用于多个页面
- ❌ H1 用 JS 渲染（爬虫可能抓不到）
- ❌ iframe 内容当作 SEO 文字内容（爬虫抓不到）
- ❌ 原始 HTML 文件不加 noindex（会和详情页形成重复内容）
