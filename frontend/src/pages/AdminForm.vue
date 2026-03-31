<template>
  <div class="admin-form-page">
    <h1 class="page-title">Edit name &amp; description</h1>
    <p class="lead text-muted">Change how this artwork appears in the shop (linked products use the same text).</p>
    <p v-if="loadError" class="error">{{ loadError }}</p>
    <p v-else-if="loadingArtwork">Loading…</p>
    <form v-else @submit.prevent="onSubmit">
      <div class="field">
        <label for="title">Name *</label>
        <input id="title" v-model="form.title" type="text" autocomplete="off" />
        <p class="help">Title shown for this piece. The site may update its URL slug from this when you save.</p>
        <p v-if="fieldErrors.title" class="field-error">{{ fieldErrors.title }}</p>
      </div>
      <div class="field">
        <label for="description">Description *</label>
        <textarea id="description" v-model="form.description" rows="6" />
        <p class="help">Longer text on the product page for this artwork.</p>
        <p v-if="fieldErrors.description" class="field-error">{{ fieldErrors.description }}</p>
      </div>
      <div class="field">
        <label>
          <input v-model="form.is_active" type="checkbox" />
          Active (show in admin / lists that respect this flag)
        </label>
      </div>
      <p v-if="submitError" class="error">{{ submitError }}</p>
      <div class="actions">
        <button type="submit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Saving…' : 'Save' }}</button>
        <router-link to="/admin">Cancel</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAdminArtworkById, updateArtwork } from '../services/api.js';

const route = useRoute();
const router = useRouter();

const props = defineProps({
  id: {
    type: String,
    default: undefined
  }
});

const artworkId = computed(() => props.id || route.params.id);

const form = reactive({
  title: '',
  description: '',
  is_active: true
});

const fieldErrors = reactive({
  title: '',
  description: ''
});

const loadingArtwork = ref(false);
const loadError = ref('');
const submitError = ref('');
const submitting = ref(false);

function clearFieldErrors() {
  fieldErrors.title = '';
  fieldErrors.description = '';
}

function validate() {
  clearFieldErrors();
  let ok = true;
  if (!String(form.title).trim()) {
    fieldErrors.title = 'Name is required';
    ok = false;
  }
  if (!String(form.description).trim()) {
    fieldErrors.description = 'Description is required';
    ok = false;
  }
  return ok;
}

function buildUpdateBody() {
  return {
    title: String(form.title).trim(),
    description: String(form.description).trim(),
    is_active: !!form.is_active
  };
}

function populateFromArtwork(a) {
  form.title = a.title ?? '';
  form.description = a.description ?? '';
  form.is_active = !!a.is_active;
}

async function loadArtwork() {
  if (!artworkId.value) {
    loadError.value = 'Missing id';
    return;
  }
  loadingArtwork.value = true;
  loadError.value = '';
  try {
    const a = await getAdminArtworkById(artworkId.value);
    populateFromArtwork(a);
  } catch (e) {
    loadError.value = e.message || 'Failed to load';
  } finally {
    loadingArtwork.value = false;
  }
}

watch(
  () => ({ id: route.params.id, pid: props.id }),
  () => loadArtwork(),
  { immediate: true }
);

async function onSubmit() {
  submitError.value = '';
  if (!validate()) return;
  if (!artworkId.value) {
    submitError.value = 'Missing id';
    return;
  }
  submitting.value = true;
  try {
    await updateArtwork(artworkId.value, buildUpdateBody());
    router.push('/admin');
  } catch (e) {
    submitError.value = e.message || 'Save failed';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.admin-form-page {
  max-width: var(--max-width-narrow);
  padding-bottom: var(--space-xl);
}

.admin-form-page .page-title {
  margin-bottom: var(--space-sm);
}

.lead {
  margin: 0 0 var(--space-lg);
  line-height: 1.55;
}

.field {
  margin-bottom: var(--space-lg);
}

.field label {
  display: block;
  margin-bottom: var(--space-xs);
  font-weight: 600;
  font-size: 0.875rem;
}

.help {
  margin: var(--space-xs) 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.field input[type='text'],
.field textarea {
  width: 100%;
}

.actions {
  margin-top: var(--space-lg);
  display: flex;
  align-items: center;
  gap: var(--space-md);
  flex-wrap: wrap;
}

.field-error {
  margin-top: var(--space-xs);
}
</style>
