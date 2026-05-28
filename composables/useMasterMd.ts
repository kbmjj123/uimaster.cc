// composables/useMasterMd.ts
// uimaster.cc — MASTER.md Generator
//
// Implements the EXACT structure from master-md.md spec (fixed order):
//   1. Logic Header
//   2. 项目元信息 (Meta)
//   3. Global Rules
//      3.1 Color Palette  (table + CSS vars)
//      3.2 Typography
//      3.3 Spacing
//      3.4 Shadows
//   4. Component Specs (Buttons / Cards / Inputs / Modals)
//   5. Style Guidelines
//   6. Page Pattern
//   7. Anti-Patterns
//   8. Pre-Delivery Checklist
//
// Sections are joined with '\n\n---\n\n' exactly as the spec shows.

import type { DesignSystem, UseMasterMdReturn } from '~/types/design-system'

export function useMasterMd(): UseMasterMdReturn {

  // ── Public API ─────────────────────────────────────────────────────────────

  function generate(ds: DesignSystem, projectName?: string): string {
    const name = projectName || ds.projectName || 'My Project'
    const timestamp = new Date().toISOString().slice(0, 19).replace('T', ' ')

    return [
      generateLogicHeader(),
      generateMeta(ds, name, timestamp),
      generateColorPalette(ds.colors),
      generateTypography(ds.typography),
      generateSpacing(),
      generateShadows(),
      generateComponentSpecs(ds.colors),
      generateStyleGuidelines(ds.style, ds.keyEffects),
      generatePagePattern(ds.pattern),
      generateAntiPatterns(ds.antiPatterns),
      generateChecklist(),
    ].join('\n\n---\n\n')
  }

  return { generate }
}

// ── Section generators (private) ───────────────────────────────────────────

function generateLogicHeader(): string {
  return `# Design System Master File

> **LOGIC:** When building a specific page, first check \`design-system/pages/[page-name].md\`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.`
}

function generateMeta(
  ds: DesignSystem,
  projectName: string,
  timestamp: string,
): string {
  return `**Project:** ${projectName}
**Generated:** ${timestamp}
**Style:** ${ds.style.name}
**Category:** ${ds.category}`
}

function generateColorPalette(colors: DesignSystem['colors']): string {
  // Only include tokens that have a non-empty value
  const entries: Array<[string, string, string]> = [
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
  ].filter((e): e is [string, string, string] => Boolean(e[1]))

  const table = [
    '| Role | Hex | CSS Variable |',
    '|------|-----|--------------|',
    ...entries.map(([label, hex, cssVar]) => `| ${label} | \`${hex}\` | \`${cssVar}\` |`),
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
${typography.cssImport || `@import url('https://fonts.googleapis.com/css2?family=${encodeURIComponent(typography.heading)}:wght@400;600;700&family=${encodeURIComponent(typography.body)}:wght@400;500&display=swap');`}
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
  // card background: prefer colors.card if it exists, else colors.background
  const cardBg = (colors as Record<string, string>)['card'] || colors.background
  const borderColor = colors.border || 'rgba(0,0,0,0.08)'
  const inputBorder = colors.border || '#E2E8F0'
  const ctaColor = colors.accent || colors.primary

  return `## Component Specs

> 直接使用以下 CSS 实现，在此基础上扩展，不要重新实现核心样式。

### Buttons
\`\`\`css
.btn-primary {
  background: ${ctaColor};
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
  background: ${cardBg};
  border-radius: 12px;
  padding: 24px;
  border: 1px solid ${borderColor};
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
  border: 1px solid ${inputBorder};
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

function generateStyleGuidelines(
  style: DesignSystem['style'],
  keyEffects: string,
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

function generateAntiPatterns(antiPatterns: string): string {
  // Official spec: anti-patterns are '+'-delimited in the raw data
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
