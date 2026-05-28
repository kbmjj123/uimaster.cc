# Ads — Google AdSense 广告规范

## 广告位清单

| ID | 位置 | 尺寸 | 页面 |
|----|------|------|------|
| ad-sidebar | 左侧选择器下方 | 160×600 | 首页 |
| ad-below-preview | 预览区域下方 | 728×90 | 首页、预览页 |
| ad-mid-content | iframe 和参数之间 | 728×90 | 预览页 |
| ad-bottom | 相关推荐上方 | 728×90 | 预览页 |
| ad-mobile | 移动端底部固定 | 320×50 | 全部（仅移动端） |

---

## AdSlot 组件规范

```vue
<!-- components/AdSlot.vue -->
<template>
  <div 
    class="ad-slot"
    :class="`ad-slot--${size}`"
    :data-position="position"
  >
    <!-- AdSense 代码在此注入 -->
    <ins 
      class="adsbygoogle"
      :style="adStyle"
      data-ad-client="ca-pub-xxxxxxxxxx"
      :data-ad-slot="adSlotId"
    />
  </div>
</template>
```

每个 AdSlot 必须有固定尺寸的 CSS，防止 CLS：

```css
.ad-slot--728x90 { min-height: 90px; min-width: 728px; }
.ad-slot--160x600 { min-height: 600px; min-width: 160px; }
.ad-slot--320x50 { min-height: 50px; min-width: 320px; }
```

---

## 硬性禁止规则

以下位置绝对不放广告，违反会直接影响用户体验和转化：

- ❌ iframe 预览区域内部
- ❌ 下载 MASTER.md 按钮的 500px 范围内
- ❌ 风格选择卡片之间（选择器区域内）
- ❌ 导航栏内

---

## 移动端规则

移动端只渲染 `ad-mobile`（底部固定 320×50），其他广告位在移动端隐藏：

```vue
<AdSlot 
  v-if="!isMobile" 
  size="728x90" 
  position="below-preview" 
/>
<AdSlot 
  v-if="isMobile" 
  size="320x50" 
  position="mobile" 
/>
```

---

## 加载策略

AdSense 脚本异步加载，不阻塞核心内容渲染：

```typescript
// plugins/adsense.client.ts
export default defineNuxtPlugin(() => {
  useHead({
    script: [{
      src: 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js',
      async: true,
      'data-ad-client': 'ca-pub-xxxxxxxxxx'
    }]
  })
})
```
