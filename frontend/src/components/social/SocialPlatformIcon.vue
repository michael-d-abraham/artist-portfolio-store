<template>
  <img
    v-if="icon"
    class="social-platform-icon"
    :src="icon.src"
    :srcset="icon.srcSet"
    :sizes="`${icon.width}px`"
    :alt="icon.alt"
    :width="icon.width"
    :height="icon.height"
    loading="lazy"
    decoding="async"
  />
</template>

<script setup>
import { computed } from 'vue';
import { SOCIAL_PLATFORM_ICONS } from '../../constants/socialPlatformIcons.js';

const props = defineProps({
  platform: {
    type: String,
    required: true
  }
});

const icon = computed(() => SOCIAL_PLATFORM_ICONS[props.platform] || null);
</script>

<style scoped>
.social-platform-icon {
  display: block;
  width: 36px;
  height: 36px;
  max-width: 36px;
  max-height: 36px;
  object-fit: contain;
  flex-shrink: 0;
}
</style>
