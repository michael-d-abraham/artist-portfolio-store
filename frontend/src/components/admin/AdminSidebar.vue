<template>
  <aside class="admin-sidebar" aria-label="Admin navigation">
    <router-link to="/admin/dashboard" class="admin-sidebar__brand" aria-label="PERM admin home">
      PERM
    </router-link>
    <nav class="admin-sidebar__nav">
      <router-link
        v-for="item in navItems"
        :key="item.to"
        :to="item.to"
        class="admin-sidebar__link"
        :class="{ 'admin-sidebar__link--active': isNavActive(item.to) }"
      >
        {{ item.label }}
      </router-link>
    </nav>
  </aside>
</template>

<script setup>
import { useRoute } from 'vue-router';
import { ADMIN_NAV_ITEMS, isAdminNavActive } from '../../composables/adminNavItems.js';

const route = useRoute();
const navItems = ADMIN_NAV_ITEMS;

function isNavActive(path) {
    return isAdminNavActive(route.path, path);
}
</script>

<style scoped>
.admin-sidebar {
  display: none;
  flex-direction: column;
  width: var(--admin-sidebar-width, 15.5rem);
  padding: 1.5rem 1rem 2rem;
  background: #f5f5f7;
  border-right: 1px solid #e8e8e8;
  box-sizing: border-box;
}

.admin-sidebar__brand {
  display: block;
  margin: 0 0 2rem;
  padding: 0 0.75rem;
  font-family: var(--font-sans);
  font-size: 1.375rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  color: #1a1a1a;
  line-height: 1;
}

.admin-sidebar__brand:hover {
  opacity: 0.75;
}

.admin-sidebar__nav {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.admin-sidebar__link {
  display: flex;
  align-items: center;
  min-height: 44px;
  padding: 0.5rem 0.75rem;
  font-size: 0.9375rem;
  font-weight: 500;
  letter-spacing: 0.02em;
  text-transform: none;
  text-decoration: none;
  color: #374151;
  border-radius: 8px;
  transition: background 0.15s ease, color 0.15s ease;
}

.admin-sidebar__link:hover {
  background: #ebebed;
  opacity: 1;
  text-decoration: none;
}

.admin-sidebar__link--active {
  background: #e8e8ec;
  color: #111827;
  font-weight: 600;
}

@media (min-width: 768px) {
  .admin-sidebar {
    display: flex;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    height: 100vh;
    height: 100dvh;
    z-index: 100;
    overflow-y: auto;
    overscroll-behavior: contain;
  }
}
</style>
