<template>
  <header class="navbar">
    <div class="navbar-inner">
      <!-- Logo -->
      <NuxtLink to="/" class="navbar-logo">
        <span class="navbar-logo-icon">✦</span>
        <span class="navbar-logo-text">uimaster<span class="navbar-logo-tld">.cc</span></span>
      </NuxtLink>

      <!-- Desktop Nav -->
      <nav class="navbar-nav" aria-label="Main navigation">
        <NuxtLink
          to="/"
          class="navbar-link"
          :class="{ 'navbar-link--active': isPreviewRoute }"
        >
          <span class="navbar-link-icon">⬡</span>
          Design System
        </NuxtLink>
      </nav>

      <!-- Right Actions -->
      <div class="navbar-actions">
        <a
          href="https://github.com/uimaster-cc/uimaster"
          target="_blank"
          rel="noopener noreferrer"
          class="navbar-github"
          aria-label="GitHub repository"
        >
          <!-- GitHub SVG icon -->
          <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
            <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
          </svg>
          <span class="navbar-github-label">GitHub</span>
        </a>

        <!-- Mobile menu toggle -->
        <button
          class="navbar-mobile-toggle"
          :aria-expanded="mobileMenuOpen"
          aria-controls="mobile-menu"
          aria-label="Toggle navigation menu"
          @click="toggleMobileMenu"
        >
          <span class="navbar-mobile-toggle-bar" :class="{ open: mobileMenuOpen }" />
        </button>
      </div>
    </div>

    <!-- Mobile Menu -->
    <div
      v-show="mobileMenuOpen"
      id="mobile-menu"
      class="navbar-mobile-menu"
    >
      <NuxtLink
        to="/"
        class="navbar-mobile-link"
        :class="{ 'navbar-mobile-link--active': isPreviewRoute }"
        @click="mobileMenuOpen = false"
      >
        <span class="navbar-link-icon">⬡</span>
        Design System
      </NuxtLink>
      <a
        href="https://github.com/uimaster-cc/uimaster"
        target="_blank"
        rel="noopener noreferrer"
        class="navbar-mobile-link"
      >
        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" style="flex-shrink:0">
          <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z"/>
        </svg>
        GitHub
      </a>
    </div>
  </header>
</template>

<script setup lang="ts">
const route = useRoute()
const mobileMenuOpen = ref(false)

const isPreviewRoute = computed(() =>
  ['/', '/preview', '/compare', '/styles', '/products', '/how-to-use'].some(p =>
    route.path === p || route.path.startsWith(p + '/')
  )
)

function toggleMobileMenu() {
  mobileMenuOpen.value = !mobileMenuOpen.value
}

// Close mobile menu on route change
watch(() => route.path, () => {
  mobileMenuOpen.value = false
})
</script>

