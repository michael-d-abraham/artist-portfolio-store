<template>
  <div class="admin-create">
    <h1 class="page-title">New listing</h1>
    <p class="lead text-muted">
      Add a product for sale: title, description, format, photos, price, and stock. Each listing is independent in the shop.
    </p>

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
        <p class="help">Paste image URLs. Mark one as the main photo.</p>
        <div v-for="(img, j) in imageRows" :key="j" class="image-line">
          <input v-model="img.url" type="text" placeholder="https://…" />
          <label v-if="nonEmptyImageUrls.length" class="primary-pick">
            <input v-model="primaryImageIndex" type="radio" name="primary-img" :value="j" />
            Main
          </label>
          <button v-if="imageRows.length > 1" type="button" @click="removeImageRow(j)">Remove</button>
        </div>
        <button type="button" class="btn-add" @click="addImageRow">Add another image</button>
      </div>

      <p v-if="submitError" class="error">{{ submitError }}</p>
      <div class="actions">
        <button type="submit" class="btn-primary" :disabled="submitting">{{ submitting ? 'Saving…' : 'Save listing' }}</button>
        <router-link to="/admin">Back</router-link>
      </div>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, computed } from 'vue';
import { useRouter } from 'vue-router';
import { createAdminProduct } from '../services/api.js';

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
const imageRows = ref([{ url: '' }]);
const primaryImageIndex = ref(0);

const nonEmptyImageUrls = computed(() =>
  imageRows.value.map((r) => String(r.url || '').trim()).filter(Boolean)
);

function addImageRow() {
  imageRows.value.push({ url: '' });
}

function removeImageRow(index) {
  imageRows.value.splice(index, 1);
  if (primaryImageIndex.value >= imageRows.value.length) {
    primaryImageIndex.value = Math.max(0, imageRows.value.length - 1);
  }
}

function dollarsToCents(d) {
  const n = Number(d);
  if (!Number.isFinite(n) || n < 0) return NaN;
  return Math.round(n * 100);
}

function buildImages() {
  const withIdx = imageRows.value
    .map((r, i) => ({ url: String(r.url || '').trim(), i }))
    .filter((x) => x.url);
  if (!withIdx.length) return [];
  let primaryPos = withIdx.findIndex((x) => x.i === primaryImageIndex.value);
  if (primaryPos < 0) primaryPos = 0;
  return withIdx.map((xr, j) => ({
    image_url: xr.url,
    is_primary: j === primaryPos
  }));
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
    router.push('/admin');
  } catch (e) {
    submitError.value = e.message || 'Save failed';
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.admin-create {
  max-width: var(--max-width-narrow);
  padding-bottom: var(--space-xl);
}

.admin-create .page-title {
  margin-bottom: var(--space-sm);
}

.lead {
  margin: 0 0 var(--space-lg);
  line-height: 1.55;
}

.field {
  margin-bottom: var(--space-lg);
}

.field label,
.label-text {
  display: block;
  font-weight: 600;
  font-size: 0.875rem;
  margin-bottom: var(--space-xs);
}

.help {
  margin: var(--space-xs) 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.image-line {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
}

.image-line input[type='text'] {
  flex: 1;
  min-width: 12rem;
}

.primary-pick {
  font-weight: normal;
  white-space: nowrap;
  font-size: 0.875rem;
}

.btn-add {
  margin-top: var(--space-sm);
}

.actions {
  margin-top: var(--space-xl);
  display: flex;
  gap: var(--space-md);
  align-items: center;
  flex-wrap: wrap;
}
</style>
