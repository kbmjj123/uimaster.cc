<template>
  <div class="howto-page">

    <!-- ── Hero ───────────────────────────────────────────────────────────── -->
    <div class="howto-hero">
      <h1 class="howto-h1">How to Use uimaster.cc</h1>
      <p class="howto-hero-desc">
        Three steps from style selection to a production-ready design system
        inside your AI coding tool — no configuration required.
      </p>

      <!-- Tool compatibility badges -->
      <div class="howto-tools" aria-label="Compatible AI coding tools">
        <span class="howto-tools-label">Works with</span>
        <div class="howto-tools-list">
          <div
            v-for="tool in tools"
            :key="tool.name"
            class="howto-tool-badge"
            :title="tool.name"
          >
            <!-- SVG icon inline per tool -->
            <component :is="tool.icon" class="howto-tool-icon" aria-hidden="true" />
            <span class="howto-tool-name">{{ tool.name }}</span>
          </div>
        </div>
      </div>
    </div>

    <!-- ── Step track ──────────────────────────────────────────────────────── -->
    <ol class="howto-steps" aria-label="How to use steps">

      <!-- ── Step 1 ──────────────────────────────────────────────────────── -->
      <li class="howto-step">
        <div class="howto-step-aside">
          <span class="howto-step-num" aria-hidden="true">1</span>
          <div class="howto-step-line" aria-hidden="true" />
        </div>

        <div class="howto-step-body">
          <h2 class="howto-step-title">Choose Your UI Style</h2>
          <p class="howto-step-desc">
            Browse 67 UI styles — from Glassmorphism to Brutalism — combined with
            161 product types. The live preview updates instantly as you select.
            Each combination has its own URL so you can bookmark or share it.
          </p>

          <!-- Demo placeholder: browser mockup of the selector UI -->
          <div class="howto-step-visual howto-step-visual--selector" aria-hidden="true">
            <div class="howto-mock-browser">
              <div class="howto-mock-browser-bar">
                <span class="howto-mock-dot" />
                <span class="howto-mock-dot" />
                <span class="howto-mock-dot" />
                <span class="howto-mock-url">uimaster.cc</span>
              </div>
              <div class="howto-mock-layout">
                <!-- Sidebar -->
                <div class="howto-mock-sidebar">
                  <div class="howto-mock-label">UI Style</div>
                  <div class="howto-mock-grid">
                    <div v-for="s in mockStyles" :key="s.name"
                         class="howto-mock-card"
                         :class="{ 'howto-mock-card--active': s.active }">
                      <div class="howto-mock-card-thumb" :style="{ background: s.color }" />
                      <span>{{ s.name }}</span>
                    </div>
                  </div>
                  <div class="howto-mock-label" style="margin-top:10px">Product Type</div>
                  <div class="howto-mock-input">Fintech Dashboard ›</div>
                </div>
                <!-- Preview area -->
                <div class="howto-mock-preview">
                  <div class="howto-mock-preview-inner">
                    <div class="howto-mock-preview-nav" />
                    <div class="howto-mock-preview-hero" />
                    <div class="howto-mock-preview-cards">
                      <div class="howto-mock-preview-card" />
                      <div class="howto-mock-preview-card" />
                      <div class="howto-mock-preview-card" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div class="howto-step-tip">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/>
              <path d="M7 5v3M7 9.5v.5" stroke="currentColor" stroke-width="1.3"
                    stroke-linecap="round"/>
            </svg>
            <span>
              Don't know which style to pick?
              <NuxtLink to="/compare/glassmorphism-vs-neumorphism">Compare styles</NuxtLink>
              side by side, or browse
              <NuxtLink to="/styles/glassmorphism">style detail pages</NuxtLink>
              for full specs.
            </span>
          </div>
        </div>
      </li>

      <!-- ── Step 2 ──────────────────────────────────────────────────────── -->
      <li class="howto-step">
        <div class="howto-step-aside">
          <span class="howto-step-num" aria-hidden="true">2</span>
          <div class="howto-step-line" aria-hidden="true" />
        </div>

        <div class="howto-step-body">
          <h2 class="howto-step-title">Download MASTER.md</h2>
          <p class="howto-step-desc">
            Click the <strong>Download MASTER.md</strong> button on any preview page.
            The file is generated client-side using BM25 search against the
            ui-ux-pro-max design data — no server required.
          </p>

          <!-- MASTER.md content preview -->
          <div class="howto-step-visual" aria-hidden="true">
            <div class="howto-code-window">
              <div class="howto-code-window-bar">
                <span class="howto-mock-dot" />
                <span class="howto-mock-dot" />
                <span class="howto-mock-dot" />
                <span class="howto-code-filename">MASTER.md</span>
              </div>
              <pre class="howto-code-pre"><code>{{ masterMdPreview }}</code></pre>
            </div>
          </div>

          <!-- What's inside -->
          <div class="howto-includes-grid">
            <div v-for="inc in masterIncludes" :key="inc.title" class="howto-include-item">
              <span class="howto-include-icon" aria-hidden="true">{{ inc.icon }}</span>
              <div>
                <strong class="howto-include-title">{{ inc.title }}</strong>
                <p class="howto-include-desc">{{ inc.desc }}</p>
              </div>
            </div>
          </div>
        </div>
      </li>

      <!-- ── Step 3 ──────────────────────────────────────────────────────── -->
      <li class="howto-step howto-step--last">
        <div class="howto-step-aside">
          <span class="howto-step-num howto-step-num--done" aria-hidden="true">✓</span>
        </div>

        <div class="howto-step-body">
          <h2 class="howto-step-title">Add to Your Project</h2>
          <p class="howto-step-desc">
            Place <code>MASTER.md</code> in your project root. Your AI coding tool
            will automatically discover and apply the design rules to every
            component it generates.
          </p>

          <!-- Per-tool instructions -->
          <div class="howto-tools-tabs">
            <div class="howto-tabs-nav" role="tablist" aria-label="Tool instructions">
              <button
                v-for="tool in tools"
                :key="tool.name"
                class="howto-tab-btn"
                :class="{ 'howto-tab-btn--active': activeTab === tool.name }"
                role="tab"
                :aria-selected="activeTab === tool.name"
                :aria-controls="`tab-panel-${tool.name}`"
                @click="activeTab = tool.name"
              >
                <component :is="tool.icon" class="howto-tab-icon" aria-hidden="true" />
                {{ tool.name }}
              </button>
            </div>

            <div
              v-for="tool in tools"
              :key="tool.name"
              :id="`tab-panel-${tool.name}`"
              class="howto-tab-panel"
              :class="{ 'howto-tab-panel--active': activeTab === tool.name }"
              role="tabpanel"
              :aria-labelledby="tool.name"
            >
              <div class="howto-code-window">
                <div class="howto-code-window-bar">
                  <span class="howto-mock-dot" />
                  <span class="howto-mock-dot" />
                  <span class="howto-mock-dot" />
                  <span class="howto-code-filename">
                    {{ tool.name === 'Claude Code' ? 'Terminal' : tool.configFile }}
                  </span>
                </div>
                <pre class="howto-code-pre howto-code-pre--shell"><code>{{ tool.instruction }}</code></pre>
              </div>
              <p class="howto-tab-note">{{ tool.note }}</p>
            </div>
          </div>

          <!-- Project structure -->
          <div class="howto-step-visual" aria-hidden="true">
            <div class="howto-code-window">
              <div class="howto-code-window-bar">
                <span class="howto-mock-dot" />
                <span class="howto-mock-dot" />
                <span class="howto-mock-dot" />
                <span class="howto-code-filename">Project structure</span>
              </div>
              <pre class="howto-code-pre"><code>{{ projectStructure }}</code></pre>
            </div>
          </div>

          <div class="howto-step-tip">
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
              <circle cx="7" cy="7" r="6" stroke="currentColor" stroke-width="1.3"/>
              <path d="M7 5v3M7 9.5v.5" stroke="currentColor" stroke-width="1.3"
                    stroke-linecap="round"/>
            </svg>
            <span>
              Need page-specific overrides? Create
              <code>design-system/pages/[page-name].md</code> —
              page rules take priority over <code>MASTER.md</code> per the Logic Header.
            </span>
          </div>
        </div>
      </li>

    </ol>

    <!-- ── FAQ ────────────────────────────────────────────────────────────── -->
    <section class="howto-section" aria-labelledby="faq-heading">
      <h2 id="faq-heading" class="howto-h2">Frequently Asked Questions</h2>
      <dl class="howto-faq">
        <div v-for="faq in faqs" :key="faq.q" class="howto-faq-item">
          <dt class="howto-faq-q">{{ faq.q }}</dt>
          <dd class="howto-faq-a">{{ faq.a }}</dd>
        </div>
      </dl>
    </section>

    <!-- ── Contributing CTA ───────────────────────────────────────────────── -->
    <section class="howto-contribute" aria-labelledby="contribute-heading">
      <div class="howto-contribute-inner">
        <h2 id="contribute-heading" class="howto-contribute-title">
          Want to Contribute a Demo?
        </h2>
        <p class="howto-contribute-desc">
          Submit a demo HTML file via GitHub PR and earn a permanent
          <strong>do-follow backlink</strong> on the preview page — great for
          personal branding and SEO.
        </p>
        <div class="howto-contribute-actions">
          <a
            href="https://github.com/uimaster-cc/uimaster/blob/main/CONTRIBUTING.md"
            target="_blank"
            rel="noopener noreferrer"
            class="howto-contribute-btn howto-contribute-btn--primary"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
                 aria-hidden="true">
              <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839
                       9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703
                       -2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466
                       -1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032
                       1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088
                       .636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988
                       1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75
                       1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337
                       1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1
                       2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566
                       4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747
                       0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484
                       17.522 2 12 2z"/>
            </svg>
            Read CONTRIBUTING.md
          </a>
          <a
            href="https://github.com/uimaster-cc/uimaster"
            target="_blank"
            rel="noopener noreferrer"
            class="howto-contribute-btn howto-contribute-btn--secondary"
          >
            View on GitHub ↗
          </a>
        </div>
      </div>
    </section>

  </div>
