<template>
  <Teleport to="body">
    <div
      v-if="open"
      class="photo-editor"
      role="dialog"
      aria-modal="true"
      :aria-label="title"
      @click.self="onCancel"
    >
      <div class="photo-editor__panel">
        <header class="photo-editor__header">
          <h2 class="photo-editor__title">{{ title }}</h2>
          <p class="photo-editor__hint">Drag to move · pinch or scroll to zoom</p>
        </header>

        <div class="photo-editor__stage">
          <img ref="imageRef" class="photo-editor__image" :src="src" alt="" />
        </div>

        <div class="photo-editor__toolbar" aria-label="Photo tools">
          <template v-if="showOrientationTools">
            <button
              type="button"
              class="photo-editor__btn"
              aria-label="Rotate left"
              @click="rotate(-90)"
            >
              ↶
            </button>
            <button
              type="button"
              class="photo-editor__btn"
              aria-label="Rotate right"
              @click="rotate(90)"
            >
              ↷
            </button>
            <button type="button" class="photo-editor__btn" @click="flipHorizontal">
              {{ flipped ? 'Unflip' : 'Flip' }}
            </button>
            <span class="photo-editor__sep" aria-hidden="true" />
          </template>
          <button
            type="button"
            class="photo-editor__btn"
            :class="{ 'photo-editor__btn--on': dragMode === 'move' }"
            @click="setDragMode('move')"
          >
            Move
          </button>
          <button
            type="button"
            class="photo-editor__btn"
            :class="{ 'photo-editor__btn--on': dragMode === 'crop' }"
            @click="setDragMode('crop')"
          >
            Crop
          </button>
          <span class="photo-editor__sep" aria-hidden="true" />
          <button type="button" class="photo-editor__btn" aria-label="Zoom out" @click="zoomOut">−</button>
          <button type="button" class="photo-editor__btn" aria-label="Zoom in" @click="zoomIn">+</button>
          <button type="button" class="photo-editor__btn photo-editor__btn--text" @click="resetCrop">
            Reset
          </button>
        </div>

        <footer class="photo-editor__footer">
          <button type="button" class="photo-editor__cancel" @click="onCancel">Cancel</button>
          <button type="button" class="btn-primary" :disabled="applying" @click="onApply">
            {{ applying ? 'Saving…' : applyLabel }}
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
  open: { type: Boolean, default: false },
  src: { type: String, default: '' },
  title: { type: String, default: 'Edit photo' },
  aspectRatio: { type: Number, default: 4 / 5 },
  freeAspect: { type: Boolean, default: false },
  showOrientationTools: { type: Boolean, default: true },
  applyLabel: { type: String, default: 'Save' },
  outputFileName: { type: String, default: 'photo.jpg' },
  outputMime: { type: String, default: 'image/jpeg' },
  outputQuality: { type: Number, default: 0.92 }
});

const emit = defineEmits(['apply', 'cancel']);

const VIEW_MARGIN = 0.58;

const imageRef = ref(null);
const applying = ref(false);
const dragMode = ref('move');
const flipped = ref(false);
let cropper = null;

function destroyCropper() {
  if (cropper) {
    cropper.destroy();
    cropper = null;
  }
  dragMode.value = 'move';
  flipped.value = false;
}

function getRotatedBounds(image) {
  const maxSide = Math.max(image.width, image.height);
  return { width: maxSide, height: maxSide };
}

function centerCanvasInContainer() {
  if (!cropper) return;
  const container = cropper.getContainerData();
  const canvas = cropper.getCanvasData();
  cropper.setCanvasData({
    left: (container.width - canvas.width) / 2,
    top: (container.height - canvas.height) / 2
  });
}

function setFullCropBox() {
  if (!cropper) return;
  const image = cropper.getImageData();
  cropper.setCropBoxData({
    left: image.left,
    top: image.top,
    width: image.width,
    height: image.height
  });
}

function fitImageInView() {
  if (!cropper) return;

  const container = cropper.getContainerData();
  const image = cropper.getImageData();
  if (!container.width || !container.height || !image.width || !image.naturalWidth) {
    return;
  }

  const bounds = getRotatedBounds(image);
  const maxW = container.width * VIEW_MARGIN;
  const maxH = container.height * VIEW_MARGIN;
  const fitScale = Math.min(maxW / bounds.width, maxH / bounds.height, 1);
  const currentRatio = image.width / image.naturalWidth;
  const targetRatio = currentRatio * fitScale;

  cropper.zoomTo(Math.max(targetRatio, 0.01));
  centerCanvasInContainer();
  setFullCropBox();
}

function afterLayoutChange(fn) {
  requestAnimationFrame(() => {
    requestAnimationFrame(fn);
  });
}

