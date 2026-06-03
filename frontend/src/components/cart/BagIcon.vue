<template>
  <svg
    class="bag-icon"
    :width="size"
    :height="size"
    viewBox="0 0 24 28"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <!-- Simple shopping bag outline -->
    <path
      d="M5 9h14l-1.2 14H6.2L5 9z"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linejoin="round"
    />
    <path
      d="M9 9V7a3 3 0 0 1 6 0v2"
      stroke="currentColor"
      stroke-width="1.5"
      stroke-linecap="round"
    />
    <text
      v-if="count > 0"
      class="bag-icon__count"
      x="12"
      y="17"
      text-anchor="middle"
      dominant-baseline="middle"
    >
      {{ displayCount }}
    </text>
  </svg>
</template>

<script setup>
import { computed } from 'vue';

const props = defineProps({
  count: {
    type: Number,
    default: 0
  },
  size: {
    type: [Number, String],
    default: 28
  }
});

const displayCount = computed(() => {
  if (props.count > 99) return '99+';
  return String(props.count);
});
</script>

<style scoped>
.bag-icon {
  display: block;
  flex-shrink: 0;
}

.bag-icon__count {
  font-family: var(--font-sans);
  font-size: 12px;
  font-weight: 700;
  fill: currentColor;
  pointer-events: none;
}
</style>
