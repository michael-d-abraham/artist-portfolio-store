<template>
  <div
    class="admin-actions-menu"
    :class="{ 'admin-actions-menu--open': open }"
    @click.stop
  >
    <button
      type="button"
      class="admin-actions-menu__trigger"
      :aria-label="`Actions for ${title}`"
      :aria-expanded="open"
      aria-haspopup="menu"
      @click="$emit('toggle')"
    >
      <svg class="admin-actions-menu__icon" width="20" height="20" viewBox="0 0 20 20" aria-hidden="true">
        <circle cx="10" cy="4" r="1.5" />
        <circle cx="10" cy="10" r="1.5" />
        <circle cx="10" cy="16" r="1.5" />
      </svg>
    </button>
    <div v-show="open" class="admin-actions-menu__panel" role="menu">
      <router-link
        :to="editTo"
        role="menuitem"
        class="admin-actions-menu__item"
        @click="$emit('close')"
      >
        Edit
      </router-link>
      <button type="button" role="menuitem" class="admin-actions-menu__item" @click="onToggle">
        {{ toggleLabel }}
      </button>
      <button
        type="button"
        role="menuitem"
        class="admin-actions-menu__item admin-actions-menu__item--danger"
        @click="onDelete"
      >
        Delete
      </button>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  productId: { type: String, required: true },
  title: { type: String, default: 'listing' },
  isActive: { type: Boolean, default: true },
  open: { type: Boolean, default: false }
});

const emit = defineEmits(['toggle', 'close', 'toggle-active', 'delete']);

const editTo = computed(() => `/admin/edit/${props.productId}`);

const toggleLabel = computed(() => (props.isActive ? 'Disable' : 'Enable'));

function onToggle() {
  emit('toggle-active');
  emit('close');
}

function onDelete() {
  emit('delete');
  emit('close');
}
</script>
