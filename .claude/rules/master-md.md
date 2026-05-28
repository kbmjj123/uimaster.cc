# Master MD — MASTER.md 生成规范

## 核心原则

MASTER.md 里必须包含**可直接运行的 CSS 代码**，不能只有文字描述。
这是保证"任何模型读取后都能还原预览效果"的唯一可靠手段。

---

## 文件结构（固定顺序，不可调整）

```
1. Logic Header         主从逻辑说明（Claude Code 读取优先级）
2. 项目元信息           项目名、风格、产品类型、生成时间
3. Global Rules
   3.1 Color Palette    完整色值 token 表
   3.2 Typography       字体 + Google Fonts 导入代码
   3.3 Spacing          间距变量
   3.4 Shadows          阴影层级
4. Component Specs      核心组件 CSS（从 demo HTML 提取）
   4.1 Buttons
   4.2 Cards
   4.3 Inputs
   4.4 Modals
   4.5 Navigation
5. Style Guidelines     风格说明 + 关键效果
6. Page Pattern         落地页模式 + 区块顺序
7. Anti-Patterns        禁止使用的设计模式
8. Pre-Delivery Checklist 交付前检查清单
```

---

## composables/useMasterMd.ts 实现规范

```typescript
import type { DesignSystem } from '~/types'

export function useMasterMd() {

  function generate(ds: DesignSystem, projectName: string): string {
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ')
    
    return [
      generateLogicHeader(),
      generateMeta(ds, projectName, timestamp),
      generateColorPalette(ds.colors),
      generateTypography(ds.typography),
      generateSpacing(),
      generateShadows(),
      generateComponentSpecs(ds.colors),
      generateStyleGuidelines(ds.style, ds.keyEffects),
      generatePagePattern(ds.pattern),
      generateAntiPatterns(ds.antiPatterns),
      generateChecklist()
    ].join('\n\n---\n\n')
  }

  function generateLogicHeader(): string {
    return `# Design System Master File

