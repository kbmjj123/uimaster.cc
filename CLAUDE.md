# uimaster.cc — Claude Code 入口

> UI/UX Pro Max 可视化预览站 + 设计系统生成器
> 域名：uimaster.cc | 技术栈：Nuxt 4 + Vue 3 + Tailwind CSS + Cloudflare Pages

---

## 规则文档索引	

@.claude/rules/GLOBAL.md
@.claude/rules/architecture-unified.md
@.claude/rules/design-system.md
@.claude/rules/data-model.md
@.claude/rules/bm25-engine.md
@.claude/rules/master-md.md
@.claude/rules/seo.md
@.claude/rules/ads.md
@.claude/rules/contribution.md
@.claude/rules/demo-generation.md
@.claude/rules/html-effects.md

---

## 迭代文档

@.claude/rules/sprints/s1-foundation.md
@.claude/rules/sprints/s2-seo-preview.md
@.claude/rules/sprints/s3-ads-deploy.md
@.claude/rules/sprints/s4-compare-community.md

---

## 当前迭代

@.claude/rules/sprints/s1-foundation.md

---

## 核心约定（每次编码前必读）

1. **数据只读** — `public/data/*.json` 由脚本生成，不要手动修改
2. **Demo 文件只增不改** — `public/demos/` 里的 HTML 文件不要在代码里修改
3. **BM25 对齐** — JS 版 BM25 参数必须和官方 Python 版完全一致（k1=1.5, b=0.75）
4. **SEO 优先** — 每个组合页面必须有独立 title/description/H1
5. **广告不干扰** — iframe 预览区域和下载按钮周围不放广告位
6. **归因** — 页面底部必须保留 "Design data powered by ui-ux-pro-max" 链接

---

## 站点定位

**uimaster.cc 只是 Design System Preview 站点**，纯静态，无后端 API 依赖。

- 数据来自 `public/data/*.json` + `public/demos/official/` + `public/meta/*.json`
- BM25 在浏览器端运行，MASTER.md 在浏览器端生成下载
- 封面图片托管在 R2，通过 meta.json 中的 cover_url 引用

## 两条产品线（数据层）

**Design System Preview（uimaster.cc 渲染）**
- 纯静态站点，数据均在本地
- 封面由 generate.js --type=design 生成并上传 R2
- 详见 @.claude/rules/architecture-unified.md

**HTML Effects Gallery（仅数据流水线，uimaster.cc 不渲染）**
- generate.js --type=effects 处理数据到 D1 + R2
- 供其他独立消费者站点使用
- 详见 @.claude/rules/architecture-unified.md