async function initCropper() {
  destroyCropper();
  await nextTick();
  const el = imageRef.value;
  if (!el || !props.src) return;

  cropper = new Cropper(el, {
    aspectRatio: props.freeAspect ? NaN : props.aspectRatio,
    viewMode: 2,
    dragMode: 'move',
    autoCropArea: 1,
    responsive: true,
    restore: false,
    guides: true,
    center: true,
    highlight: true,
    background: true,
    modal: true,
    cropBoxMovable: true,
    cropBoxResizable: true,
    toggleDragModeOnDblclick: false,
    zoomable: true,
    zoomOnTouch: true,
    zoomOnWheel: true,
    wheelZoomRatio: 0.1,
    minContainerWidth: 200,
    minContainerHeight: 200,
    ready() {
      afterLayoutChange(fitImageInView);
    }
  });
}

function setDragMode(mode) {
  dragMode.value = mode;
  cropper?.setDragMode(mode);
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

function rotate(degrees) {
  if (!cropper) return;
  cropper.rotate(degrees);
  afterLayoutChange(fitImageInView);
}

function flipHorizontal() {
  if (!cropper) return;
  const imageData = cropper.getImageData();
  cropper.scaleX(imageData.scaleX > 0 ? -1 : 1);
  flipped.value = cropper.getImageData().scaleX < 0;
  afterLayoutChange(fitImageInView);
}

function resetCrop() {
  if (!cropper) return;
  cropper.reset();
  flipped.value = false;
  setDragMode('move');
  afterLayoutChange(fitImageInView);
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
      throw new Error('Could not process image');
    }
    emit('apply', await canvasToFile(canvas));
  } catch (err) {
    console.error('photo editor apply', err);
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
.photo-editor {
  position: fixed;
  inset: 0;
  z-index: 1300;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
}

.photo-editor__panel {
  width: 100%;
  height: 100%;
  max-height: 100vh;
  display: flex;
  flex-direction: column;
  background: #fafafa;
  color: #111;
}

.photo-editor__header {
  flex-shrink: 0;
  padding: 14px 20px 10px;
  border-bottom: 1px solid #e8e8e8;
  text-align: center;
}

.photo-editor__title {
  margin: 0 0 4px;
  font-size: 0.9375rem;
  font-weight: 600;
}

.photo-editor__hint {
  margin: 0;
  font-size: 0.8125rem;
  color: #666;
}

.photo-editor__stage {
  flex: 1;
  min-height: 0;
  background: #eee;
  overflow: hidden;
}

.photo-editor__stage :deep(.cropper-container) {
  width: 100% !important;
  height: 100% !important;
}

.photo-editor__stage :deep(.cropper-view-box) {
  outline: 1px solid #fff;
  outline-offset: -1px;
  box-shadow: 0 0 0 1px rgba(0, 0, 0, 0.25);
}

.photo-editor__stage :deep(.cropper-point) {
  width: 10px;
  height: 10px;
  background: #fff;
  border-radius: 50%;
  opacity: 1;
}

.photo-editor__stage :deep(.cropper-line) {
  background: rgba(255, 255, 255, 0.5);
}

.photo-editor__stage :deep(.cropper-dashed) {
  border-color: rgba(255, 255, 255, 0.4);
}

.photo-editor__image {
  display: block;
  max-width: 100%;
}

.photo-editor__toolbar {
  flex-shrink: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-wrap: wrap;
  gap: 6px;
  padding: 10px 16px;
  border-top: 1px solid #e8e8e8;
  background: #fafafa;
}

.photo-editor__btn {
  min-width: 2.25rem;
  height: 2.25rem;
  padding: 0 0.5rem;
  border: 1px solid #ddd;
  border-radius: 0;
  background: #fff;
  box-shadow: none;
  font-size: 0.8125rem;
  color: #333;
  cursor: pointer;
}

.photo-editor__btn:hover {
  border-color: #999;
}

.photo-editor__btn--on {
  border-color: #111;
  background: #111;
  color: #fff;
}

.photo-editor__btn--text {
  min-width: auto;
  padding: 0 0.35rem;
  border: none;
  background: transparent;
  text-decoration: underline;
  color: #666;
}

.photo-editor__btn--text:hover {
  color: #111;
}

.photo-editor__sep {
  width: 1px;
  height: 1.25rem;
  margin: 0 2px;
  background: #ddd;
}

.photo-editor__footer {
  flex-shrink: 0;
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 12px 20px 16px;
  border-top: 1px solid #e8e8e8;
  background: #fff;
}

.photo-editor__cancel {
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-size: 0.875rem;
  color: #666;
  text-decoration: underline;
  cursor: pointer;
}

.photo-editor__cancel:hover {
  color: #111;
}
</style>
