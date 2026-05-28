# Sprint 1 — 基础建设

## 前置状态

- 已完成模块：无（全新项目）
- 当前分支：`sprint/s1-foundation`
- 依赖：无

---

## 本次目标

- [ ] Nuxt 4 项目初始化，配置 Tailwind CSS
- [ ] 数据层：CSV 转 JSON 脚本 + 数据文件就位
- [ ] BM25 引擎：`composables/useBM25.ts` 实现
- [ ] 设计系统生成：`composables/useDesignSystem.ts`
- [ ] MASTER.md 生成：`composables/useMasterMd.ts`
- [ ] 首页布局：风格选择器 + 产品类型选择器 + iframe 预览
- [ ] 下载功能：点击生成并下载 MASTER.md
- [ ] 5 个种子 demo HTML（手动放入 public/demos/official/）
- [ ] 每个 demo 对应的 meta.json

---

## 技术约束

- 遵循 GLOBAL.md 全部约定
- BM25 参数严格按照 bm25-engine.md（k1=1.5, b=0.75）
- 不接入任何付费 API，全部前端实现
- demo HTML 文件直接静态托管，不需要任何后端

---

## 验收标准

- [ ] 首页可以选择风格和产品类型，iframe 切换到对应 demo
- [ ] 点击下载按钮，浏览器下载 MASTER.md 文件
- [ ] MASTER.md 内容包含色值、字体、组件 CSS
- [ ] JS 版 BM25 输出与 Python 版对比，至少 3 个组合结果一致
- [ ] 5 个 demo 在浏览器正常显示

---

## 不在本次范围

- SEO meta 标签（Sprint 2 处理）
- 独立预览页 `/preview/[slug]`（Sprint 2 处理）
- 广告位接入（Sprint 3 处理）
- 风格对比页（Sprint 4 处理）
- 社区贡献 PR 机制（Sprint 4 处理）
- Cloudflare Pages 部署（Sprint 3 处理）

---

## 种子 Demo 清单（Sprint 1 手动准备）

| slug | 风格 | 产品类型 |
|------|------|---------|
| glassmorphism-fintech-dashboard | Glassmorphism | Fintech Dashboard |
| claymorphism-education-platform | Claymorphism | Education Platform |
| minimalism-saas-landing | Minimalism | SaaS Landing |
| brutalism-portfolio | Brutalism | Portfolio |
| dark-mode-crypto-dashboard | Dark Mode | Crypto Dashboard |
