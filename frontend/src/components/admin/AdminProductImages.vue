<template>
  <div class="admin-product-images" :class="{ 'is-disabled': disabled }">
    <p class="help">Upload photos. Mark one as main.</p>
    <p v-if="uploadError" class="error">{{ uploadError }}</p>

    <div v-for="(img, j) in rows" :key="img.id || img.url || j" class="image-row">
      <img v-if="img.url" class="thumb" :src="img.url" alt="" />
      <span v-else class="thumb thumb--empty">No preview</span>
      <label v-if="rowsWithUrl.length" class="primary-pick">
        <input
          type="radio"
          name="primary-img"
          :checked="primaryIndex === j"
          :disabled="disabled || uploading"
          @change="setPrimary(j)"
        />
        Main
      </label>
      <button type="button" class="btn-remove" :disabled="disabled || uploading" @click="removeRow(j)">
        Remove
      </button>
    </div>

    <div class="upload-row">
      <button
        type="button"
        class="upload-trigger"
        :disabled="disabled || uploading"
        @click="openUpload"
      >
        Add photo
      </button>
      <span v-if="uploading" class="upload-status">Uploading…</span>
    </div>

    <AdminPhotoUploadFlow
      ref="photoFlowRef"
      :offer-editor="offerPhotoEditor"
      editor-title="Product photo"
      free-aspect
      show-orientation-tools
      output-file-name="product.jpg"
      :disabled="disabled || uploading"
      @file="onPhotoFile"
      @cancel="onPhotoCancel"
    />
  </div>
</template>

<script>
export function buildProductImagesPayload(rows, primaryIndex) {
  const withIdx = (rows || [])
    .map((r, i) => ({ url: String(r.url || '').trim(), i }))
    .filter((x) => x.url);
  if (!withIdx.length) return [];
  let primaryPos = withIdx.findIndex((x) => x.i === primaryIndex);
  if (primaryPos < 0) primaryPos = 0;
  return withIdx.map((xr, j) => ({
    image_url: xr.url,
    is_primary: j === primaryPos
  }));
}
</script>

<script setup>
import { ref, computed, watch } from 'vue';
import { uploadAdminImage } from '../../services/api.js';
import AdminPhotoUploadFlow from './AdminPhotoUploadFlow.vue';

const props = defineProps({
  modelValue: {
    type: Array,
    default: () => []
  },
  primaryIndex: {
    type: Number,
    default: 0
  },
  disabled: {
    type: Boolean,
    default: false
  },
  /** Offer edit vs upload-original when adding a product photo. */
  offerPhotoEditor: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['update:modelValue', 'update:primaryIndex']);

const rows = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val)
});

const primaryIndex = computed({
  get: () => props.primaryIndex,
  set: (val) => emit('update:primaryIndex', val)
});

const rowsWithUrl = computed(() =>
  rows.value.map((r) => String(r.url || '').trim()).filter(Boolean)
);

const uploading = ref(false);
const uploadError = ref('');
const photoFlowRef = ref(null);

function setPrimary(index) {
  primaryIndex.value = index;
}

function removeRow(index) {
  const next = [...rows.value];
  next.splice(index, 1);
  rows.value = next;
  if (primaryIndex.value >= next.length) {
    primaryIndex.value = Math.max(0, next.length - 1);
  }
  if (next.length && !next.some((_, i) => i === primaryIndex.value)) {
    primaryIndex.value = 0;
  }
}

function ensurePrimaryIfNeeded() {
  const urls = rows.value.filter((r) => String(r.url || '').trim());
  if (urls.length && primaryIndex.value >= rows.value.length) {
    primaryIndex.value = 0;
  }
}

function openUpload() {
  if (props.disabled) return;
  uploadError.value = '';
  photoFlowRef.value?.openPicker();
}

async function onPhotoFile(file) {
  if (!file || props.disabled) return;

  uploading.value = true;
  uploadError.value = '';
  try {
    const { image_url } = await uploadAdminImage(file);
    const next = [...rows.value, { url: image_url }];
    rows.value = next;
    if (next.length === 1) {
      primaryIndex.value = 0;
    }
  } catch (e) {
    uploadError.value = e.message || 'Upload failed';
  } finally {
    uploading.value = false;
  }
}

function onPhotoCancel() {
  /* no-op */
}

function buildPayload() {
  return buildProductImagesPayload(rows.value, primaryIndex.value);
}

defineExpose({ buildPayload });

watch(
  () => rows.value.length,
  () => ensurePrimaryIfNeeded()
);
</script>

<style scoped>
.admin-product-images {
  margin-top: var(--space-xs);
}

.help {
  margin: 0 0 var(--space-sm);
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.error {
  margin: 0 0 var(--space-sm);
  color: var(--color-error, #b42318);
  font-size: 0.875rem;
}

.image-row {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  padding-bottom: var(--space-sm);
  border-bottom: 1px solid var(--color-border, #e5e5e5);
}

.thumb {
  width: 4.5rem;
  height: 4.5rem;
  object-fit: cover;
  border: 1px solid var(--color-border, #ddd);
  background: var(--color-surface-muted, #f5f5f5);
}

.thumb--empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 0.65rem;
  color: var(--color-text-muted);
  text-align: center;
}

.primary-pick {
  font-weight: normal;
  white-space: nowrap;
  font-size: 0.875rem;
}

.btn-remove {
  font-size: 0.875rem;
}

.upload-row {
  margin-top: var(--space-sm);
  display: flex;
  align-items: center;
  gap: var(--space-sm);
}

.upload-trigger {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-size: 0.875rem;
  font-weight: 600;
  text-decoration: underline;
  text-underline-offset: 2px;
  cursor: pointer;
}

.upload-trigger:hover:not(:disabled) {
  opacity: 0.65;
}

.upload-trigger:disabled {
  opacity: 0.5;
  cursor: wait;
}

.upload-status {
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.admin-product-images.is-disabled {
  opacity: 0.7;
  pointer-events: none;
}
</style>
