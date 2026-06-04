<template>
  <div class="app">
    <header
      v-if="!isAdminRoute"
      class="app-header site-header is-visible"
      :class="headerHidden ? 'is-hidden' : 'is-visible'"
    >
      <div ref="headerBarRef" class="app-header__bar">
        <button
          type="button"
          class="mobile-menu-toggle"
          :aria-label="mobileMenuOpen ? 'Close navigation menu' : 'Open navigation menu'"
          :aria-expanded="mobileMenuOpen"
          @click="toggleMobileMenu"
        >
          <span></span>
          <span></span>
          <span></span>
        </button>
        <router-link to="/" class="app-brand" aria-label="PERM home">PERM</router-link>
        <nav class="app-nav app-nav--desktop" aria-label="Main">
          <router-link to="/" class="app-nav__link" exact-active-class="app-nav__link--active">
            Gallery
          </router-link>
          <router-link to="/contact" class="app-nav__link" active-class="app-nav__link--active">
            Contact
          </router-link>
          <router-link to="/admin" class="app-nav__link" active-class="app-nav__link--active">
            Admin
          </router-link>
        </nav>
        <div class="app-header__end">
          <CartIcon />
        </div>
      </div>
      <MobileMenuDrawer class="app-header__mobile-nav" />
    </header>
    <CartDrawer v-if="!isAdminRoute" />
    <main
      class="app-main"
      :class="{ 'app-main--product-mobile': isProductMobile, 'app-main--admin': isAdminRoute }"
    >
      <div class="app-main__inner">
        <router-view />
      </div>
    </main>
    <footer v-if="showSocialFooter" class="app-footer">
      <div class="app-footer__inner">
        <SocialIconLinks class="app-footer__social" />
        <p class="app-footer__copyright">©2026&nbsp;PERM.COM</p>
      </div>
    </footer>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted, nextTick } from 'vue';
import { useRoute } from 'vue-router';
import CartIcon from './components/cart/CartIcon.vue';
import CartDrawer from './components/cart/CartDrawer.vue';
import MobileMenuDrawer from './components/mobile/MobileMenuDrawer.vue';
import SocialIconLinks from './components/social/SocialIconLinks.vue';
import { useCart } from './composables/useCart.js';
import { useMobileNav } from './composables/useMobileNav.js';
import { useMediaQuery } from './composables/useMediaQuery.js';

const MOBILE_HEADER_MQ = '(max-width: 640px)';

const route = useRoute();
const { drawerOpen } = useCart();
const { mobileMenuOpen, toggleMobileMenu, closeMobileMenu } = useMobileNav();
const isMobile = useMediaQuery(MOBILE_HEADER_MQ);
const headerBarRef = ref(null);
const headerHidden = ref(false);

const isAdminRoute = computed(() => route.path.startsWith('/admin'));
const isProductMobile = computed(
  () => isMobile.value && route.name === 'product-detail'
);

let lastScrollY = 0;
let scrollTicking = false;
let mobileMq = null;
let headerBarResizeObserver = null;

function onEscape(event) {
  if (event.key === 'Escape' && mobileMenuOpen.value) {
    closeMobileMenu();
  }
}

function isMobileHeaderMode() {
  return mobileMq?.matches ?? window.matchMedia(MOBILE_HEADER_MQ).matches;
}

function syncBodyHeaderClasses() {
  document.body.classList.toggle('mobile-menu-open', mobileMenuOpen.value);
  document.body.classList.toggle('cart-open', drawerOpen.value);
}

/** Reserve space for fixed mobile header so page content is not covered. */
function syncMobileHeaderOffset() {
  const bar = headerBarRef.value;
  if (!bar || !isMobileHeaderMode() || isAdminRoute.value) {
    document.documentElement.style.removeProperty('--mobile-header-height');
    document.documentElement.classList.remove('has-fixed-mobile-header');
    return;
  }

  const height = Math.ceil(bar.getBoundingClientRect().height);
  document.documentElement.style.setProperty('--mobile-header-height', `${height}px`);
  document.documentElement.classList.add('has-fixed-mobile-header');
}

