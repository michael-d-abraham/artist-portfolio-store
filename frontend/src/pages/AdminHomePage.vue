<template>
  <div class="admin-home admin-home--embedded">
    <p v-if="loading" class="admin-home__status">Loading…</p>
    <p v-else-if="loadError" class="error admin-home__status">{{ loadError }}</p>

    <form v-else class="admin-home__form" @submit.prevent="onSave">
      <AdminHomePagePreview
        :form="form"
        :catalog-products="catalogProducts"
        :disabled="uploading || saving"
        @pick-image="openFilePicker"
        @remove-image="clearImage"
      />

      <footer class="admin-home__footer">
        <p v-if="actionError" class="error">{{ actionError }}</p>
        <p v-if="saved" class="admin-home__success" role="status">Saved.</p>
        <button type="submit" class="btn-primary" :disabled="uploading || saving">
          {{ saving ? 'Saving…' : 'Save home page' }}
        </button>
      </footer>
    </form>

    <AdminPhotoUploadFlow
      ref="photoFlowRef"
      free-aspect
      show-orientation-tools
      :disabled="uploading || saving"
      @file="onPhotoFile"
      @cancel="onPhotoCancel"
    />
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';
import {
  getAdminHomePage,
  getAdminProducts,
  updateAdminHomePage,
  uploadAdminImage
} from '../services/api.js';
import AdminHomePagePreview from '../components/admin/AdminHomePagePreview.vue';
import AdminPhotoUploadFlow from '../components/admin/AdminPhotoUploadFlow.vue';
import { FEATURED_PRODUCT_SLOTS, emptyFeaturedProduct } from '@shared/homePageDefaults.js';

function createEmptyForm() {
  return {
    hero_title: '',
    hero_subtitle: '',
    hero_image_url: '',
    featured_title: '',
    featured_products: Array.from({ length: FEATURED_PRODUCT_SLOTS }, emptyFeaturedProduct),
    about_title: '',
    about_header: '',
    about_text: '',
    about_image_url: ''
  };
}

const form = reactive(createEmptyForm());
const catalogProducts = ref([]);
const loading = ref(true);
const loadError = ref('');
const actionError = ref('');
const saved = ref(false);
const saving = ref(false);
const uploading = ref(false);
const uploadTarget = ref(null);
const photoFlowRef = ref(null);

function applySettings(data) {
  const next = createEmptyForm();
  if (data && typeof data === 'object') {
    next.hero_title = data.hero_title != null ? String(data.hero_title) : '';
    next.hero_subtitle = data.hero_subtitle != null ? String(data.hero_subtitle) : '';
    next.hero_image_url = data.hero_image_url != null ? String(data.hero_image_url).trim() : '';
    next.featured_title = data.featured_title != null ? String(data.featured_title) : '';
    next.about_title = data.about_title != null ? String(data.about_title) : '';
    next.about_header = data.about_header != null ? String(data.about_header) : '';
    next.about_text = data.about_text != null ? String(data.about_text) : '';
    next.about_image_url =
      data.about_image_url != null ? String(data.about_image_url).trim() : '';

    const featured = Array.isArray(data.featured_products) ? data.featured_products : [];
    for (let i = 0; i < FEATURED_PRODUCT_SLOTS; i++) {
      const row = featured[i] || {};
      next.featured_products[i] = {
        product_id: row.product_id != null ? String(row.product_id).trim() : ''
      };
    }
  }

  form.hero_title = next.hero_title;
  form.hero_subtitle = next.hero_subtitle;
  form.hero_image_url = next.hero_image_url;
  form.featured_title = next.featured_title;
  form.about_title = next.about_title;
  form.about_header = next.about_header;
  form.about_text = next.about_text;
  form.about_image_url = next.about_image_url;
  for (let i = 0; i < FEATURED_PRODUCT_SLOTS; i++) {
    Object.assign(form.featured_products[i], next.featured_products[i]);
  }
}

function payloadFromForm() {
  return {
    hero_title: form.hero_title,
    hero_subtitle: form.hero_subtitle,
    hero_image_url: form.hero_image_url,
    featured_title: form.featured_title,
    featured_products: form.featured_products.map((row) => ({
      product_id: row.product_id
    })),
    about_title: form.about_title,
    about_header: form.about_header,
    about_text: form.about_text,
    about_image_url: form.about_image_url
  };
}

async function load() {
  loading.value = true;
  loadError.value = '';
  try {
    const [homeData, products] = await Promise.all([
      getAdminHomePage(),
      getAdminProducts()
    ]);
    catalogProducts.value = Array.isArray(products)
      ? products.filter((p) => p && p.is_active !== false)
      : [];
    applySettings(homeData);
  } catch (e) {
    loadError.value = e.message || 'Failed to load';
  } finally {
    loading.value = false;
  }
}

async function persistSettings() {
  saving.value = true;
  actionError.value = '';
  saved.value = false;
  try {
    const data = await updateAdminHomePage(payloadFromForm());
    applySettings(data);
    saved.value = true;
    window.setTimeout(() => {
      saved.value = false;
    }, 2000);
  } catch (e) {
    actionError.value = e.message || 'Save failed';
    throw e;
  } finally {
    saving.value = false;
  }
}

async function onSave() {
  await persistSettings();
}

function editorOptionsForTarget(target) {
  if (target?.type === 'hero') {
    return {
      editorTitle: 'Hero image',
      outputFileName: 'hero.jpg'
    };
  }
  if (target?.type === 'about') {
    return {
      editorTitle: 'About image',
      outputFileName: 'about.jpg'
    };
  }
  return {};
}

function openFilePicker(target) {
  uploadTarget.value = target;
  actionError.value = '';
  photoFlowRef.value?.openPicker(editorOptionsForTarget(target));
}

function setImageUrl(target, url) {
  if (target.type === 'hero') {
    form.hero_image_url = url;
    return;
  }
  if (target.type === 'about') {
    form.about_image_url = url;
  }
}

async function uploadFileForTarget(file) {
  const target = uploadTarget.value;
  if (!target || !file) return;

  uploading.value = true;
  actionError.value = '';
  try {
    const { image_url } = await uploadAdminImage(file);
    setImageUrl(target, image_url);
    await persistSettings();
  } catch (e) {
    actionError.value = e.message || 'Upload failed';
  } finally {
    uploading.value = false;
    uploadTarget.value = null;
  }
}

async function onPhotoFile(file) {
  await uploadFileForTarget(file);
}

function onPhotoCancel() {
  uploadTarget.value = null;
}

async function clearImage(target) {
  setImageUrl(target, '');
  try {
    await persistSettings();
  } catch {
    /* actionError set in persistSettings */
  }
}

onMounted(load);
</script>

<style scoped>
.admin-home {
  width: 100%;
  max-width: none;
}

.admin-home--embedded {
  margin: 0;
}

.admin-home__status {
  color: var(--color-text-muted);
}

.admin-home__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.admin-home__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
}

.admin-home__success {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
