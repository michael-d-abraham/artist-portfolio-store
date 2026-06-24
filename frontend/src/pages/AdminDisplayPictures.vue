<template>
  <div class="admin-display admin-display--embedded">
    <p v-if="loading" class="admin-display__status">Loading…</p>
    <p v-else-if="loadError" class="error admin-display__status">{{ loadError }}</p>

    <form v-else class="admin-display__form" @submit.prevent="onSave">
      <AdminContactPagePreview
        :form="form"
        :disabled="uploading || saving"
        @pick-image="openFilePicker"
        @remove-image="clearImage"
      />

      <footer class="admin-display__footer">
        <p v-if="uploading" class="admin-display__uploading">Uploading…</p>
        <p v-if="actionError" class="error">{{ actionError }}</p>
        <p v-if="saved" class="admin-display__success" role="status">Saved.</p>
        <button type="submit" class="btn-primary" :disabled="uploading || saving">
          {{ saving ? 'Saving…' : 'Save contact page' }}
        </button>
      </footer>
    </form>

    <AdminPhotoUploadFlow
      ref="photoFlowRef"
      editor-title="Contact portrait"
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
import { reactive, ref, onMounted } from 'vue';
import {
  getAdminDisplayPictures,
  updateAdminDisplayPictures,
  uploadAdminImage
} from '../services/api.js';
import { applyContactPageDefaults } from '../constants/contactPageDefaults.js';
import AdminContactPagePreview from '../components/admin/AdminContactPagePreview.vue';
import AdminPhotoUploadFlow from '../components/admin/AdminPhotoUploadFlow.vue';

const form = reactive(applyContactPageDefaults({}));
const loading = ref(true);
const loadError = ref('');
const actionError = ref('');
const saved = ref(false);
const uploading = ref(false);
const saving = ref(false);
const photoFlowRef = ref(null);

function applySettings(data) {
  Object.assign(form, applyContactPageDefaults(data));
}

function payloadFromForm() {
  return {
    contact_hero_image_url: form.contact_hero_image_url,
    show_hero_image: form.show_hero_image,
    page_title: form.page_title,
    form_name_label: form.form_name_label,
    form_email_label: form.form_email_label,
    form_subject_label: form.form_subject_label,
    form_message_label: form.form_message_label,
    form_submit_label: form.form_submit_label,
    success_message: form.success_message
  };
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

async function persistSettings() {
  saving.value = true;
  actionError.value = '';
  saved.value = false;
  try {
    const data = await updateAdminDisplayPictures(payloadFromForm());
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

function openFilePicker() {
  actionError.value = '';
  photoFlowRef.value?.openPicker();
}

async function uploadPortrait(file) {
  if (!file) return;

  uploading.value = true;
  actionError.value = '';
  try {
    const { image_url } = await uploadAdminImage(file);
    form.contact_hero_image_url = image_url;
    await persistSettings();
  } catch (e) {
    actionError.value = e.message || 'Upload failed';
  } finally {
    uploading.value = false;
  }
}

async function onPhotoFile(file) {
  await uploadPortrait(file);
}

function onPhotoCancel() {
  /* no-op */
}

async function clearImage() {
  form.contact_hero_image_url = '';
  try {
    await persistSettings();
  } catch {
    /* actionError set in persistSettings */
  }
}

onMounted(load);
</script>

<style scoped>
.admin-display {
  width: 100%;
  max-width: none;
  margin: 0;
  padding-bottom: var(--space-xl);
}

.admin-display--embedded {
  margin: 0;
}

.admin-display__status {
  color: var(--color-text-muted);
}

.admin-display__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-lg);
}

.admin-display__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-md);
}

.admin-display__uploading {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.admin-display__success {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}
</style>