function updateHeaderOnScroll() {
  if (!isMobileHeaderMode()) {
    headerHidden.value = false;
    lastScrollY = window.scrollY;
    scrollTicking = false;
    return;
  }

  if (mobileMenuOpen.value || drawerOpen.value) {
    headerHidden.value = false;
    lastScrollY = window.scrollY;
    scrollTicking = false;
    return;
  }

  const currentScrollY = window.scrollY;
  const delta = currentScrollY - lastScrollY;

  if (Math.abs(delta) < 6) {
    scrollTicking = false;
    return;
  }

  // Scrolling down the page: show header
  if (delta > 0) {
    headerHidden.value = false;
  }

  // Scrolling up the page: hide header
  if (delta < 0 && currentScrollY > 40) {
    headerHidden.value = true;
  }

  // Always show at very top
  if (currentScrollY <= 10) {
    headerHidden.value = false;
  }

  lastScrollY = currentScrollY;
  scrollTicking = false;
}

function onScroll() {
  if (!scrollTicking) {
    window.requestAnimationFrame(updateHeaderOnScroll);
    scrollTicking = true;
  }
}

function onMobileMqChange() {
  headerHidden.value = false;
  lastScrollY = window.scrollY;
  nextTick(syncMobileHeaderOffset);
}

watch(
  () => route.fullPath,
  () => {
    closeMobileMenu();
    nextTick(syncMobileHeaderOffset);
  }
);

watch([mobileMenuOpen, drawerOpen], () => {
  syncBodyHeaderClasses();
  headerHidden.value = false;
});

onMounted(() => {
  window.addEventListener('keydown', onEscape);
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', syncMobileHeaderOffset);

  mobileMq = window.matchMedia(MOBILE_HEADER_MQ);
  mobileMq.addEventListener('change', onMobileMqChange);

  lastScrollY = window.scrollY;
  syncBodyHeaderClasses();

  nextTick(() => {
    requestAnimationFrame(() => {
      syncMobileHeaderOffset();
      if (headerBarRef.value) {
        headerBarResizeObserver = new ResizeObserver(() => {
          syncMobileHeaderOffset();
        });
        headerBarResizeObserver.observe(headerBarRef.value);
      }
    });
  });
});

onUnmounted(() => {
  window.removeEventListener('keydown', onEscape);
  window.removeEventListener('scroll', onScroll);
  window.removeEventListener('resize', syncMobileHeaderOffset);
  mobileMq?.removeEventListener('change', onMobileMqChange);
  headerBarResizeObserver?.disconnect();
  document.body.classList.remove('mobile-menu-open', 'cart-open');
  document.documentElement.classList.remove('has-fixed-mobile-header');
  document.documentElement.style.removeProperty('--mobile-header-height');
});

const showSocialFooter = computed(() => {
  const name = route.name;
  return name === 'gallery' || name === 'contact' || name === 'product-detail';
});
</script>

<style>
.app-header {
  position: sticky;
  top: 0;
  z-index: 1000;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.site-header {
  z-index: 1000;
  background: var(--color-surface);
  border-bottom: 1px solid var(--color-border);
}

.app-header__bar {
  width: 100%;
  max-width: none;
  margin: 0;
  padding: 1.25rem var(--header-padding-x) 1rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--space-lg);
}

.app-brand {
  font-family: var(--font-sans);
  font-size: 1.875rem;
  font-weight: 900;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  text-decoration: none;
  color: var(--color-text);
  line-height: 1;
  flex-shrink: 0;
}

.app-brand:hover,
.app-brand:active,
.app-brand:focus-visible {
  opacity: 1;
}

@media (hover: hover) and (pointer: fine) {
  .app-brand:hover {
    opacity: 0.85;
  }
}

.app-header__end {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-xl);
  flex-wrap: wrap;
}

.app-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: flex-end;
  gap: var(--space-lg);
  margin-left: auto;
  margin-right: var(--space-xl);
}

@media (min-width: 641px) {
  .app-header__mobile-nav {
    display: none !important;
  }
}

.mobile-menu-toggle {
  display: none;
  box-shadow: none;
  letter-spacing: 0;
  text-transform: none;
  border-radius: 0;
}

.mobile-menu-toggle:hover:not(:disabled) {
  background: transparent;
  border-color: transparent;
  opacity: 1;
}

.mobile-menu-toggle:focus-visible {
  box-shadow: var(--focus-ring);
}

.app-nav__link {
  color: var(--color-text);
  text-decoration: none;
  font-size: 1.25rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  opacity: 1;
  transition: opacity 0.2s ease;
}

