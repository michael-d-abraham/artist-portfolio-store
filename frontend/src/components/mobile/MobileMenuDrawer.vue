<template>
  <Teleport to="body">
    <button
      v-if="mobileMenuOpen"
      type="button"
      class="mobile-menu-backdrop"
      aria-label="Close menu"
      tabindex="-1"
      @click="closeMobileMenu"
    />
  </Teleport>
  <nav
    v-bind="$attrs"
    class="mobile-menu-drawer"
    :class="{ 'mobile-menu-drawer--open': mobileMenuOpen }"
    aria-label="Main"
    :aria-hidden="!mobileMenuOpen"
    @click.stop
  >
    <router-link
      to="/"
      class="mobile-menu-drawer__link"
      exact-active-class="mobile-menu-drawer__link--active"
      @click="closeMobileMenu"
    >
      Home
    </router-link>
    <router-link
      to="/gallery"
      class="mobile-menu-drawer__link"
      active-class="mobile-menu-drawer__link--active"
      @click="closeMobileMenu"
    >
      Gallery
    </router-link>
    <router-link
      to="/contact"
      class="mobile-menu-drawer__link"
      active-class="mobile-menu-drawer__link--active"
      @click="closeMobileMenu"
    >
      Contact
    </router-link>
    <router-link
      to="/admin"
      class="mobile-menu-drawer__link"
      active-class="mobile-menu-drawer__link--active"
      @click="closeMobileMenu"
    >
      Admin
    </router-link>
  </nav>
</template>

<script setup>
import { useMobileNav } from '../../composables/useMobileNav.js';

defineOptions({ inheritAttrs: false });

const { mobileMenuOpen, closeMobileMenu } = useMobileNav();
</script>

<style scoped>
.mobile-menu-backdrop {
  position: fixed;
  inset: 0;
  z-index: 998;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  cursor: default;
  letter-spacing: 0;
  text-transform: none;
}

.mobile-menu-backdrop:hover {
  background: transparent;
  border-color: transparent;
}

.mobile-menu-drawer {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 9;
  display: none;
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  padding: 0.5rem 20px 1.25rem;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
  box-sizing: border-box;
}

.mobile-menu-drawer--open {
  display: flex;
}

.mobile-menu-drawer__link {
  color: var(--color-text);
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0.5rem 0;
  width: 100%;
}

.mobile-menu-drawer__link:hover {
  opacity: 0.55;
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.mobile-menu-drawer__link--active {
  text-decoration: underline;
  text-underline-offset: 0.25em;
}
</style>
