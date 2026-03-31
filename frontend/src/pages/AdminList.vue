<template>
  <div class="admin-list">
    <header class="row">
      <h1 class="page-title row__title">Admin</h1>
      <div class="header-actions">
        <router-link to="/admin/instagram-ai">
          <button type="button">CaptionGenerator</button>
        </router-link>
        <router-link to="/admin/new">
          <button type="button">New listing</button>
        </router-link>
        <button type="button" class="btn-ghost" @click="onLogout">Log out</button>
      </div>
    </header>
    <p class="sub text-muted">
      <strong>New listing</strong> adds artwork + product + photos in one step. Open the shop gallery to see products.
      Here you only manage artwork names; edit changes title and description for every product that uses that artwork.
    </p>
    <p v-if="loading">Loading…</p>
    <p v-else-if="error" class="error">{{ error }}</p>
    <p v-else-if="!items.length">No artworks yet. Use <router-link to="/admin/new">New listing</router-link>.</p>
    <div v-else class="table-scroll">
      <table class="table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Link key</th>
            <th>On</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="a in items" :key="a._id">
            <td>{{ a.title }}</td>
            <td><code>{{ a.slug }}</code></td>
            <td>{{ a.is_active ? 'yes' : 'no' }}</td>
            <td class="actions">
              <router-link :to="'/admin/edit/' + a._id">
                <button type="button">Edit text</button>
              </router-link>
              <button type="button" @click="onToggle(a)">Toggle on/off</button>
              <button type="button" @click="onDelete(a)">Delete</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAdminArtworks, deleteArtwork, toggleArtworkActive, logoutAdmin } from '../services/api.js';

const router = useRouter();

const items = ref([]);
const loading = ref(true);
const error = ref('');

async function load() {
  loading.value = true;
  error.value = '';
  try {
    items.value = await getAdminArtworks();
  } catch (e) {
    error.value = e.message || 'Failed to load';
  } finally {
    loading.value = false;
  }
}

onMounted(load);

async function onLogout() {
  try {
    await logoutAdmin();
  } catch {
    /* still send user to login */
  }
  router.replace({ name: 'admin-login' });
}

async function onToggle(a) {
  try {
    await toggleArtworkActive(a._id);
    await load();
  } catch (e) {
    alert(e.message || 'Toggle failed');
  }
}

async function onDelete(a) {
  if (!window.confirm('Delete this artwork? (soft-delete)')) return;
  try {
    await deleteArtwork(a._id);
    await load();
  } catch (e) {
    alert(e.message || 'Delete failed');
  }
}
</script>

<style scoped>
.admin-list {
  padding-bottom: var(--space-xl);
}

.row {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  gap: var(--space-md);
  flex-wrap: wrap;
  margin-bottom: var(--space-sm);
}

.row__title {
  margin: 0;
}

.header-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-sm);
  align-items: center;
}

.actions {
  white-space: nowrap;
}

.actions button,
.actions a {
  margin-right: var(--space-sm);
}

.actions a:last-child button,
.actions button:last-child {
  margin-right: 0;
}

.sub {
  margin: 0 0 var(--space-md);
  font-size: 0.9375rem;
  line-height: 1.55;
  max-width: 44rem;
}
</style>