</template>

<script setup lang="ts">
import { defineComponent, h } from 'vue'

// ── Tool icon components (inline SVG, no external deps) ───────────────────────

const ClaudeIcon = defineComponent({
  render: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none' }, [
    h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 4, fill: '#CC785C' }),
    h('path', { d: 'M8 16l4-8 4 8M9.5 13h5', stroke: '#fff', 'stroke-width': 1.6,
                'stroke-linecap': 'round', 'stroke-linejoin': 'round' }),
  ]),
})

const CursorIcon = defineComponent({
  render: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none' }, [
    h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 4, fill: '#1D1D1F' }),
    h('path', { d: 'M8 6l8 6-8 6V6z', fill: '#fff' }),
  ]),
})

const WindsurfIcon = defineComponent({
  render: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none' }, [
    h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 4, fill: '#7C3AED' }),
    h('path', { d: 'M7 17C9 11 14 8 17 7M7 17c3-2 7-2 10-1', stroke: '#fff',
                'stroke-width': 1.8, 'stroke-linecap': 'round' }),
  ]),
})

const CopilotIcon = defineComponent({
  render: () => h('svg', { width: 16, height: 16, viewBox: '0 0 24 24', fill: 'none' }, [
    h('rect', { x: 3, y: 3, width: 18, height: 18, rx: 4, fill: '#24A47F' }),
    h('circle', { cx: 9, cy: 10, r: 2, fill: '#fff' }),
    h('circle', { cx: 15, cy: 10, r: 2, fill: '#fff' }),
    h('path', { d: 'M9 15c1 1.5 5 1.5 6 0', stroke: '#fff', 'stroke-width': 1.5,
                'stroke-linecap': 'round' }),
  ]),
})

