<template>
  <div class="app">
    <header class="app-header">
      <div class="app-header__inner">
        <nav class="app-nav" aria-label="Main">
          <router-link to="/" class="app-nav__link" exact-active-class="app-nav__link--active">
            Gallery
          </router-link>
          <router-link to="/admin" class="app-nav__link" active-class="app-nav__link--active">
            Admin
          </router-link>
        </nav>
      </div>
    </header>
    <main class="app-main">
      <div class="app-main__inner">
        <router-view />
      </div>
    </main>
  </div>
</template>

<script setup>
</script>

<style>
.app-header {
  position: sticky;
  top: 0;
  z-index: 10;
  background: rgba(247, 246, 244, 0.92);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid var(--color-border);
}

.app-header__inner {
  max-width: var(--max-width-page);
  margin: 0 auto;
  padding: var(--space-md) var(--space-lg);
}

.app-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-lg);
}

.app-nav__link {
  color: var(--color-text-muted);
  text-decoration: none;
  font-size: 0.9375rem;
  letter-spacing: 0.02em;
}

.app-nav__link:hover {
  color: var(--color-text);
}

.app-nav__link.router-link-active,
.app-nav__link.router-link-exact-active,
.app-nav__link.app-nav__link--active {
  color: var(--color-text);
  font-weight: 500;
}

.app-main {
  flex: 1;
  padding: var(--space-xl) var(--space-lg) var(--space-2xl);
}

.app-main__inner {
  max-width: var(--max-width-page);
  margin: 0 auto;
}

/* Wider shell for admin index + caption tool so tables and output have room */
@media (min-width: 52rem) {
  .app-main__inner:has(.admin-list),
  .app-main__inner:has(.ig-ai-page) {
    max-width: 88rem;
  }
}

.app {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}
</style>
