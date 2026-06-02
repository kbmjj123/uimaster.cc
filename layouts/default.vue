<template>
  <div class="layout">
    <!-- Top Navigation -->
    <AppNavbar />

    <!-- Page Content -->
    <main class="layout-main">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="layout-footer">
      <div class="layout-footer-inner">
        <div class="layout-footer-brand">
          <span class="layout-footer-logo">✦ uimaster.cc</span>
          <p class="layout-footer-tagline">
            UI Style Preview &amp; Design System Generator
          </p>
        </div>

        <nav class="layout-footer-nav" aria-label="Footer navigation">
          <div class="layout-footer-nav-group">
            <span class="layout-footer-nav-label">Design System</span>
            <NuxtLink to="/" class="layout-footer-link">Preview</NuxtLink>
            <NuxtLink to="/compare" class="layout-footer-link">Compare</NuxtLink>
            <NuxtLink to="/how-to-use" class="layout-footer-link">How to Use</NuxtLink>
          </div>
          <div class="layout-footer-nav-group">
            <span class="layout-footer-nav-label">Community</span>
            <a
              href="https://github.com/uimaster-cc/uimaster"
              target="_blank"
              rel="noopener noreferrer"
              class="layout-footer-link"
            >GitHub</a>
            <a
              href="https://github.com/uimaster-cc/uimaster/blob/main/CONTRIBUTING.md"
              target="_blank"
              rel="noopener noreferrer"
              class="layout-footer-link"
            >Contributing</a>
          </div>
        </nav>
      </div>

      <!-- Footer bottom bar -->
      <div class="layout-footer-bottom">
        <p class="layout-footer-attribution">
          Design data powered by
          <a
            href="https://github.com/ui-ux-pro-max/ui-ux-pro-max"
            target="_blank"
            rel="noopener noreferrer"
            class="layout-footer-attribution-link"
          >ui-ux-pro-max</a>
        </p>
        <p class="layout-footer-copy">
          © {{ currentYear }} uimaster.cc — MIT License
        </p>
      </div>
    </footer>
  </div>
</template>

<script setup lang="ts">
const currentYear = new Date().getFullYear()
</script>

<style scoped>
.layout {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  background-color: var(--color-bg, #F8F9FA);
}

/* Main content grows to push footer down */
.layout-main {
  flex: 1;
  width: 100%;
}

/* Footer */
.layout-footer {
  background-color: var(--color-surface, #fff);
  border-top: 1px solid var(--color-border, #E5E7EB);
  margin-top: auto;
}

.layout-footer-inner {
  max-width: 1280px;
  margin: 0 auto;
  padding: 48px 24px 36px;
  display: grid;
  grid-template-columns: 1fr auto;
  gap: 40px;
}

@media (max-width: 767px) {
  .layout-footer-inner {
    grid-template-columns: 1fr;
    padding: 32px 16px 24px;
    gap: 28px;
  }
}

/* Brand block */
.layout-footer-brand {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layout-footer-logo {
  font-weight: 700;
  font-size: 16px;
  letter-spacing: -0.2px;
  color: var(--color-primary, #1D1D1F);
}

.layout-footer-tagline {
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  margin: 0;
  max-width: 280px;
  line-height: 1.5;
}

/* Footer nav */
.layout-footer-nav {
  display: flex;
  gap: 48px;
}

@media (max-width: 767px) {
  .layout-footer-nav {
    gap: 24px;
    flex-wrap: wrap;
  }
}

.layout-footer-nav-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.layout-footer-nav-label {
  font-size: 11px;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted, #6B7280);
  margin-bottom: 4px;
}

.layout-footer-link {
  font-size: 13px;
  color: var(--color-text-muted, #6B7280);
  text-decoration: none;
  transition: color var(--transition-fast, 150ms ease);
  line-height: 1.4;
}

.layout-footer-link:hover {
  color: var(--color-text, #111827);
}

/* Bottom bar */
.layout-footer-bottom {
  max-width: 1280px;
  margin: 0 auto;
  padding: 16px 24px;
  border-top: 1px solid var(--color-border, #E5E7EB);
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

@media (max-width: 767px) {
  .layout-footer-bottom {
    padding: 16px;
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}

.layout-footer-attribution,
.layout-footer-copy {
  font-size: 12px;
  color: var(--color-text-muted, #6B7280);
  margin: 0;
}

.layout-footer-attribution-link {
  color: var(--color-accent, #3B82F6);
  text-decoration: none;
  font-weight: 500;
}

.layout-footer-attribution-link:hover {
  text-decoration: underline;
}
</style>