// ── Tool data ─────────────────────────────────────────────────────────────────

const tools = [
  {
    name: 'Claude Code',
    icon: ClaudeIcon,
    configFile: '.claude/CLAUDE.md',
    instruction: `# Place MASTER.md in project root, then start Claude Code:
$ claude

# Claude Code auto-reads MASTER.md as a design rule file.
# Every component it generates will follow your chosen style.

# Optional: reference it explicitly in your prompt:
> "Build a login page following the design system in MASTER.md"`,
    note: 'Claude Code reads MASTER.md automatically via its rules discovery system. No extra configuration needed.',
  },
  {
    name: 'Cursor',
    icon: CursorIcon,
    configFile: '.cursorrules',
    instruction: `# Option A — place MASTER.md in project root (Cursor reads it automatically)
cp MASTER.md ./MASTER.md

# Option B — reference it in .cursorrules
echo "@MASTER.md" >> .cursorrules

# Then open Cursor and prompt as usual:
# "Create a dashboard card following MASTER.md design system"`,
    note: 'Cursor picks up MASTER.md from the project root or via @MASTER.md reference in .cursorrules.',
  },
  {
    name: 'Windsurf',
    icon: WindsurfIcon,
    configFile: '.windsurfrules',
    instruction: `# Place MASTER.md in project root:
cp MASTER.md ./MASTER.md

# Reference in .windsurfrules (optional, for explicit loading):
echo "Follow the design system defined in MASTER.md" >> .windsurfrules

# Windsurf Cascade will use MASTER.md for all UI generation tasks.`,
    note: 'Windsurf Cascade automatically considers MASTER.md in context. Use .windsurfrules for explicit instruction.',
  },
  {
    name: 'Copilot',
    icon: CopilotIcon,
    configFile: '.github/copilot-instructions.md',
    instruction: `# Place MASTER.md in project root, then add to copilot-instructions:
mkdir -p .github
cat >> .github/copilot-instructions.md << 'EOF'
Follow the design system defined in MASTER.md for all UI components.
Use the CSS variables and component patterns from that file.
EOF

# GitHub Copilot will apply the design rules in suggestion context.`,
    note: 'GitHub Copilot reads .github/copilot-instructions.md as workspace-level instructions, applying your design system to every suggestion.',
  },
]

