// types/design-system.ts
// uimaster.cc — Core TypeScript types, aligned with data-model.md

// ─── Raw JSON data shapes (matching official CSV column names) ───────────────

export interface RawStyle {
  'Style Category': string
  'Type': string
  'Keywords': string
  'Primary Colors': string
  'Effects/Animation': string
  'Best For': string
  'Light Mode': string
  'Dark Mode': string
  'Performance': string
  'Accessibility': string
  'AI Prompt Keywords': string
  'CSS Keywords': string
  'Implementation Checklist': string
  'Design System Variables': string
}

export interface RawProduct {
  'Product Type': string
  'Keywords': string
  'Primary Style Recommendation': string
  'Secondary Styles': string
  'Landing Page Pattern': string
  'Dashboard Style': string
  'Color Palette Focus': string
}

export interface RawColorPalette {
  'Product Type': string
  'primary': string
  'on-primary': string
  'secondary': string
  'on-secondary': string
  'accent': string
  'on-accent': string
  'background': string
  'foreground': string
  'card': string
  'card-foreground': string
  'muted': string
  'muted-foreground': string
  'border': string
  'destructive': string
  'on-destructive': string
  'ring': string
  'Notes': string
}

export interface RawTypography {
  'Pairing Name': string
  'Category': string
  'Heading Font': string
  'Body Font': string
  'Mood Keywords': string
  'Best For': string
  'Google Fonts URL': string
  'CSS Import': string
  'Tailwind Config': string
  'Notes': string
}

export interface RawLanding {
  'Pattern Name': string
  'Sections': string
  'CTA Placement': string
  'Color Strategy': string
  'Conversion': string
  'Best For': string
}

export interface RawUiReasoning {
  'If': string
  'Then Style': string
  'Then Color': string
  'Then Typography': string
  'Severity': string
  'Decision Rules': string
}

// ─── Normalised domain objects ────────────────────────────────────────────────

export interface Style {
  slug: string
  name: string
  type: string
  keywords: string
  primaryColors: string
  effectsAnimation: string
  bestFor: string
  lightMode: string
  darkMode: string
  performance: string
  accessibility: string
  aiPromptKeywords: string
  cssKeywords: string
  implementationChecklist: string
  designSystemVariables: string
}

export interface Product {
  slug: string
  name: string
  keywords: string
  primaryStyleRecommendation: string
  secondaryStyles: string
  landingPagePattern: string
  dashboardStyle: string
  colorPaletteFocus: string
}

export interface ColorPalette {
  productType: string
  primary: string
  onPrimary: string
  secondary: string
  onSecondary: string
  accent: string
  onAccent: string
  background: string
  foreground: string
  card: string
  cardForeground: string
  muted: string
  mutedForeground: string
  border: string
  destructive: string
  onDestructive: string
  ring: string
  notes: string
}

export interface Typography {
  pairingName: string
  category: string
  headingFont: string
  bodyFont: string
  moodKeywords: string
  bestFor: string
  googleFontsUrl: string
  cssImport: string
  tailwindConfig: string
  notes: string
}

export interface LandingPattern {
  patternName: string
  sections: string
  ctaPlacement: string
  colorStrategy: string
  conversion: string
  bestFor: string
}

// ─── Design System output (result of multi-domain BM25 search) ───────────────

export interface DesignSystem {
  projectName: string
  category: string
  pattern: {
    name: string
    sections: string
    ctaPlacement: string
    colorStrategy: string
    conversion: string
  }
  style: {
    name: string
    type: string
    effects: string
    keywords: string
    bestFor: string
    performance: string
    accessibility: string
    lightMode: string
    darkMode: string
  }
  colors: {
    primary: string
    onPrimary: string
    secondary: string
    accent: string
    background: string
    foreground: string
    muted: string
    border: string
    destructive: string
    ring: string
    notes: string
    cta: string
    text: string
  }
  typography: {
    heading: string
    body: string
    mood: string
    bestFor: string
    googleFontsUrl: string
    cssImport: string
  }
  keyEffects: string
  antiPatterns: string
  decisionRules: Record<string, unknown>
  severity: string
}

// ─── Demo metadata ────────────────────────────────────────────────────────────

export interface DemoMeta {
  slug: string
  style: string
  product: string
  source: 'official' | 'community'
  colors: {
    primary: string
    secondary: string
    accent: string
    background: string
  }
  fonts: {
    heading: string
    body: string
  }
  tags: string[]
  cover_url?: string
  cover_static_url?: string
  contributor?: {
    name: string
    url: string
    github: string
  }
}

// ─── BM25 internals ──────────────────────────────────────────────────────────

export interface BM25Index {
  corpus: string[][]
  docLengths: number[]
  avgdl: number
  idf: Record<string, number>
  docFreqs: Record<string, number>
  N: number
}

export type ScoredResult = [index: number, score: number]

// ─── Composable return types ──────────────────────────────────────────────────

export interface UseBM25Return {
  tokenize: (text: string) => string[]
  fit: (documents: string[]) => BM25Index
  score: (index: BM25Index, query: string) => ScoredResult[]
}

export interface UseDesignSystemReturn {
  generateDesignSystem: (query: string, projectName?: string) => Promise<DesignSystem | null>
  isLoading: Ref<boolean>
  error: Ref<string | null>
}

export interface UseMasterMdReturn {
  generate: (designSystem: DesignSystem, projectName?: string) => string
}
