# Sprint 3 — 广告接入与 Cloudflare 部署

## 前置状态

- 已完成模块：Sprint 1、Sprint 2
- 当前分支：`sprint/s3-ads-deploy`
- 依赖：Google AdSense 账号已申请并审核通过

---

## 本次目标

- [ ] AdSlot 组件实现（防 CLS 固定占位）
- [ ] 接入 Google AdSense 脚本（异步加载）
- [ ] 四个广告位就位（见 ads.md）
- [ ] 移动端广告位适配
- [ ] Cloudflare Pages 部署配置
- [ ] 自定义域名 uimaster.cc 绑定
- [ ] nuxt.config.ts 生产环境配置
- [ ] robots.txt + sitemap 自动提交

---

## 技术约束

- 遵循 ads.md 全部规定
- AdSense 脚本必须异步加载，不阻塞 LCP
- 广告位必须有固定尺寸 CSS，防止 CLS > 0.1
- Cloudflare Pages 使用 `nuxi generate` 静态输出
- 不需要 Cloudflare Workers，纯静态站点

---

## Cloudflare Pages 配置

```toml
# wrangler.toml 不需要
# Cloudflare Pages 直接配置：

Build command: pnpm run generate
Build output directory: .output/public
Node.js version: 20
```

环境变量在 Cloudflare Pages 控制台配置：
```
NUXT_PUBLIC_SITE_URL = https://uimaster.cc
NUXT_PUBLIC_ADSENSE_ID = ca-pub-xxxxxxxxxx
```

---

## 验收标准

- [ ] `pnpm run generate` 无报错，生成静态文件
- [ ] Cloudflare Pages 部署成功，uimaster.cc 可以访问
- [ ] 广告位在桌面端显示占位框（AdSense 审核中也显示占位）
- [ ] 移动端只显示底部小广告，其他广告位隐藏
- [ ] Lighthouse 性能分数 > 85
- [ ] CLS < 0.1（广告位有固定占位）

---

## 不在本次范围

- 风格对比页（Sprint 4）
- 社区 PR 机制的页面展示（Sprint 4）