const activeTab = ref('Claude Code')

// ── Static content ────────────────────────────────────────────────────────────

const mockStyles = [
  { name: 'Glass', color: 'linear-gradient(135deg,#667eea,#764ba2)', active: true },
  { name: 'Neumorphism', color: '#e0e5ec', active: false },
  { name: 'Brutalism', color: '#f5c542', active: false },
  { name: 'Minimal', color: '#f8f9fa', active: false },
]

const masterMdPreview = `# Design System Master File

> LOGIC: When building a specific page, first check
> \`design-system/pages/[page-name].md\`. If that file
> exists, its rules override this Master file.

**Project:** Glassmorphism Fintech Dashboard
**Style:** Glassmorphism  |  **Category:** Fintech Dashboard

---

### Color Palette

| Role       | Hex       | CSS Variable          |
|------------|-----------|-----------------------|
| Primary    | \`#0A0E27\` | \`--color-primary\`   |
| Accent/CTA | \`#4F8EF7\` | \`--color-accent\`    |
| Background | \`#050816\` | \`--color-background\`|
| Foreground | \`#F0F4FF\` | \`--color-foreground\`|

### Component Specs

\`\`\`css
.btn-primary {
  background: #4F8EF7;
  backdrop-filter: blur(20px);
  border: 1px solid rgba(255,255,255,0.15);
}
\`\`\``

const projectStructure = `your-project/
├── MASTER.md               ← design system rules
├── design-system/
│   └── pages/
│       ├── dashboard.md    ← page-specific overrides
│       └── landing.md
├── src/
│   └── components/
└── ...`

