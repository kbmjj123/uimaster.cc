# HTML Effects Gallery — 产品规范

## 定位

uimaster.cc 第二条产品线，路由前缀 `/effects/`。

展示可运行的 HTML 特效（canvas 动画、WebGL、CSS Animation 等），每个特效有独立详情页，支持实时预览 + 代码编辑 + 下载。面向比 Design System Preview 更广泛的前端开发者群体。

---

## 页面结构

```
/effects/                        画廊首页（列表）
/effects/[id]                    详情页（预览 + 代码编辑器）
/effects/category/[category]     分类页
/effects/scene/[scene]           场景页
```

---

## 组件规范

### EffectCard 卡片组件

```vue
<EffectCard :effect="effect" />
```

行为：
- 默认展示静图（`cover_static_url`）
- 鼠标 hover → 切换为动图（`cover_url`）
- 避免页面加载时所有动图同时播放

```vue
<template>
  <div class="effect-card" @mouseenter="playing = true" @mouseleave="playing = false">
    <img
      :src="playing ? effect.cover_url : effect.cover_static_url"
      :alt="effect.title"
      loading="lazy"
    />
    <div class="effect-card__meta">
      <h3>{{ effect.title }}</h3>
      <span class="tag">{{ effect.category }}</span>
    </div>
  </div>
</template>
```

### EffectPreview iframe 组件

使用 `srcdoc` 注入源码，不依赖文件路径，无跨域问题：

```vue
<template>
  <iframe
    :srcdoc="sourceCode"
    sandbox="allow-scripts"
    class="effect-preview"
  />
</template>
```

编辑器内容变更时，实时更新 `srcdoc`，形成 Playground 体验。

### CodeEditor 组件

```vue
<CodeEditor
  :value="sourceCode"
  language="html"
  @change="onCodeChange"
/>
```

- 使用 Monaco Editor 或 CodeMirror
- 语法高亮（highlight.js / shiki）
- 一键复制按钮
- 行号显示

---

## 详情页布局

```
标题 + 分类 tag + 技术 tag
AI 描述文字（150~200 字）
使用场景说明

┌──────────────────┬──────────────────┐
│  左侧：iframe     │  右侧：代码编辑器 │
│  实时预览         │  完整 HTML 源码   │
│  srcdoc 注入      │  语法高亮         │
│                  │  一键复制         │
└──────────────────┴──────────────────┘

[下载 HTML] 按钮（受分享解锁机制控制）

相关推荐（同分类/场景，4-6 个）
```

编辑器与预览联动：修改代码 → 实时更新 iframe srcdoc。

---

## 分享解锁机制

### 流程

```
用户第 4 次点击下载
  → 弹出分享引导弹窗
  → 后端生成专属 share_token，写入 D1 share_records
  → 用户复制含 token 的分享链接并传播
  → 有人通过链接访问站点
  → Workers 检测 token 被访问，标记 unlocked_at
  → 用户轮询 /api/share/verify/:token
  → 解锁成功，localStorage 计数重置，继续下载
```

### 前端计数逻辑

```typescript
// composables/useExportLimit.ts
const LIMIT = 3

export function useExportLimit() {
  const count = useLocalStorage('export_count', 0)

  function canExport(): boolean {
    return count.value < LIMIT
  }

  function onExport() {
    count.value++
  }

  function reset() {
    count.value = 0
  }

  return { count, canExport, onExport, reset }
}
```

### 轮询解锁验证

```typescript
// 用户分享后，每 3 秒查询一次是否解锁
async function pollUnlockStatus(token: string) {
  const timer = setInterval(async () => {
    const res = await $fetch(`/api/share/verify/${token}`)
    if (res.unlocked) {
      clearInterval(timer)
      useExportLimit().reset()
      // 触发下载
    }
  }, 3000)

  // 最长轮询 10 分钟
  setTimeout(() => clearInterval(timer), 10 * 60 * 1000)
}
```

---

## 自动化流水线

### 目录结构

```
项目根目录/
├── generate.js           自动化脚本
├── og-template.html      OG Image 合成模板
├── demos/                待处理 HTML 文件
├── demos/done/           处理完成后自动移入
└── covers/               本地临时目录，上传后可清理
```

### generate.js 执行顺序

针对 `demos/` 下每个 HTML 文件：

