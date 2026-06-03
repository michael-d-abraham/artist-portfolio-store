<template>
  <header ref="headerRootRef" class="mobile-header">
    <div ref="headerBarRef" class="mobile-header__bar">
      <button
        type="button"
        class="mobile-header__menu"
        :aria-label="mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'"
        :aria-expanded="mobileMenuOpen"
        @click="toggleMobileMenu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>
      <router-link to="/" class="mobile-header__brand" aria-label="PERM home">PERM</router-link>
      <div class="mobile-header__cart">
        <CartIcon />
      </div>
    </div>
    <MobileMenuDrawer />
  </header>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import CartIcon from '../cart/CartIcon.vue';
import MobileMenuDrawer from './MobileMenuDrawer.vue';
import { useMobileNav } from '../../composables/useMobileNav.js';
import { useCart } from '../../composables/useCart.js';

const { mobileMenuOpen, toggleMobileMenu } = useMobileNav();
const { drawerOpen } = useCart();

const headerRootRef = ref(null);
const headerBarRef = ref(null);
let barResizeObserver = null;

function syncHeaderHeight() {
  const bar = headerBarRef.value;
  if (!bar) return;
  const height = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--mobile-product-header-height', `${height}px`);
}

watch([mobileMenuOpen, drawerOpen], () => {
  nextTick(syncHeaderHeight);
});

onMounted(() => {
  nextTick(() => {
    requestAnimationFrame(() => {
      syncHeaderHeight();
      if (headerBarRef.value) {
        barResizeObserver = new ResizeObserver(syncHeaderHeight);
        barResizeObserver.observe(headerBarRef.value);
      }
    });
  });
  window.addEventListener('resize', syncHeaderHeight);
});

onUnmounted(() => {
  window.removeEventListener('resize', syncHeaderHeight);
  barResizeObserver?.disconnect();
  document.documentElement.style.removeProperty('--mobile-product-header-height');
});
</script>

<style scoped>
.mobile-header {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.mobile-header :deep(.mobile-menu-drawer) {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 9;
}

.mobile-header__bar {
  display: grid;
  grid-template-columns: 44px 1fr 44px;
  align-items: center;
  padding: 1rem 20px;
  box-sizing: border-box;
}

.mobile-header__menu {
  grid-column: 1;
  grid-row: 1;
  justify-self: start;
  width: 44px;
  height: 44px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  gap: 5px;
  background: transparent;
  border: 0;
  padding: 0;
  cursor: pointer;
  box-shadow: none;
  letter-spacing: 0;
  text-transform: none;
}

.mobile-header__menu span {
  width: 22px;
  height: 2px;
  background: #000;
  display: block;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.mobile-header__menu[aria-expanded='true'] span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.mobile-header__menu[aria-expanded='true'] span:nth-child(2) {
  opacity: 0;
}

.mobile-header__menu[aria-expanded='true'] span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.mobile-header__brand {
  grid-column: 1 / -1;
  grid-row: 1;
  justify-self: center;
  font-family: var(--font-sans);
  font-size: 1.375rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--color-text);
  line-height: 1;
  text-align: center;
  z-index: 1;
}

.mobile-header__brand:hover,
.mobile-header__brand:active,
.mobile-header__brand:focus-visible {
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .mobile-header__brand:hover {
    opacity: 0.85;
  }
}

.mobile-header__cart {
  grid-column: 3;
  grid-row: 1;
  justify-self: end;
  z-index: 2;
}

@media (max-width: 390px) {
  .mobile-header__bar {
    padding-left: 16px;
    padding-right: 16px;
  }

  .mobile-header__brand {
    font-size: 1.25rem;
  }
}
</style>