const masterIncludes = [
  { icon: '🎨', title: 'Color Palette', desc: '10 CSS tokens with hex values and usage notes' },
  { icon: '✍️', title: 'Typography', desc: 'Heading + body font pairing with Google Fonts import' },
  { icon: '📐', title: 'Spacing Scale', desc: '7-step spacing variable system' },
  { icon: '🧩', title: 'Component CSS', desc: 'Buttons, cards, inputs, modals — copy-paste ready' },
  { icon: '🚫', title: 'Anti-Patterns', desc: 'Explicit list of what NOT to generate' },
  { icon: '✅', title: 'Checklist', desc: '10-point pre-delivery quality checklist' },
]

const faqs = [
  {
    q: 'Does MASTER.md work without an AI coding tool?',
    a: 'Yes. It\'s a plain Markdown file with CSS code blocks — you can read it yourself and apply the design system manually, or paste it into any AI chat for guidance.',
  },
  {
    q: 'Will the generated UI match the preview exactly?',
    a: 'The preview demo is an official reference implementation. Your AI tool will follow the same design tokens and component patterns, but the exact output depends on your prompting and the tool\'s generation quality.',
  },
  {
    q: 'Can I customise MASTER.md after downloading?',
    a: 'Absolutely. It\'s your file. Swap hex values, change fonts, or add your own component specs. The Logic Header section explains how page-level files can override the master.',
  },
  {
    q: 'Does it work with Tailwind CSS projects?',
    a: 'Yes. The typography section includes Tailwind config snippets for the font pairing. Color tokens can be mapped to your tailwind.config.js theme.extend.colors object.',
  },
  {
    q: 'How is MASTER.md generated?',
    a: 'We run a JavaScript implementation of BM25 search (matching the official Python core.py) against the ui-ux-pro-max dataset to select the best-matching style, color palette, and typography for your chosen combination. Everything happens in your browser — no data is sent to a server.',
  },
]

// ── SEO ───────────────────────────────────────────────────────────────────────
useHead({
  title: 'How to Use uimaster.cc — MASTER.md Setup Guide | uimaster.cc',
  meta: [
    {
      name: 'description',
      content:
        'Three steps to use uimaster.cc: choose a UI style, download MASTER.md, and add it to Claude Code, Cursor, Windsurf, or GitHub Copilot. Full setup guide with code examples.',
    },
    {
      name: 'keywords',
      content:
        'MASTER.md setup, Claude Code design system, Cursor UI style, Windsurf design rules, AI coding UI, how to use uimaster, design system generator guide',
    },
    { property: 'og:type',        content: 'article' },
    { property: 'og:title',       content: 'How to Use uimaster.cc — MASTER.md Setup Guide' },
    { property: 'og:description', content: 'Three steps to set up your AI coding design system.' },
    { property: 'og:url',         content: 'https://uimaster.cc/how-to-use' },
    { property: 'og:image',       content: 'https://uimaster.cc/og-default.png' },
    { name: 'twitter:card',       content: 'summary_large_image' },
  ],
  link: [{ rel: 'canonical', href: 'https://uimaster.cc/how-to-use' }],
  script: [{
    type: 'application/ld+json',
    children: JSON.stringify({
      '@context': 'https://schema.org',
      '@type': 'HowTo',
      name: 'How to Use uimaster.cc',
      description: 'Three steps to get a production-ready design system into your AI coding tool.',
      url: 'https://uimaster.cc/how-to-use',
      step: [
        { '@type': 'HowToStep', name: 'Choose Your UI Style',
          text: 'Browse 67 UI styles and 161 product types on the home page and select a combination.' },
        { '@type': 'HowToStep', name: 'Download MASTER.md',
          text: 'Click Download MASTER.md on any preview page to get a complete design system file.' },
        { '@type': 'HowToStep', name: 'Add to Your Project',
          text: 'Place MASTER.md in your project root. Claude Code, Cursor, Windsurf, and Copilot will auto-apply it.' },
      ],
    }),
  }],
})
</script>

