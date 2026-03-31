<template>
  <div class="admin-create">
    <h1 class="page-title">New listing</h1>
    <p class="lead text-muted">
      Add one artwork and one product for sale: name, description, what kind of item it is (poster, canvas, …), photos, price, and how many you have.
    </p>
    <p v-if="loadTypesError" class="error">{{ loadTypesError }}</p>

    <form @submit.prevent="onSubmit">
      <div class="field">
        <label for="name">Name *</label>
        <input id="name" v-model="artwork.title" type="text" autocomplete="off" placeholder="Artwork or piece name" />
        <p class="help">This is the title shown in the shop and on the product page.</p>
      </div>

      <div class="field">
        <label for="desc">Description *</label>
        <textarea id="desc" v-model="artwork.description" rows="5" placeholder="Describe the artwork" />
        <p class="help">Shown on the product page with this piece.</p>
      </div>

      <div class="field">
        <label for="pt-select">Type *</label>
        <select id="pt-select" v-model="selectedTypeChoice" :disabled="loadingTypes">
          <option v-if="loadingTypes" value="">Loading types…</option>
          <template v-else>
            <option value="">— Pick one —</option>
            <option value="__new__">New type…</option>
            <option v-for="t in productTypes" :key="t._id" :value="String(t._id)">{{ t.name }}</option>
          </template>
        </select>
        <p class="help">What you’re selling (e.g. Poster, Canvas print). Choose an existing one or “New type”.</p>
      </div>

      <div v-if="isNewType" class="field box">
        <label for="pt-name">New type name *</label>
        <input id="pt-name" v-model="newTypeName" type="text" placeholder="e.g. Poster, Canvas" />
        <p class="help">Only the name is required; this creates the type for next time too.</p>
      </div>

      <div class="field">
        <label for="price">Price (USD) *</label>
        <input id="price" v-model.number="priceDollars" type="number" min="0" step="0.01" />
        <p class="help">Price in dollars (e.g. 49.99).</p>
      </div>

      <div class="field">
        <label for="qty">Quantity *</label>
        <input id="qty" v-model.number="quantity" type="number" min="0" step="1" />
        <p class="help">How many you have in stock to start.</p>
      </div>

      <div class="field">
        <span class="label-text">Pictures</span>
        <p class="help">Paste image URLs. Mark one as the main photo (shown first in the shop).</p>
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
import { reactive, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import { getAdminProductTypes, createCatalogItem } from '../services/api.js';

const CREATE_NEW = '__new__';

const router = useRouter();

const artwork = reactive({
  title: '',
  description: ''
});

const productTypes = ref([]);
const loadingTypes = ref(false);
const loadTypesError = ref('');
const selectedTypeChoice = ref('');
const newTypeName = ref('');

const priceDollars = ref(0);
const quantity = ref(0);

const imageRows = ref([{ url: '' }]);
const primaryImageIndex = ref(0);

const isNewType = computed(() => selectedTypeChoice.value === CREATE_NEW);

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

onMounted(async () => {
  loadingTypes.value = true;
  loadTypesError.value = '';
  try {
    productTypes.value = await getAdminProductTypes();
  } catch (e) {
    loadTypesError.value = e.message || 'Could not load types';
  } finally {
    loadingTypes.value = false;
  }
});

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
    artwork: {
      title: String(artwork.title).trim(),
      description: String(artwork.description).trim()
    },
    products: [
      {
        price_cents: dollarsToCents(priceDollars.value),
        quantity: quantity.value
      }
    ]
  };

  if (isNewType.value) {
    body.product_type = { name: String(newTypeName.value).trim() };
  } else {
    body.product_type_id = selectedTypeChoice.value;
  }

  const imgs = buildImages();
  if (imgs.length) {
    body.products[0].images = imgs;
  }

  return body;
}

function validate() {
  if (!String(artwork.title).trim()) return 'Enter a name.';
  if (!String(artwork.description).trim()) return 'Enter a description.';
  if (!selectedTypeChoice.value) return 'Choose a type or “New type”.';
  if (isNewType.value && !String(newTypeName.value).trim()) return 'Enter a name for the new type.';
  const cents = dollarsToCents(priceDollars.value);
  if (!Number.isInteger(cents)) return 'Enter a valid price.';
  const q = quantity.value;
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
    await createCatalogItem(buildBody());
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

.box {
  padding: var(--space-md);
  background: #f3f2ef;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
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
