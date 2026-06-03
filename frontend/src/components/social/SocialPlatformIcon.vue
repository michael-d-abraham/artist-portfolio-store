<template>
  <img
    v-if="icon"
    class="social-platform-icon"
    :src="icon.src"
    :srcset="icon.srcSet"
    sizes="20px"
    :alt="icon.alt"
    width="20"
    height="20"
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
  width: 20px;
  height: 20px;
  object-fit: cover;
  flex-shrink: 0;
}
</style>
