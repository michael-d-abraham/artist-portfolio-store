<template>
  <div class="admin-display" :class="{ 'admin-display--embedded': embedded }">
    <header v-if="!embedded" class="admin-display__header">
      <div>
        <h1 class="page-title admin-display__title">Display Pictures</h1>
        <p class="admin-display__lead">Images shown on public pages.</p>
      </div>
      <router-link to="/admin/listings" class="admin-display__back">← Listing</router-link>
    </header>

    <p v-if="loading" class="admin-display__status">Loading…</p>
    <p v-else-if="loadError" class="error admin-display__status">{{ loadError }}</p>

    <section v-else class="admin-display__section" aria-labelledby="contact-pictures-heading">
      <h2 v-if="!embedded" id="contact-pictures-heading" class="admin-display__section-title">
        Contact Pictures
      </h2>
      <p v-if="!embedded" class="admin-display__hint">Portrait or hero image on the Contact page.</p>

      <div class="admin-display__image-wrap">
        <AdminHomePreviewImageSlot
          :image-url="contactHeroUrl"
          :disabled="uploading || saving"
          aria-label="Contact picture"
          @pick="openUpload"
          @remove="onRemove"
        />
      </div>

      <p v-if="uploading" class="admin-display__uploading">Uploading…</p>
      <p v-if="actionError" class="error">{{ actionError }}</p>
      <p v-if="saved" class="admin-display__success" role="status">Saved.</p>
    </section>

    <AdminPhotoUploadFlow
      ref="photoFlowRef"
      editor-title="Contact picture"
      :aspect-ratio="4 / 5"
      :free-aspect="false"
      show-orientation-tools
      output-file-name="contact.jpg"
      :disabled="uploading || saving"
      @file="onPhotoFile"
      @cancel="onPhotoCancel"
    />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  getAdminDisplayPictures,
  updateAdminDisplayPictures,
  uploadAdminImage
} from '../services/api.js';
import AdminHomePreviewImageSlot from '../components/admin/AdminHomePreviewImageSlot.vue';
import AdminPhotoUploadFlow from '../components/admin/AdminPhotoUploadFlow.vue';

defineProps({
  embedded: { type: Boolean, default: false }
});

const contactHeroUrl = ref('');
const loading = ref(true);
const loadError = ref('');
const actionError = ref('');
const saved = ref(false);
const uploading = ref(false);
const saving = ref(false);
const photoFlowRef = ref(null);

function applySettings(data) {
  const url = data?.contact_hero_image_url;
  contactHeroUrl.value = url != null && String(url).trim() ? String(url).trim() : '';
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await getAdminDisplayPictures();
    applySettings(data);
  } catch (e) {
    loadError.value = e.message || 'Failed to load';
  } finally {
    loading.value = false;
  }
}

async function saveUrl(url) {
  saving.value = true;
  actionError.value = '';
  saved.value = false;
  try {
    const data = await updateAdminDisplayPictures({
      contact_hero_image_url: url
    });
    applySettings(data);
    saved.value = true;
    window.setTimeout(() => {
      saved.value = false;
    }, 2000);
  } catch (e) {
    actionError.value = e.message || 'Save failed';
  } finally {
    saving.value = false;
  }
}

function openUpload() {
  actionError.value = '';
  photoFlowRef.value?.openPicker();
}

async function onPhotoFile(file) {
  uploading.value = true;
  actionError.value = '';
  saved.value = false;
  try {
    const { image_url } = await uploadAdminImage(file);
    await saveUrl(image_url);
  } catch (e) {
    actionError.value = e.message || 'Upload failed';
  } finally {
    uploading.value = false;
  }
}

function onPhotoCancel() {
  /* no-op */
}

async function onRemove() {
  if (!contactHeroUrl.value) return;
  await saveUrl('');
}

onMounted(load);
</script>

<style scoped>
.admin-display {
  max-width: var(--max-width-narrow);
  margin: 0 auto;
  padding-bottom: var(--space-xl);
}

.admin-display__header {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  margin-bottom: var(--space-xl);
}

.admin-display__title {
  margin-bottom: var(--space-xs);
}

.admin-display__lead {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.admin-display__back {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-decoration: none;
}

.admin-display__back:hover {
  color: var(--color-text);
}

.admin-display__status {
  color: var(--color-text-muted);
}

.admin-display__section {
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.admin-display__section-title {
  margin: 0 0 var(--space-xs);
  font-size: 1rem;
  font-weight: 600;
}

.admin-display__hint {
  margin: 0 0 var(--space-lg);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.admin-display__image-wrap {
  aspect-ratio: 4 / 5;
  max-width: 16rem;
  margin-bottom: var(--space-md);
}

.admin-display__image-wrap :deep(.admin-home-img-slot__hit) {
  min-height: 100%;
  aspect-ratio: 4 / 5;
}

.admin-display__uploading {
  margin: 0 0 var(--space-sm);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.admin-display__success {
  margin: 0 0 var(--space-sm);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
