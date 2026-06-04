<template>
  <Teleport to="body">
    <button
      v-if="adminMenuOpen"
      type="button"
      class="admin-nav-backdrop"
      aria-label="Close menu"
      tabindex="-1"
      @click="closeAdminMenu"
    />
  </Teleport>
  <nav
    class="admin-nav-drawer"
    :class="{ 'admin-nav-drawer--open': adminMenuOpen }"
    aria-label="Admin menu"
    :aria-hidden="!adminMenuOpen"
    @click.stop
  >
    <router-link
      v-for="item in navItems"
      :key="item.to"
      :to="item.to"
      class="admin-nav-drawer__link"
      :class="{ 'admin-nav-drawer__link--active': isNavActive(item.to) }"
      @click="closeAdminMenu"
    >
      {{ item.label }}
    </router-link>
  </nav>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { useAdminNav } from '../../composables/useAdminNav.js';
import { ADMIN_NAV_ITEMS, isAdminNavActive } from '../../composables/adminNavItems.js';

const route = useRoute();
const { adminMenuOpen, closeAdminMenu } = useAdminNav();
const navItems = ADMIN_NAV_ITEMS;

function isNavActive(path) {
    return isAdminNavActive(route.path, path);
}
</script>

<style scoped>
.admin-nav-backdrop {
  position: fixed;
  inset: 0;
  z-index: 1098;
  margin: 0;
  padding: 0;
  border: none;
  background: rgba(0, 0, 0, 0.25);
  cursor: default;
}

.admin-nav-drawer {
  position: absolute;
  top: 100%;
  left: 0;
  right: 0;
  z-index: 1101;
  display: none;
  flex-direction: column;
  align-items: stretch;
  gap: 0.125rem;
  padding: 0.5rem 20px 1.25rem;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
  box-sizing: border-box;
}

.admin-nav-drawer--open {
  display: flex;
}

.admin-nav-drawer__link {
  color: #374151;
  text-decoration: none;
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: none;
  min-height: 44px;
  display: flex;
  align-items: center;
  padding: 0.5rem 0.75rem;
  width: 100%;
  border-radius: 8px;
}

.admin-nav-drawer__link:hover {
  background: #f3f4f6;
  opacity: 1;
  text-decoration: none;
}

.admin-nav-drawer__link--active {
  background: #e8e8ec;
  color: #111827;
  font-weight: 600;
}

@media (min-width: 768px) {
  .admin-nav-backdrop,
  .admin-nav-drawer {
    display: none !important;
  }
}
</style>
