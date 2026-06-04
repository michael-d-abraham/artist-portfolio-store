<template>
  <div class="admin-home-img-slot" :class="{ 'admin-home-img-slot--natural': naturalDisplay }">
    <button
      type="button"
      class="admin-home-img-slot__hit"
      :disabled="disabled"
      :aria-label="ariaLabel"
      @click="$emit('pick')"
    >
      <img
        v-if="imageUrl"
        class="admin-home-img-slot__photo"
        :class="photoClass"
        :src="imageUrl"
        alt=""
      />
      <span v-else class="admin-home-img-slot__empty">
        <span class="admin-home-img-slot__icon" aria-hidden="true">+</span>
        Click to add image
      </span>
      <span class="admin-home-img-slot__overlay">
        {{ imageUrl ? 'Change image' : 'Add image' }}
      </span>
    </button>
    <button
      v-if="imageUrl && !disabled"
      type="button"
      class="admin-home-img-slot__remove"
      @click.stop="$emit('remove')"
    >
      Remove
    </button>
  </div>
</template>

<script setup>
defineProps({
  imageUrl: { type: String, default: '' },
  disabled: { type: Boolean, default: false },
  ariaLabel: { type: String, default: 'Upload image' },
  /** Show the full image at native aspect ratio (no crop box). */
  naturalDisplay: { type: Boolean, default: false },
  photoClass: { type: String, default: '' }
});

defineEmits(['pick', 'remove']);
</script>

<style scoped>
.admin-home-img-slot {
  position: relative;
  width: 100%;
}

.admin-home-img-slot__hit {
  position: relative;
  display: block;
  width: 100%;
  margin: 0;
  padding: 0;
  border: 1px dashed var(--color-border-strong);
  background: var(--color-border);
  cursor: pointer;
  overflow: hidden;
  box-shadow: none;
  letter-spacing: 0;
  text-transform: none;
  font-weight: 400;
}

.admin-home-img-slot__hit:hover:not(:disabled) {
  border-color: var(--color-text);
  opacity: 1;
}

.admin-home-img-slot__hit:disabled {
  cursor: wait;
  opacity: 0.7;
}

.admin-home-img-slot__hit:focus-visible {
  outline: none;
  box-shadow: var(--focus-ring);
}

.admin-home-img-slot__photo {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.admin-home-img-slot--natural .admin-home-img-slot__hit:has(.admin-home-img-slot__photo) {
  width: auto;
  max-width: 100%;
  height: auto;
  border: none;
  background: transparent;
  overflow: visible;
}

.admin-home-img-slot--natural .admin-home-img-slot__photo:not(.hero-display__photo) {
  width: auto;
  max-width: 100%;
  height: auto;
  object-fit: unset;
}

.admin-home-img-slot--natural .admin-home-img-slot__photo.hero-display__photo {
  width: auto;
  height: auto;
  object-fit: contain;
}

.admin-home-img-slot__empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.35rem;
  min-height: inherit;
  padding: var(--space-md);
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  text-align: center;
}

.admin-home-img-slot__icon {
  font-size: 1.5rem;
  line-height: 1;
  color: var(--color-text);
}

.admin-home-img-slot__overlay {
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(0, 0, 0, 0.45);
  color: #fff;
  font-size: 0.75rem;
  font-weight: 600;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0;
  transition: opacity 0.2s ease;
  pointer-events: none;
}

.admin-home-img-slot__hit:hover:not(:disabled) .admin-home-img-slot__overlay,
.admin-home-img-slot__hit:focus-visible .admin-home-img-slot__overlay {
  opacity: 1;
}

.admin-home-img-slot__remove {
  position: absolute;
  top: var(--space-xs);
  right: var(--space-xs);
  z-index: 2;
  margin: 0;
  padding: 0.2rem 0.45rem;
  border: none;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: none;
  font-size: 0.6875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text);
  cursor: pointer;
  opacity: 0;
  transition: opacity 0.2s ease;
}

.admin-home-img-slot:hover .admin-home-img-slot__remove,
.admin-home-img-slot:focus-within .admin-home-img-slot__remove {
  opacity: 1;
}

.admin-home-img-slot__remove:hover:not(:disabled) {
  background: var(--color-text);
  color: var(--color-surface);
  opacity: 1;
}
</style>