<style scoped>
/* ── Page ─────────────────────────────────────────────────────────────────── */
.howto-page {
  max-width: 820px;
  margin: 0 auto;
  padding: 40px 24px 80px;
}

/* ── Hero ─────────────────────────────────────────────────────────────────── */
.howto-hero {
  margin-bottom: 56px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.howto-h1 {
  font-size: 34px;
  font-weight: 700;
  letter-spacing: -0.6px;
  color: var(--color-primary, #1D1D1F);
  margin: 0;
  line-height: 1.15;
}

.howto-hero-desc {
  font-size: 16px;
  color: var(--color-text-muted, #6B7280);
  line-height: 1.65;
  margin: 0;
  max-width: 560px;
}

/* Tool badges */
.howto-tools {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.howto-tools-label {
  font-size: 12px;
  color: var(--color-text-muted, #6B7280);
  white-space: nowrap;
}

.howto-tools-list {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.howto-tool-badge {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 5px 12px;
  background: var(--color-surface, #fff);
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text, #111827);
}

.howto-tool-icon {
  flex-shrink: 0;
  border-radius: 4px;
}

/* ── Steps list ───────────────────────────────────────────────────────────── */
.howto-steps {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  gap: 0;
}

.howto-step {
  display: grid;
  grid-template-columns: 48px 1fr;
  gap: 0 24px;
  padding-bottom: 60px;
}

.howto-step--last { padding-bottom: 0; }

/* Left aside: number + vertical line */
.howto-step-aside {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0;
}

.howto-step-num {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background: var(--color-primary, #1D1D1F);
  color: #fff;
  font-size: 16px;
  font-weight: 700;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  z-index: 1;
}

.howto-step-num--done {
  background: #16a34a;
  font-size: 18px;
}

.howto-step-line {
  flex: 1;
  width: 2px;
  background: var(--color-border, #E5E7EB);
  margin-top: 8px;
  border-radius: 1px;
}

/* Step content */
.howto-step-body {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding-top: 8px;
}

.howto-step-title {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--color-primary, #1D1D1F);
  margin: 0;
}

.howto-step-desc {
  font-size: 15px;
  color: var(--color-text-muted, #6B7280);
  line-height: 1.7;
  margin: 0;
}

.howto-step-desc strong { color: var(--color-text, #111827); }

/* Tip callout */
.howto-step-tip {
  display: flex;
  align-items: flex-start;
  gap: 8px;
  padding: 12px 14px;
  background: #EFF6FF;
  border: 1px solid #BFDBFE;
  border-radius: 8px;
  font-size: 13px;
  color: #1E40AF;
  line-height: 1.5;
}

.howto-step-tip svg { flex-shrink: 0; margin-top: 1px; }

.howto-step-tip a { color: inherit; font-weight: 600; }
.howto-step-tip a:hover { text-decoration: underline; }

.howto-step-tip code {
  font-family: var(--font-mono, monospace);
  font-size: 12px;
  background: rgba(30, 64, 175, 0.1);
  padding: 1px 4px;
  border-radius: 3px;
}

/* ── Browser mockup ───────────────────────────────────────────────────────── */
.howto-step-visual {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border, #E5E7EB);
  background: var(--color-surface, #fff);
}

.howto-mock-browser {
  display: flex;
  flex-direction: column;
}

.howto-mock-browser-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: var(--color-bg, #F8F9FA);
  border-bottom: 1px solid var(--color-border, #E5E7EB);
}

.howto-mock-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background: var(--color-border, #E5E7EB);
  display: inline-block;
}

.howto-mock-url {
  font-size: 11px;
  color: var(--color-text-muted, #6B7280);
  margin-left: 8px;
  font-family: var(--font-mono, monospace);
}

.howto-mock-layout {
  display: flex;
  height: 240px;
}

.howto-mock-sidebar {
  width: 140px;
  border-right: 1px solid var(--color-border, #E5E7EB);
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
  flex-shrink: 0;
}

.howto-mock-label {
  font-size: 9px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.08em;
  color: var(--color-text-muted, #6B7280);
}

.howto-mock-grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4px;
}

.howto-mock-card {
  border: 1.5px solid var(--color-border, #E5E7EB);
  border-radius: 5px;
  padding: 5px;
  font-size: 9px;
  color: var(--color-text-muted, #6B7280);
  display: flex;
  flex-direction: column;
  gap: 3px;
  cursor: default;
}

.howto-mock-card--active {
  border-color: var(--color-primary, #1D1D1F);
  background: var(--color-bg, #F8F9FA);
}

.howto-mock-card-thumb {
  width: 100%;
  height: 22px;
  border-radius: 3px;
}

.howto-mock-input {
  font-size: 9px;
  padding: 5px 7px;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 4px;
  color: var(--color-text, #111827);
  background: var(--color-surface, #fff);
}

.howto-mock-preview {
  flex: 1;
  padding: 12px;
  background: var(--color-bg, #F8F9FA);
  display: flex;
}

.howto-mock-preview-inner {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 8px;
  background: var(--color-primary, #1D1D1F);
  border-radius: 6px;
  padding: 10px;
}

.howto-mock-preview-nav {
  height: 12px;
  background: rgba(255,255,255,0.1);
  border-radius: 3px;
}

.howto-mock-preview-hero {
  height: 60px;
  background: linear-gradient(135deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03));
  border-radius: 4px;
  border: 1px solid rgba(255,255,255,0.1);
}

.howto-mock-preview-cards {
  display: flex;
  gap: 6px;
  flex: 1;
}

.howto-mock-preview-card {
  flex: 1;
  background: rgba(255,255,255,0.06);
  border: 1px solid rgba(255,255,255,0.08);
  border-radius: 4px;
}

/* ── Code window ──────────────────────────────────────────────────────────── */
.howto-code-window {
  border-radius: 10px;
  overflow: hidden;
  border: 1px solid var(--color-border, #E5E7EB);
}

.howto-code-window-bar {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 10px 14px;
  background: #1D1D1F;
}

.howto-code-filename {
  font-size: 11px;
  color: rgba(255,255,255,0.4);
  font-family: var(--font-mono, monospace);
  margin-left: 8px;
}

.howto-code-pre {
  margin: 0;
  padding: 20px;
  background: #111827;
  overflow-x: auto;
  font-size: 12px;
  line-height: 1.7;
  color: #E5E7EB;
  font-family: var(--font-mono, 'Fira Code', 'SF Mono', monospace);
  white-space: pre;
}

.howto-code-pre--shell {
  color: #9CA3AF;
}

.howto-code-pre code { background: none; padding: 0; font-size: inherit; color: inherit; }

/* ── Includes grid ────────────────────────────────────────────────────────── */
.howto-includes-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 12px;
}

.howto-include-item {
  display: flex;
  align-items: flex-start;
  gap: 10px;
  padding: 12px 14px;
  background: var(--color-surface, #fff);
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 8px;
}

.howto-include-icon { font-size: 18px; flex-shrink: 0; }

.howto-include-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text, #111827);
  display: block;
  margin-bottom: 2px;
}

.howto-include-desc {
  font-size: 12px;
  color: var(--color-text-muted, #6B7280);
  margin: 0;
  line-height: 1.5;
}

/* ── Tool tabs ────────────────────────────────────────────────────────────── */
.howto-tools-tabs {
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
  overflow: hidden;
}

.howto-tabs-nav {
  display: flex;
  background: var(--color-bg, #F8F9FA);
  border-bottom: 1px solid var(--color-border, #E5E7EB);
  overflow-x: auto;
}

.howto-tab-btn {
  display: flex;
  align-items: center;
  gap: 7px;
  padding: 10px 16px;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted, #6B7280);
  cursor: pointer;
  white-space: nowrap;
  font-family: inherit;
  transition: color 150ms ease, border-color 150ms ease;
  margin-bottom: -1px;
}

.howto-tab-btn:hover { color: var(--color-text, #111827); }

.howto-tab-btn--active {
  color: var(--color-primary, #1D1D1F);
  border-bottom-color: var(--color-primary, #1D1D1F);
  background: var(--color-surface, #fff);
}

.howto-tab-icon { border-radius: 3px; flex-shrink: 0; }

.howto-tab-panel { display: none; }
.howto-tab-panel--active { display: block; }

.howto-tab-panel .howto-code-window { border: none; border-radius: 0; }
.howto-tab-panel .howto-code-window-bar { border-radius: 0; }

.howto-tab-note {
  font-size: 12px;
  color: var(--color-text-muted, #6B7280);
  padding: 10px 16px;
  margin: 0;
  background: var(--color-bg, #F8F9FA);
  border-top: 1px solid var(--color-border, #E5E7EB);
  line-height: 1.5;
}

/* ── Sections ─────────────────────────────────────────────────────────────── */
.howto-section { margin: 60px 0; }

.howto-h2 {
  font-size: 22px;
  font-weight: 700;
  letter-spacing: -0.3px;
  color: var(--color-primary, #1D1D1F);
  margin: 0 0 24px;
}

/* ── FAQ ──────────────────────────────────────────────────────────────────── */
.howto-faq {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: 10px;
  overflow: hidden;
}

.howto-faq-item {
  padding: 18px 22px;
  border-bottom: 1px solid var(--color-border, #E5E7EB);
}

.howto-faq-item:last-child { border-bottom: none; }

.howto-faq-q {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text, #111827);
  margin: 0 0 6px;
}

.howto-faq-a {
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  line-height: 1.65;
  margin: 0;
}

/* ── Contributing CTA ─────────────────────────────────────────────────────── */
.howto-contribute {
  margin-top: 60px;
  background: var(--color-primary, #1D1D1F);
  border-radius: 16px;
  overflow: hidden;
}

.howto-contribute-inner {
  padding: 40px 44px;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.howto-contribute-title {
  font-size: 22px;
  font-weight: 700;
  color: #fff;
  margin: 0;
}

.howto-contribute-desc {
  font-size: 14px;
  color: rgba(255,255,255,0.65);
  line-height: 1.65;
  margin: 0;
  max-width: 480px;
}

.howto-contribute-desc strong { color: rgba(255,255,255,0.9); }

.howto-contribute-actions {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  margin-top: 8px;
}

.howto-contribute-btn {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  text-decoration: none;
  transition: opacity 150ms ease, transform 150ms ease;
}

.howto-contribute-btn:hover { opacity: 0.88; transform: translateY(-1px); }

.howto-contribute-btn--primary {
  background: #fff;
  color: var(--color-primary, #1D1D1F);
}

.howto-contribute-btn--secondary {
  background: transparent;
  color: rgba(255,255,255,0.75);
  border: 1.5px solid rgba(255,255,255,0.2);
}

.howto-contribute-btn--secondary:hover { color: #fff; border-color: rgba(255,255,255,0.5); opacity: 1; }

/* ── Responsive ───────────────────────────────────────────────────────────── */
@media (max-width: 767px) {
  .howto-page { padding: 20px 16px 80px; }

  .howto-h1 { font-size: 24px; }

  .howto-step { grid-template-columns: 36px 1fr; gap: 0 16px; }

  .howto-step-num { width: 32px; height: 32px; font-size: 14px; }

  .howto-step-title { font-size: 18px; }

  .howto-mock-layout { height: 180px; }

  .howto-mock-sidebar { width: 110px; }

  .howto-includes-grid { grid-template-columns: 1fr; }

  .howto-contribute-inner { padding: 28px 24px; }

  .howto-contribute-title { font-size: 18px; }
}
</style>