> **LOGIC:** When building a specific page, first check \`design-system/pages/[page-name].md\`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.`
  }

  function generateColorPalette(colors: DesignSystem['colors']): string {
    const entries = [
      ['Primary',     colors.primary,     '--color-primary'],
      ['On Primary',  colors.onPrimary,   '--color-on-primary'],
      ['Secondary',   colors.secondary,   '--color-secondary'],
      ['Accent/CTA',  colors.accent,      '--color-accent'],
      ['Background',  colors.background,  '--color-background'],
      ['Foreground',  colors.foreground,  '--color-foreground'],
      ['Muted',       colors.muted,       '--color-muted'],
      ['Border',      colors.border,      '--color-border'],
      ['Destructive', colors.destructive, '--color-destructive'],
      ['Ring',        colors.ring,        '--color-ring'],
    ].filter(([, val]) => val)

    const table = [
      '| Role | Hex | CSS Variable |',
      '|------|-----|--------------|',
      ...entries.map(([label, hex, cssVar]) => `| ${label} | \`${hex}\` | \`${cssVar}\` |`)
    ].join('\n')

    const cssVars = entries
      .map(([, hex, cssVar]) => `  ${cssVar}: ${hex};`)
      .join('\n')

    return `## Global Rules

### Color Palette

${table}

**CSS Variables:**
\`\`\`css
:root {
${cssVars}
}
\`\`\``
  }

  function generateTypography(typography: DesignSystem['typography']): string {
    return `### Typography

- **Heading Font:** ${typography.heading}
- **Body Font:** ${typography.body}
- **Mood:** ${typography.mood}
- **Google Fonts:** ${typography.googleFontsUrl}

**CSS Import:**
\`\`\`css
${typography.cssImport}
\`\`\``
  }

  function generateSpacing(): string {
    return `### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| \`--space-xs\` | \`4px\` | Tight gaps |
| \`--space-sm\` | \`8px\` | Icon gaps, inline |
| \`--space-md\` | \`16px\` | Standard padding |
| \`--space-lg\` | \`24px\` | Section padding |
| \`--space-xl\` | \`32px\` | Large gaps |
| \`--space-2xl\` | \`48px\` | Section margins |
| \`--space-3xl\` | \`64px\` | Hero padding |`
  }

  function generateShadows(): string {
    return `### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| \`--shadow-sm\` | \`0 1px 2px rgba(0,0,0,0.05)\` | Subtle lift |
| \`--shadow-md\` | \`0 4px 6px rgba(0,0,0,0.1)\` | Cards, buttons |
| \`--shadow-lg\` | \`0 10px 15px rgba(0,0,0,0.1)\` | Modals, dropdowns |
| \`--shadow-xl\` | \`0 20px 25px rgba(0,0,0,0.15)\` | Hero, featured cards |`
  }

  function generateComponentSpecs(colors: DesignSystem['colors']): string {
    return `## Component Specs

> 直接使用以下 CSS 实现，在此基础上扩展，不要重新实现核心样式。

### Buttons
\`\`\`css
.btn-primary {
  background: ${colors.accent || colors.primary};
  color: white;
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  border: none;
  cursor: pointer;
  transition: all 200ms ease;
}
.btn-primary:hover {
  opacity: 0.9;
  transform: translateY(-1px);
}
.btn-secondary {
  background: transparent;
  color: ${colors.primary};
  border: 2px solid ${colors.primary};
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  cursor: pointer;
  transition: all 200ms ease;
}
\`\`\`

### Cards
\`\`\`css
.card {
  background: ${colors.card || colors.background};
  border-radius: 12px;
  padding: 24px;
  border: 1px solid ${colors.border || 'rgba(0,0,0,0.08)'};
  box-shadow: var(--shadow-md);
  transition: all 200ms ease;
  cursor: pointer;
}
.card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-2px);
}
\`\`\`

### Inputs
\`\`\`css
.input {
  padding: 12px 16px;
  border: 1px solid ${colors.border || '#E2E8F0'};
  border-radius: 8px;
  font-size: 16px;
  width: 100%;
  transition: border-color 200ms ease;
  background: ${colors.background};
  color: ${colors.foreground};
}
.input:focus {
  border-color: ${colors.primary};
  outline: none;
  box-shadow: 0 0 0 3px ${colors.primary}20;
}
\`\`\`

### Modals
\`\`\`css
.modal-overlay {
  background: rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(4px);
  position: fixed;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal {
  background: ${colors.background};
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 500px;
  width: 90%;
}
\`\`\``
  }

  function generateAntiPatterns(antiPatterns: string): string {
    const items = antiPatterns
      ? antiPatterns.split('+').map(a => `- ❌ ${a.trim()}`).join('\n')
      : ''

    return `## Anti-Patterns (Do NOT Use)

${items}

- ❌ Emojis as icons — use SVG (Heroicons / Lucide)
- ❌ Missing cursor:pointer on clickable elements
- ❌ Layout-shifting hover effects
- ❌ Low contrast text (minimum 4.5:1)
- ❌ Instant state changes without transitions
- ❌ Invisible focus states`
  }

  function generateChecklist(): string {
    return `## Pre-Delivery Checklist

Before delivering any UI code, verify:

- [ ] No emojis used as icons (SVG only)
- [ ] All icons from consistent set (Heroicons / Lucide)
- [ ] \`cursor-pointer\` on all clickable elements
- [ ] Hover states with transitions (150-300ms)
- [ ] Light mode text contrast ≥ 4.5:1
- [ ] Focus states visible for keyboard navigation
- [ ] \`prefers-reduced-motion\` respected
- [ ] Responsive: 375px / 768px / 1024px / 1440px
- [ ] No content hidden behind fixed navbars
- [ ] No horizontal scroll on mobile

---

*Design data powered by [ui-ux-pro-max](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill)*`
  }

  function generateStyleGuidelines(
    style: DesignSystem['style'],
    keyEffects: string
  ): string {
    return `## Style Guidelines

**Style:** ${style.name}
**Type:** ${style.type}
**Keywords:** ${style.keywords}
**Best For:** ${style.bestFor}
**Performance:** ${style.performance}
**Accessibility:** ${style.accessibility}
**Key Effects:** ${keyEffects}`
  }

  function generatePagePattern(pattern: DesignSystem['pattern']): string {
    return `## Page Pattern

**Pattern:** ${pattern.name}
**Section Order:** ${pattern.sections}
**CTA Placement:** ${pattern.ctaPlacement}
**Conversion Strategy:** ${pattern.conversion}`
  }

  function generateMeta(
    ds: DesignSystem,
    projectName: string,
    timestamp: string
  ): string {
    return `**Project:** ${projectName}
**Generated:** ${timestamp}
**Style:** ${ds.style.name}
**Category:** ${ds.category}`
  }

  return { generate }
}
```

---

## 输出文件下载

```typescript
// 触发浏览器下载
function downloadMasterMd(content: string, projectName: string) {
  const blob = new Blob([content], { type: 'text/markdown;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = 'MASTER.md'
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}
```