1. **录制封面**：Puppeteer 录制动图（640×400 webp）+ 提取首帧静图
2. **生成 OG Image**：渲染 `og-template.html` → 截图 1200×630
3. **上传 R2**：动图、静图、OG Image 全部上传
4. **回写 HTML**：注入 og:image meta + `noindex` meta
5. **解析关键词**：提取技术关键词（canvas、WebGL 等）
6. **AI 生成描述**：基于文件名 + 关键词 + 分类，生成 150~200 字自然语言描述
7. **写入 D1**：插入/更新 `html_effects` 记录
8. **移动文件**：`demos/` → `demos/done/`

### 封面规格

| 类型 | 尺寸 | 格式 | 来源 |
|------|------|------|------|
| 动图 | 640×400 | 动态 WebP | Puppeteer 录制 + ffmpeg 合成 |
| 静图 | 640×400 | 静态 WebP | 从动图**第一帧**提取（保证画面一致）|
| OG Image | 1200×630 | WebP | Puppeteer 渲染 og-template.html 截图 |

### OG Image 模板布局

```
┌─────────────────────────────────────────────────────┐
│  左侧 60%                    │  右侧 40%             │
│  效果截图（object-fit:contain）│  站点 Logo           │
│  带圆角，上下左右留边           │  效果标题            │
│  深色/品牌色背景               │  所属分类 tag        │
│                              │  简短描述             │
└─────────────────────────────────────────────────────┘
```

---

## Cloudflare D1 迁移文件

```sql
-- migrations/0001_create_html_effects.sql

CREATE TABLE html_effects (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  scene TEXT,
  tags TEXT,
  source_url TEXT,
  cover_url TEXT,
  cover_static_url TEXT,
  og_image_url TEXT,
  date TEXT,
  is_featured INTEGER DEFAULT 0,
  view_count INTEGER DEFAULT 0,
  export_count INTEGER DEFAULT 0,
  last_exported_at TEXT,
  share_count INTEGER DEFAULT 0,
  share_unlock_count INTEGER DEFAULT 0,
  created_at TEXT DEFAULT (datetime('now')),
  updated_at TEXT DEFAULT (datetime('now'))
);

CREATE TABLE share_records (
  id TEXT PRIMARY KEY,
  effect_id TEXT NOT NULL,
  share_token TEXT NOT NULL UNIQUE,
  created_at TEXT DEFAULT (datetime('now')),
  unlocked_at TEXT,
  visitor_count INTEGER DEFAULT 0,
  FOREIGN KEY (effect_id) REFERENCES html_effects(id)
);

CREATE INDEX idx_effects_category ON html_effects(category);
CREATE INDEX idx_effects_scene ON html_effects(scene);
CREATE INDEX idx_effects_view_count ON html_effects(view_count DESC);
CREATE INDEX idx_share_token ON share_records(share_token);
```

---

## API 接口规范

| 接口 | 方法 | 参数 | 说明 |
|------|------|------|------|
| `/api/effects` | GET | `category` `scene` `sort` `page` `q` | 列表查询 |
| `/api/effects/:id` | GET | - | 单条详情 |
| `/api/effects/:id/view` | POST | - | 浏览计数 +1 |
| `/api/effects/:id/export` | POST | - | 导出计数 +1 |
| `/api/share/create` | POST | `{ effect_id }` | 创建分享 token |
| `/api/share/verify/:token` | GET | - | 验证是否已解锁 |
| `/api/share/visit/:token` | GET | - | 标记 token 被访问（分享链接入口）|
| `/api/sitemap.xml` | GET | - | 动态 sitemap |

### /api/effects 查询参数

```
?category=canvas          按分类筛选
?scene=landing-page       按场景筛选
?sort=popular             排序：popular（view_count）/ latest（date）/ featured
?page=1&limit=24          分页
?q=particle               关键词搜索（标题、描述、tags）
```

---

## Sprint 排期（Effects Gallery）

**Phase 1（与 Design System Preview MVP 同期）：**
- D1 + R2 基础配置
- generate.js 自动化流水线
- 画廊列表页 `/effects/`

**Phase 2：**
- 详情页 `/effects/[id]`（iframe + 代码编辑器）
- 分享解锁机制
- 分类/场景页

**Phase 3：**
- OG Image 自动生成
- AI 描述生成接入
- sitemap 动态生成
