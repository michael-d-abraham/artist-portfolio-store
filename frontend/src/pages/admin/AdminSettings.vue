<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Settings</h1>
    </header>

    <div class="admin-float admin-float--padded">
      <button type="button" class="admin-panel__btn-ghost" @click="onLogout">
        Log out
      </button>
    </div>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';
import { logoutAdmin } from '../../services/api.js';

const router = useRouter();

async function onLogout() {
  try {
    await logoutAdmin();
  } catch {
    /* still send user to login */
  }
  router.replace({ name: 'admin-login' });
}
</script>
