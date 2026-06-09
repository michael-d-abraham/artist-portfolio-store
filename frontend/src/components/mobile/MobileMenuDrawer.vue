<template>
  <Teleport to="body">
    <Transition name="mobile-menu-backdrop">
      <button
        v-if="mobileMenuOpen"
        type="button"
        class="mobile-menu-backdrop"
        aria-label="Close menu"
        tabindex="-1"
        @click="closeMobileMenu"
      />
    </Transition>
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
  background: rgba(0, 0, 0, 0.12);
  box-shadow: none;
  cursor: default;
  letter-spacing: 0;
  text-transform: none;
}

.mobile-menu-backdrop:hover {
  background: rgba(0, 0, 0, 0.12);
  border-color: transparent;
}

.mobile-menu-backdrop-enter-active,
.mobile-menu-backdrop-leave-active {
  transition: opacity 0.24s ease;
}

.mobile-menu-backdrop-enter-from,
.mobile-menu-backdrop-leave-to {
  opacity: 0;
}

.mobile-menu-drawer {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 9;
  display: flex;
  width: 100%;
  flex-direction: column;
  align-items: stretch;
  gap: 0;
  max-height: 0;
  opacity: 0;
  overflow: hidden;
  pointer-events: none;
  visibility: hidden;
  padding: 0 20px;
  background: var(--color-surface);
  border-bottom: 1px solid transparent;
  box-sizing: border-box;
  transition:
    max-height 0.3s ease,
    opacity 0.24s ease,
    padding 0.3s ease,
    border-color 0.24s ease,
    visibility 0.3s;
}

.mobile-menu-drawer--open {
  max-height: 220px;
  opacity: 1;
  pointer-events: auto;
  visibility: visible;
  padding: 0.5rem 20px 1.25rem;
  border-bottom-color: var(--color-border);
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