<style scoped>
.navbar {
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: var(--color-nav-bg, #fff);
  border-bottom: 1px solid var(--color-nav-border, #E5E7EB);
  height: var(--navbar-height, 60px);
}

.navbar-inner {
  max-width: 1280px;
  margin: 0 auto;
  height: 100%;
  padding: 0 var(--spacing-lg, 24px);
  display: flex;
  align-items: center;
  gap: var(--spacing-lg, 24px);
}

/* Logo */
.navbar-logo {
  display: flex;
  align-items: center;
  gap: 6px;
  font-weight: 700;
  font-size: 17px;
  letter-spacing: -0.3px;
  color: var(--color-primary, #1D1D1F);
  text-decoration: none;
  flex-shrink: 0;
}

.navbar-logo-icon {
  color: var(--color-accent, #3B82F6);
  font-size: 14px;
  line-height: 1;
}

.navbar-logo-text {
  color: var(--color-primary, #1D1D1F);
}

.navbar-logo-tld {
  color: var(--color-text-muted, #6B7280);
  font-weight: 500;
}

/* Nav links */
.navbar-nav {
  display: flex;
  align-items: center;
  gap: 2px;
  flex: 1;
}

.navbar-link {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-md, 8px);
  font-size: 14px;
  font-weight: 500;
  color: var(--color-text-muted, #6B7280);
  text-decoration: none;
  transition: color var(--transition-fast, 150ms ease),
              background-color var(--transition-fast, 150ms ease);
  white-space: nowrap;
}

.navbar-link:hover {
  color: var(--color-text, #111827);
  background-color: var(--color-bg, #F8F9FA);
}

.navbar-link--active {
  color: var(--color-primary, #1D1D1F);
  background-color: var(--color-bg, #F8F9FA);
}

.navbar-link-icon {
  font-size: 12px;
  line-height: 1;
}

/* Actions */
.navbar-actions {
  display: flex;
  align-items: center;
  gap: var(--spacing-sm, 8px);
  margin-left: auto;
}

.navbar-github {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: var(--radius-md, 8px);
  font-size: 13px;
  font-weight: 500;
  color: var(--color-text-muted, #6B7280);
  text-decoration: none;
  border: 1px solid var(--color-border, #E5E7EB);
  transition: color var(--transition-fast), border-color var(--transition-fast),
              background-color var(--transition-fast);
}

.navbar-github:hover {
  color: var(--color-text, #111827);
  border-color: var(--color-text-muted, #6B7280);
  background-color: var(--color-bg, #F8F9FA);
}

.navbar-github-label {
  /* Hide label on very small screens */
}

/* Mobile toggle */
.navbar-mobile-toggle {
  display: none;
  background: none;
  border: 1px solid var(--color-border, #E5E7EB);
  border-radius: var(--radius-sm, 4px);
  padding: 7px;
  cursor: pointer;
  color: var(--color-text, #111827);
  width: 36px;
  height: 36px;
  align-items: center;
  justify-content: center;
}

.navbar-mobile-toggle-bar {
  display: block;
  width: 16px;
  height: 2px;
  background-color: currentColor;
  border-radius: 1px;
  position: relative;
  transition: transform var(--transition-fast), opacity var(--transition-fast);
}

.navbar-mobile-toggle-bar::before,
.navbar-mobile-toggle-bar::after {
  content: '';
  position: absolute;
  left: 0;
  width: 100%;
  height: 2px;
  background-color: currentColor;
  border-radius: 1px;
  transition: transform var(--transition-fast), opacity var(--transition-fast);
}

.navbar-mobile-toggle-bar::before { top: -5px; }
.navbar-mobile-toggle-bar::after  { top: 5px; }

.navbar-mobile-toggle-bar.open {
  background-color: transparent;
}
.navbar-mobile-toggle-bar.open::before {
  transform: rotate(45deg) translate(3.5px, 3.5px);
}
.navbar-mobile-toggle-bar.open::after {
  transform: rotate(-45deg) translate(3.5px, -3.5px);
}

/* Mobile menu dropdown */
.navbar-mobile-menu {
  display: flex;
  flex-direction: column;
  padding: var(--spacing-sm, 8px) var(--spacing-md, 16px) var(--spacing-md, 16px);
  border-top: 1px solid var(--color-border, #E5E7EB);
  background-color: var(--color-surface, #fff);
  gap: 2px;
}

.navbar-mobile-link {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: var(--radius-md, 8px);
  font-size: 15px;
  font-weight: 500;
  color: var(--color-text-muted, #6B7280);
  text-decoration: none;
  transition: color var(--transition-fast), background-color var(--transition-fast);
}

.navbar-mobile-link:hover,
.navbar-mobile-link--active {
  color: var(--color-text, #111827);
  background-color: var(--color-bg, #F8F9FA);
}

/* Responsive */
@media (max-width: 767px) {
  .navbar {
    height: auto;
  }

  .navbar-nav {
    display: none;
  }

  .navbar-github-label {
    display: none;
  }

  .navbar-mobile-toggle {
    display: flex;
  }

  .navbar-inner {
    height: 56px;
    padding: 0 var(--spacing-md, 16px);
  }
}
</style>