.app-nav__link:hover {
  opacity: 0.5;
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.app-nav__link.router-link-active,
.app-nav__link.router-link-exact-active,
.app-nav__link.app-nav__link--active {
  opacity: 1;
  text-decoration: underline;
  text-underline-offset: 0.25em;
}

.app-main {
  flex: 1;
  padding: var(--space-xl) var(--space-lg) var(--space-3xl);
}

.app-main--admin {
  padding: 0;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-height: 0;
}

.app-main--admin:has(.admin-shell) {
  overflow: hidden;
}

.app-main--admin .app-main__inner {
  max-width: none;
  margin: 0;
  width: 100%;
  flex: 1;
  min-height: 0;
  display: flex;
  flex-direction: column;
}

.app-main--admin:has(.admin-shell) .app-main__inner {
  height: 100%;
}

.app-main__inner {
  max-width: var(--max-width-page);
  margin: 0 auto;
}


.app {
  min-height: 100vh;
  min-height: 100dvh;
  display: flex;
  flex-direction: column;
  background: var(--color-bg);
}

.app:has(.admin-shell) {
  height: 100vh;
  height: 100dvh;
  overflow: hidden;
}

.app-footer {
  flex-shrink: 0;
  margin-top: auto;
  padding: var(--space-2xl) var(--space-lg) var(--space-3xl);
  border-top: 1px solid var(--color-border);
  background: var(--color-surface);
}

.app-footer__inner {
  max-width: var(--max-width-page);
  margin: 0 auto;
  text-align: center;
}

.app-footer__social {
  margin: 0 auto;
}

.app-footer__copyright {
  margin: var(--space-lg) 0 0;
  font-size: 0.8125rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

@media (max-width: 640px) {
  .site-header {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    transform: translateY(0);
    transition: transform 220ms ease;
    will-change: transform;
  }

  .site-header.is-hidden {
    transform: translateY(-100%);
  }

  .site-header.is-visible {
    transform: translateY(0);
  }

  .app-header__bar {
    padding: 1rem 20px;
    gap: 0;
    display: grid;
    grid-template-columns: 44px 1fr 44px;
    align-items: center;
    position: relative;
  }

  .mobile-menu-toggle {
    grid-column: 1;
    grid-row: 1;
    justify-self: start;
    z-index: 2;
  }

  .app-brand {
    grid-column: 2;
    grid-row: 1;
    justify-self: center;
    font-size: 1.375rem;
    letter-spacing: 0.12em;
    max-width: 100%;
    min-width: 0;
    text-align: center;
  }

  .app-header__end {
    grid-column: 3;
    grid-row: 1;
    justify-self: end;
    justify-content: flex-end;
    gap: 0;
    z-index: 2;
  }

  .app-nav--desktop {
    display: none;
  }

  .app-main--product-mobile {
    padding: 0;
  }

  .mobile-menu-toggle {
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
  }

  .mobile-menu-toggle span {
    width: 22px;
    height: 2px;
    background: #000;
    display: block;
    transition: transform 0.2s ease, opacity 0.2s ease;
  }

  .mobile-menu-toggle[aria-expanded='true'] span:nth-child(1) {
    transform: translateY(7px) rotate(45deg);
  }

  .mobile-menu-toggle[aria-expanded='true'] span:nth-child(2) {
    opacity: 0;
  }

  .mobile-menu-toggle[aria-expanded='true'] span:nth-child(3) {
    transform: translateY(-7px) rotate(-45deg);
  }

  .app-main:not(.app-main--admin) {
    /* Fixed header is out of flow — offset top padding by measured bar height */
    padding: calc(var(--mobile-header-height, 72px) + var(--space-lg)) 20px var(--space-2xl);
  }

  .app-main--admin {
    padding: 0;
  }

  .app-footer {
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media (max-width: 390px) {
  .app-header__bar {
    padding-left: 16px;
    padding-right: 16px;
  }

  .app-brand {
    font-size: 1.25rem;
    letter-spacing: 0.1em;
  }

  .app-nav--desktop .app-nav__link {
    font-size: 0.8125rem;
    letter-spacing: 0.08em;
  }

  .app-main {
    padding-left: 16px;
    padding-right: 16px;
  }

  .app-footer {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
