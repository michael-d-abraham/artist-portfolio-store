<template>
  <div class="admin-shell">
    <AdminSidebar />

    <div class="admin-shell__content">
      <header class="admin-shell__mobile-header">
        <div class="admin-shell__mobile-bar">
          <button
            type="button"
            class="admin-shell__menu-toggle"
            :aria-label="adminMenuOpen ? 'Close navigation menu' : 'Open navigation menu'"
            :aria-expanded="adminMenuOpen"
            @click="toggleAdminMenu"
          >
            <span></span>
            <span></span>
            <span></span>
          </button>
          <router-link
            to="/admin/dashboard"
            class="admin-shell__mobile-brand"
            aria-label="PERM admin home"
          >
            PERM
          </router-link>
        </div>
        <AdminNavDrawer />
      </header>

      <main class="admin-shell__main">
        <router-view />
      </main>
    </div>
  </div>
</template>

<script setup>
import { watch, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router';
import AdminSidebar from './AdminSidebar.vue';
import AdminNavDrawer from './AdminNavDrawer.vue';
import { useAdminNav } from '../../composables/useAdminNav.js';

const route = useRoute();
const { adminMenuOpen, toggleAdminMenu, closeAdminMenu } = useAdminNav();

function onEscape(event) {
  if (event.key === 'Escape' && adminMenuOpen.value) {
    closeAdminMenu();
  }
}

watch(
  () => route.fullPath,
  () => {
    closeAdminMenu();
  }
);

onMounted(() => {
  window.addEventListener('keydown', onEscape);
});

onUnmounted(() => {
  window.removeEventListener('keydown', onEscape);
  closeAdminMenu();
});
</script>

<style scoped>
.admin-shell {
  --admin-sidebar-width: 15.5rem;
  width: 100%;
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
  box-sizing: border-box;
}

.admin-shell__content {
  flex: 1;
  min-width: 0;
  min-height: 0;
  display: flex;
  flex-direction: column;
  background: #fff;
}

.admin-shell__mobile-header {
  position: sticky;
  top: 0;
  z-index: 1100;
  background: #fff;
  border-bottom: 1px solid #e8e8e8;
}

.admin-shell__mobile-bar {
  display: grid;
  grid-template-columns: 44px 1fr;
  align-items: center;
  padding: 1rem 20px;
  box-sizing: border-box;
}

.admin-shell__menu-toggle {
  grid-column: 1;
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

.admin-shell__menu-toggle span {
  width: 22px;
  height: 2px;
  background: #000;
  display: block;
  transition: transform 0.2s ease, opacity 0.2s ease;
}

.admin-shell__menu-toggle[aria-expanded='true'] span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.admin-shell__menu-toggle[aria-expanded='true'] span:nth-child(2) {
  opacity: 0;
}

.admin-shell__menu-toggle[aria-expanded='true'] span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}

.admin-shell__mobile-brand {
  grid-column: 2;
  justify-self: center;
  font-family: var(--font-sans);
  font-size: 1.375rem;
  font-weight: 900;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  text-decoration: none;
  color: #1a1a1a;
  line-height: 1;
}

.admin-shell__main {
  flex: 1;
  min-height: 0;
  width: 100%;
  max-width: none;
  margin: 0;
  padding: var(--space-xl) var(--space-lg) var(--space-3xl);
  box-sizing: border-box;
  overflow-y: auto;
  overflow-x: hidden;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 768px) {
  .admin-shell {
    flex-direction: row;
    overflow: hidden;
  }

  .admin-shell__content {
    margin-left: var(--admin-sidebar-width);
    height: 100%;
    overflow: hidden;
  }

  .admin-shell__mobile-header {
    display: none;
  }

  .admin-shell__main {
    padding: 2rem 2.5rem 3rem;
  }
}

@media (max-width: 767px) {
  .admin-shell__main {
    padding: var(--space-lg) 20px var(--space-2xl);
  }
}
</style>
