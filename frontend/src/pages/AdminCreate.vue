<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">New listing</h1>
      <router-link to="/admin/listings" class="admin-page-header__btn">← Listing</router-link>
    </header>

    <div class="admin-float admin-float--padded">
      <form @submit.prevent="onSubmit">
        <div class="field">
          <label for="title">Title *</label>
          <input id="title" v-model="form.title" type="text" autocomplete="off" placeholder="e.g. Swilly Clouds — Canvas" />
          <p class="help">Shown in the gallery and on the product page. URL slug is generated from this unless you set one below.</p>
        </div>

        <div class="field">
          <label for="desc">Description *</label>
          <textarea id="desc" v-model="form.description" rows="5" placeholder="Describe the piece" />
        </div>

        <div class="field">
          <label for="format">Format</label>
          <input id="format" v-model="form.format" type="text" placeholder="e.g. Canvas, Poster" />
          <p class="help">Optional — e.g. print type or medium.</p>
        </div>

        <div class="field">
          <label for="size">Size</label>
          <input id="size" v-model="form.size_label" type="text" placeholder='e.g. 16" × 20"' />
        </div>

        <div class="field">
          <label for="year">Year</label>
          <input id="year" v-model.number="form.year_created" type="number" min="1900" max="2100" step="1" placeholder="Optional" />
        </div>

        <div class="field">
          <label for="price">Price (USD) *</label>
          <input id="price" v-model.number="priceDollars" type="number" min="0" step="0.01" />
        </div>

        <div class="field">
          <label for="qty">Quantity in stock *</label>
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

        <p v-if="submitError" class="error">{{ submitError }}</p>
        <div class="actions">
          <button type="submit" class="admin-panel__btn-primary" :disabled="submitting">
            {{ submitting ? 'Saving…' : 'Save listing' }}
          </button>
          <router-link to="/admin/listings">Cancel</router-link>
        </div>
      </form>
    </div>
  </div>
</template>

<script setup>
import { reactive, ref } from 'vue';
import { useRouter } from 'vue-router';
import { createAdminProduct } from '../services/api.js';
import AdminProductImages, { buildProductImagesPayload } from '../components/admin/AdminProductImages.vue';
import { dollarsToCents } from '../utils/money.js';

const router = useRouter();

const form = reactive({
  title: '',
  description: '',
  format: '',
  size_label: '',
  year_created: null,
  quantity_available: 0
});

const priceDollars = ref(0);
const imageRows = ref([]);
const primaryImageIndex = ref(0);

function buildImages() {
  return buildProductImagesPayload(imageRows.value, primaryImageIndex.value);
}

function buildBody() {
  const body = {
    title: String(form.title).trim(),
    description: String(form.description).trim(),
    price_cents: dollarsToCents(priceDollars.value),
    quantity_available: form.quantity_available,
    currency: 'usd'
  };
  const format = String(form.format || '').trim();
  if (format) body.format = format;
  const size = String(form.size_label || '').trim();
  if (size) body.size_label = size;
  if (form.year_created != null && Number.isInteger(form.year_created)) {
    body.year_created = form.year_created;
  }
  const imgs = buildImages();
  if (imgs.length) body.images = imgs;
  return body;
}

function validate() {
  if (!String(form.title).trim()) return 'Enter a title.';
  if (!String(form.description).trim()) return 'Enter a description.';
  const cents = dollarsToCents(priceDollars.value);
  if (!Number.isInteger(cents)) return 'Enter a valid price.';
  const q = form.quantity_available;
  if (typeof q !== 'number' || !Number.isInteger(q) || q < 0) return 'Enter a whole number for quantity.';
  return null;
}

const submitError = ref('');
const submitting = ref(false);

async function onSubmit() {
  submitError.value = '';
  const err = validate();
  if (err) {
    submitError.value = err;
    return;
  }
  submitting.value = true;
  try {
    await createAdminProduct(buildBody());
    router.push('/admin/listings');
  } catch (e) {
    submitError.value = e.message || 'Save failed';
  } finally {
    submitting.value = false;
  }
}
</script>
