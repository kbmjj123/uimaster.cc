# Sprint 4 — 风格对比页与社区机制

## 前置状态

- 已完成模块：Sprint 1、2、3
- 当前分支：`sprint/s4-compare-community`
- 依赖：至少 20 个 demo HTML 文件

---

## 本次目标

- [ ] 风格对比页 `/compare/[slug].vue`
  - 左右两个 iframe 并排
  - 产品类型联动切换
  - 对比维度展示（性能、可访问性、适用场景）
  - 两个独立的下载按钮
- [ ] 风格详情页 `/styles/[style].vue`
  - 该风格所有产品类型缩略图网格
  - 风格技术参数展示
  - 适合对比的风格推荐
- [ ] CONTRIBUTING.md 完善（GitHub 上的贡献指南）
- [ ] PR 模板：`.github/pull_request_template.md`
- [ ] 贡献者外链在预览页正确展示（Sprint 2 已铺垫，本次联调验证）

---

## 对比页 SEO

```
URL:   /compare/glassmorphism-vs-neumorphism
Title: Glassmorphism vs Neumorphism UI Design - Side by Side | uimaster.cc
H1:    Glassmorphism vs Neumorphism
```

对比页自动生成逻辑：取热门风格两两组合，生成对比页列表。
热门风格 8 种，两两组合 = 28 个对比页，全部纳入 sitemap。

---

## CONTRIBUTING.md 内容结构

```
1. 为什么贡献（外链激励说明）
2. 贡献什么（demo HTML + meta.json）
3. 文件规范（命名、结构、要求）
4. 提交流程（Fork → 添加文件 → PR）
5. 审核标准（合并条件、拒绝条件）
6. 提示词模板（帮助贡献者生成高质量 HTML）
```

---

## PR 模板

```markdown
## Demo 信息

- **风格：** 
- **产品类型：** 
- **文件名：** 

## 自检清单

- [ ] HTML 文件在浏览器正常打开
- [ ] 包含所有必需区块（导航/Hero/卡片×3/评价×2/CTA/页脚）
- [ ] meta.json 格式正确，包含 contributor 信息
- [ ] 不包含外部 JS 脚本
- [ ] 视觉效果达到展示水准

## 预览截图

（在此粘贴截图）
```

---

## 技术约束

- 对比页两个 iframe 在移动端改为上下布局
- 风格详情页缩略图尺寸：200×130，懒加载
- CONTRIBUTING.md 写给不熟悉技术的设计师也能看懂

---

## 验收标准

- [ ] `/compare/glassmorphism-vs-neumorphism` 正常显示两个 iframe
- [ ] 产品类型切换，两个 iframe 同步更新
- [ ] `/styles/glassmorphism` 显示该风格所有 demo 缩略图
- [ ] GitHub CONTRIBUTING.md 清晰可读
- [ ] PR 模板在新建 PR 时自动填入
