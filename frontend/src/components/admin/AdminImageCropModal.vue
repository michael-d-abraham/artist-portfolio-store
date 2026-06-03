<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="crop-modal"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @click.self="onCancel"
    >
      <div class="crop-modal__panel">
        <header class="crop-modal__header">
          <h2 class="crop-modal__title">{{ title }}</h2>
          <p class="crop-modal__hint">Drag to reposition. Pinch or scroll to zoom. Crop matches the Contact page (4:5).</p>
        </header>

        <div class="crop-modal__stage">
          <img ref="imageRef" class="crop-modal__image" :src="src" alt="Crop preview" />
        </div>

        <div class="crop-modal__zoom" aria-label="Zoom">
          <button type="button" class="crop-modal__zoom-btn" aria-label="Zoom out" @click="zoomOut">−</button>
          <span class="crop-modal__zoom-label">Zoom</span>
          <button type="button" class="crop-modal__zoom-btn" aria-label="Zoom in" @click="zoomIn">+</button>
        </div>

        <footer class="crop-modal__footer">
          <button type="button" class="crop-modal__btn crop-modal__btn--ghost" @click="onCancel">Cancel</button>
          <button type="button" class="crop-modal__btn btn-primary" :disabled="applying" @click="onApply">
            {{ applying ? 'Applying…' : 'Apply' }}
          </button>
        </footer>
      </div>
    </div>
  </Teleport>
</template>

<script setup>
import { ref, watch, nextTick, onBeforeUnmount } from 'vue';
import Cropper from 'cropperjs';
import 'cropperjs/dist/cropper.css';

const props = defineProps({
  open: {
    type: Boolean,
    default: false
  },
  src: {
    type: String,
    default: ''
  },
  title: {
    type: String,
    default: 'Crop image'
  },
  aspectRatio: {
    type: Number,
    default: 4 / 5
  },
  outputFileName: {
    type: String,
    default: 'cropped.jpg'
  },
  outputMime: {
    type: String,
    default: 'image/jpeg'
  },
  outputQuality: {
    type: Number,
    default: 0.92
  }
});

const emit = defineEmits(['apply', 'cancel']);

const imageRef = ref(null);
const applying = ref(false);
let cropper = null;

function destroyCropper() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
}

async function initCropper() {
  destroyCropper();
  await nextTick();
  const el = imageRef.value;
  if (!el || !props.src) return;

  cropper = new Cropper(el, {
    aspectRatio: props.aspectRatio,
    viewMode: 1,
    dragMode: 'move',
    autoCropArea: 1,
    responsive: true,
    restore: false,
    guides: true,
    center: true,
    highlight: true,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
    zoomable: true,
    zoomOnTouch: true,
    zoomOnWheel: true,
    wheelZoomRatio: 0.08
  });
}

function zoomBy(delta) {
  cropper?.zoom(delta);
}

function zoomIn() {
  zoomBy(0.1);
}

function zoomOut() {
  zoomBy(-0.1);
}

function canvasToFile(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Could not process image'));
          return;
        }
        resolve(new File([blob], props.outputFileName, { type: props.outputMime }));
      },
      props.outputMime,
      props.outputQuality
    );
  });
}

async function onApply() {
  if (!cropper || applying.value) return;
  applying.value = true;
  try {
    const canvas = cropper.getCroppedCanvas({
      maxWidth: 1600,
      maxHeight: 2000,
      imageSmoothingEnabled: true,
      imageSmoothingQuality: 'high'
    });
    if (!canvas) {
      throw new Error('Could not crop image');
    }
    const file = await canvasToFile(canvas);
    emit('apply', file);
  } catch (err) {
    console.error('crop apply', err);
  } finally {
    applying.value = false;
  }
}

function onCancel() {
  emit('cancel');
}

watch(
  () => [props.open, props.src],
  async ([isOpen, src]) => {
    if (isOpen && src) {
      await initCropper();
    } else {
      destroyCropper();
    }
  }
);

onBeforeUnmount(() => {
  destroyCropper();
});
</script>

<style scoped>
.crop-modal {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(0, 0, 0, 0.55);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
}

.crop-modal__panel {
  width: min(100%, 32rem);
  max-height: calc(100vh - 32px);
  display: flex;
  flex-direction: column;
  background: var(--color-bg, #fff);
  border: 1px solid var(--color-border, #e5e5e5);
  box-shadow: 0 12px 40px rgba(0, 0, 0, 0.15);
}

.crop-modal__header {
  padding: 16px 16px 8px;
}

.crop-modal__title {
  margin: 0 0 6px;
  font-size: 1rem;
  font-weight: 600;
}

.crop-modal__hint {
  margin: 0;
  font-size: 0.8125rem;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.crop-modal__stage {
  width: 100%;
  height: min(52vh, 360px);
  background: var(--color-product-image-bg, #f5f5f5);
  overflow: hidden;
}

.crop-modal__image {
  display: block;
  max-width: 100%;
}

.crop-modal__zoom {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  padding: 12px 16px;
  border-top: 1px solid var(--color-border, #e5e5e5);
}

.crop-modal__zoom-btn {
  width: 36px;
  height: 36px;
  padding: 0;
  border: 1px solid var(--color-border, #ccc);
  border-radius: 0;
  background: transparent;
  box-shadow: none;
  font-size: 1.25rem;
  line-height: 1;
  cursor: pointer;
}

.crop-modal__zoom-btn:hover {
  background: var(--color-surface, #f5f5f5);
}

.crop-modal__zoom-label {
  font-size: 0.75rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  min-width: 3rem;
  text-align: center;
}

.crop-modal__footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 12px 16px 16px;
}

.crop-modal__btn {
  min-width: 5.5rem;
}

.crop-modal__btn--ghost {
  border: none;
  background: transparent;
  box-shadow: none;
  color: var(--color-text-muted);
  text-decoration: underline;
  cursor: pointer;
  font-size: 0.875rem;
}

.crop-modal__btn--ghost:hover {
  color: var(--color-text);
}
</style>
