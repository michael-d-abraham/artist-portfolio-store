<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Edit listing</h1>
      <router-link to="/admin/listings" class="admin-page-header__btn">← Listing</router-link>
    </header>

    <p v-if="loadError" class="error admin-page-header__status">{{ loadError }}</p>
    <p v-else-if="loadingProduct" class="admin-page-header__status">Loading…</p>

    <div v-else class="admin-float admin-float--padded">
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="title">Title *</label>
          <input id="title" v-model="form.title" type="text" autocomplete="off" />
          <p class="help">Changing the title may update the shop URL slug automatically.</p>
          <p v-if="fieldErrors.title" class="field-error">{{ fieldErrors.title }}</p>
        </div>
        <div class="field">
          <label for="description">Description *</label>
          <textarea id="description" v-model="form.description" rows="6" />
          <p v-if="fieldErrors.description" class="field-error">{{ fieldErrors.description }}</p>
        </div>
        <div class="field">
          <label for="format">Format</label>
          <input id="format" v-model="form.format" type="text" placeholder="e.g. Canvas" />
        </div>
        <div class="field">
          <label for="size">Size</label>
          <input id="size" v-model="form.size_label" type="text" />
        </div>
        <div class="field">
          <label for="year">Year</label>
          <input id="year" v-model.number="form.year_created" type="number" min="1900" max="2100" />
        </div>
        <div class="field">
          <label for="price">Price (USD)</label>
          <input id="price" v-model.number="priceDollars" type="number" min="0" step="0.01" />
        </div>
        <div class="field">
          <label for="qty">Quantity in stock</label>
          <input id="qty" v-model.number="form.quantity_available" type="number" min="0" step="1" />
        </div>
        <div class="field">
          <span class="label-text">Pictures</span>
          <AdminProductImages
            v-model="imageRows"
            v-model:primary-index="primaryImageIndex"
            :disabled="submitting"
          />
        </div>
        <div class="field">
          <label>
            <input v-model="form.is_active" type="checkbox" />
            Active (visible in shop when in stock)
          </label>
        </div>
        <p v-if="slugHint" class="help">Shop slug: <code>{{ slugHint }}</code></p>
        <p v-if="submitError" class="error">{{ submitError }}</p>
        <div class="actions">
          <button type="submit" class="admin-panel__btn-primary" :disabled="submitting">
            {{ submitting ? 'Saving…' : 'Save' }}
          </button>
          <router-link to="/admin/listings">Cancel</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getAdminProductById, updateAdminProduct } from '../services/api.js';
import AdminProductImages, { buildProductImagesPayload } from '../components/admin/AdminProductImages.vue';

const route = useRoute();
const router = useRouter();

const props = defineProps({
  id: {
    type: String,
    default: undefined
  }
});

const productId = computed(() => props.id || route.params.id);

const form = reactive({
  title: '',
  description: '',
  format: '',
  size_label: '',
  year_created: null,
  quantity_available: 0,
  is_active: true
});

const priceDollars = ref(0);
const slugHint = ref('');
const imageRows = ref([]);
const primaryImageIndex = ref(0);

const fieldErrors = reactive({
  title: '',
  description: ''
});

const loadingProduct = ref(false);
const loadError = ref('');
const submitError = ref('');
const submitting = ref(false);

function clearFieldErrors() {
  fieldErrors.title = '';
  fieldErrors.description = '';
}

function dollarsToCents(d) {
  const n = Number(d);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

function validate() {
  clearFieldErrors();
  let ok = true;
  if (!String(form.title).trim()) {
    fieldErrors.title = 'Title is required';
    ok = false;
  }
  if (!String(form.description).trim()) {
    fieldErrors.description = 'Description is required';
    ok = false;
  }
  return ok;
}

function buildUpdateBody() {
  const body = {
    title: String(form.title).trim(),
    description: String(form.description).trim(),
    price_cents: dollarsToCents(priceDollars.value),
    quantity_available: form.quantity_available,
    is_active: !!form.is_active,
    currency: 'usd'
  };
  const format = String(form.format || '').trim();
  body.format = format || null;
  const size = String(form.size_label || '').trim();
  body.size_label = size || null;
  if (form.year_created != null && Number.isInteger(form.year_created)) {
    body.year_created = form.year_created;
  } else {
    body.year_created = null;
  }
  body.images = buildProductImagesPayload(imageRows.value, primaryImageIndex.value);
  return body;
}

function populateFromProduct(p) {
  form.title = p.title ?? '';
  form.description = p.description ?? '';
  form.format = p.format ?? '';
  form.size_label = p.size_label ?? '';
  form.year_created = p.year_created ?? null;
  form.quantity_available = p.quantity_available ?? 0;
  form.is_active = !!p.is_active;
  priceDollars.value = p.price_cents != null ? p.price_cents / 100 : 0;
  slugHint.value = p.slug ?? '';
  const imgs = Array.isArray(p.product_images) ? p.product_images : [];
  imageRows.value = imgs.map((img) => ({
    id: img._id,
    url: img.image_url
  }));
  const primaryIdx = imgs.findIndex((img) => img.is_primary);
  primaryImageIndex.value = primaryIdx >= 0 ? primaryIdx : 0;
}

async function loadProduct() {
  if (!productId.value) {
    loadError.value = 'Missing id';
    return;
  }
  loadingProduct.value = true;
  loadError.value = '';
  try {
    const p = await getAdminProductById(productId.value);
    populateFromProduct(p);
  } catch (e) {
    loadError.value = e.message || 'Failed to load';
  } finally {
    loadingProduct.value = false;
  }
}

watch(
  () => ({ id: route.params.id, pid: props.id }),
  () => loadProduct(),
  { immediate: true }
);

async function onSubmit() {
  submitError.value = '';
  if (!validate()) return;
  if (!productId.value) {
    submitError.value = 'Missing id';
    return;
  }
  const cents = dollarsToCents(priceDollars.value);
  if (!Number.isInteger(cents)) {
    submitError.value = 'Enter a valid price';
    return;
  }
  submitting.value = true;
  try {
    const updated = await updateAdminProduct(productId.value, buildUpdateBody());
    slugHint.value = updated.slug ?? slugHint.value;
    router.push('/admin/listings');
  } catch (e) {
    submitError.value = e.message || 'Save failed';
  } finally {
    submitting.value = false;
  }
}
</script>
