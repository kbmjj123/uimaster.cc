# Contribution — 社区贡献规范

## 贡献激励

PR 合并后，贡献者的外链永久展示在对应预览页：

```
This demo was contributed by [贡献者名字] ↗
```

对开发者来说这是一个有 SEO 价值的永久外链。

---

## 文件提交规范

### 1. demo HTML 文件

位置：`public/demos/community/[slug].html`

命名规则：`[style-slug]-[product-slug].html`
例：`glassmorphism-fintech-dashboard.html`

HTML 文件要求：
- 单文件，所有 CSS 内联在 `<style>` 标签
- Google Fonts 用 `@import` 引入
- 必须包含以下区块：导航栏、Hero、功能卡片×3、用户评价×2、底部CTA、页脚
- 占位图片用 `https://placehold.co/600x400`
- 不使用任何 JS 框架
- 必须包含 SEO meta 标签（见模板）

### 2. meta.json 文件

位置：`public/meta/[slug].json`

```json
{
  "slug": "glassmorphism-fintech-dashboard",
  "style": "Glassmorphism",
  "product": "Fintech Dashboard",
  "source": "community",
  "colors": {
    "primary": "#0A0E27",
    "secondary": "#1A1F4E",
    "accent": "#4F8EF7",
    "background": "#050816"
  },
  "fonts": {
    "heading": "Syne",
    "body": "Inter"
  },
  "tags": ["dark", "premium", "financial"],
  "contributor": {
    "name": "Your Name",
    "url": "https://yoursite.com",
    "github": "yourgithub"
  }
}
```

---

## PR 审核标准

合并标准（全部满足才合并）：
- [ ] HTML 文件可以在浏览器正常打开
- [ ] 视觉效果达到展示水准（不明显丑）
- [ ] 包含所有必需区块
- [ ] meta.json 格式正确
- [ ] slug 不与已有文件冲突

拒绝标准（任意一条 = 拒绝）：
- 包含外部 JS 脚本引入
- 包含恶意代码或追踪代码
- 纯占位内容，无实际设计
- 抄袭真实网站设计

---

## 前端展示逻辑

```typescript
// composables/useDemos.ts
function getContributorInfo(meta: DemoMeta) {
  if (meta.source === 'community' && meta.contributor) {
    return {
      name: meta.contributor.name,
      url: meta.contributor.url,
      show: true
    }
  }
  return { show: false }
}
```

预览页底部：

```vue
<div v-if="contributor.show" class="contributor-credit">
  This demo was contributed by 
  <a :href="contributor.url" target="_blank" rel="noopener">
    {{ contributor.name }} ↗
  </a>
</div>
```

`rel="noopener"` 必须保留，但不加 `nofollow`，让外链有 SEO 价值，这是对贡献者的激励。
