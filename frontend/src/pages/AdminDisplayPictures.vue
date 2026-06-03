<template>
  <div class="admin-display">
    <header class="admin-display__header">
      <div>
        <h1 class="page-title admin-display__title">Display Pictures</h1>
        <p class="admin-display__lead">Images shown on public pages.</p>
      </div>
      <router-link to="/admin" class="admin-display__back">← Admin</router-link>
    </header>

    <p v-if="loading" class="admin-display__status">Loading…</p>
    <p v-else-if="loadError" class="error admin-display__status">{{ loadError }}</p>

    <section v-else class="admin-display__section" aria-labelledby="contact-pictures-heading">
      <h2 id="contact-pictures-heading" class="admin-display__section-title">Contact Pictures</h2>
      <p class="admin-display__hint">Portrait or hero image on the Contact page.</p>

      <div class="hero-preview">
        <img
          v-if="contactHeroUrl"
          class="hero-preview__img"
          :src="contactHeroUrl"
          alt="Current contact hero"
        />
        <p v-else class="hero-preview__empty">No contact hero image set.</p>
      </div>

      <p v-if="actionError" class="error">{{ actionError }}</p>
      <p v-if="saved" class="admin-display__success" role="status">Saved.</p>

      <div class="hero-actions">
        <label class="hero-actions__upload">
          <span class="hero-actions__upload-label">{{ uploading ? 'Uploading…' : 'Add or replace picture' }}</span>
          <input
            type="file"
            accept="image/*"
            class="hero-actions__file"
            :disabled="uploading || saving"
            @change="onFileSelected"
          />
        </label>
        <button
          v-if="contactHeroUrl"
          type="button"
          class="hero-actions__remove"
          :disabled="uploading || saving"
          @click="onRemove"
        >
          Remove picture
        </button>
      </div>
    </section>

    <AdminImageCropModal
      :open="cropOpen"
      :src="cropSrc"
      title="Crop contact picture"
      @apply="onCropApply"
      @cancel="onCropCancel"
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
import AdminImageCropModal from '../components/admin/AdminImageCropModal.vue';

const contactHeroUrl = ref('');
const loading = ref(true);
const loadError = ref('');
const actionError = ref('');
const saved = ref(false);
const uploading = ref(false);
const saving = ref(false);
const cropOpen = ref(false);
const cropSrc = ref('');

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

function revokeCropSrc() {
  if (cropSrc.value && cropSrc.value.startsWith('blob:')) {
    URL.revokeObjectURL(cropSrc.value);
  }
  cropSrc.value = '';
}

function onFileSelected(event) {
  const input = event.target;
  const file = input.files && input.files[0];
  input.value = '';
  if (!file) return;

  actionError.value = '';
  revokeCropSrc();
  cropSrc.value = URL.createObjectURL(file);
  cropOpen.value = true;
}

function onCropCancel() {
  cropOpen.value = false;
  revokeCropSrc();
}

async function onCropApply(file) {
  cropOpen.value = false;
  revokeCropSrc();

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

.hero-preview {
  aspect-ratio: 4 / 5;
  max-width: 16rem;
  display: flex;
  align-items: center;
  justify-content: center;
  background: var(--color-product-image-bg);
  margin-bottom: var(--space-lg);
}

.hero-preview__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.hero-preview__empty {
  margin: 0;
  padding: var(--space-md);
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: center;
}

.hero-actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
}

.hero-actions__upload {
  cursor: pointer;
}

.hero-actions__upload-label {
  display: inline-block;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.hero-actions__file {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  overflow: hidden;
}

.hero-actions__remove {
  font-size: 0.875rem;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  color: var(--color-text-muted);
  text-decoration: underline;
  cursor: pointer;
}

.hero-actions__remove:hover:not(:disabled) {
  color: var(--color-text);
}

.hero-actions__remove:disabled {
  opacity: 0.5;
  cursor: default;
}

.admin-display__success {
  margin: 0 0 var(--space-sm);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
