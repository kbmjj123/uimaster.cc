# Sprint 2 — SEO 与独立预览页

## 前置状态

- 已完成模块：Sprint 1（基础建设）
- 当前分支：`sprint/s2-seo-preview`
- 依赖：`public/demos/official/` 至少 5 个 HTML 文件

---

## 本次目标

- [ ] 独立预览页 `/preview/[slug].vue`
- [ ] 每个预览页的完整 SEO meta 标签
- [ ] Open Graph 社交分享标签
- [ ] Schema.org 结构化数据
- [ ] 页面文字内容区域（iframe 下方）
  - H1 标题
  - 设计系统参数展示（配色色块 + 字体 + 适用场景）
  - Demo 源码展示（折叠面板，highlight.js 语法高亮）
  - 三步使用说明
  - 相关组合推荐（内链）
- [ ] 贡献者外链展示逻辑
- [ ] sitemap.xml 自动生成
- [ ] `/how-to-use` 使用说明页

---

## 技术约束

- 遵循 seo.md 全部规定
- H1 必须服务端渲染，不能依赖客户端 JS
- 每个页面 meta description 必须唯一，根据 slug 动态生成
- 相关推荐链接：同风格 3 个 + 同产品类型 3 个
- 贡献者外链：`rel="noopener"`，不加 `nofollow`

---

## 验收标准

- [ ] `/preview/glassmorphism-fintech-dashboard` 可以正常访问
- [ ] 页面 title 包含风格名和产品类型
- [ ] 查看页面源码，H1 在 HTML 里（非 JS 渲染）
- [ ] 查看页面源码，og:image / og:title 存在
- [ ] Demo 源码折叠面板可展开，展示完整 HTML，语法高亮正确
- [ ] sitemap.xml 包含所有 demo 对应的 URL
- [ ] 有贡献者信息的 demo，页面底部显示外链

---

## 不在本次范围

- 广告位（Sprint 3）
- 风格对比页（Sprint 4）
- 风格详情页 `/styles/[style]`（Sprint 4）
