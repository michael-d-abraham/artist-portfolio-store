<template>
  <nav v-if="links.length" class="social-icon-links" aria-label="Social media">
    <a
      v-for="link in links"
      :key="link.platform"
      :href="link.url"
      class="social-icon-links__item"
      target="_blank"
      rel="noopener noreferrer"
      :aria-label="labels[link.platform] || link.platform"
    >
      <SocialPlatformIcon :platform="link.platform" />
    </a>
  </nav>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPublicSocialLinks } from '../../services/api.js';
import { PLATFORM_LABELS } from '@shared/socialLinksDefaults.js';
import SocialPlatformIcon from './SocialPlatformIcon.vue';

const labels = PLATFORM_LABELS;

const links = ref([]);

onMounted(async () => {
  try {
    const data = await getPublicSocialLinks();
    links.value = Array.isArray(data.links) ? data.links : [];
  } catch {
    links.value = [];
  }
});
</script>

<style scoped>
.social-icon-links {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--space-xl);
  width: 100%;
}

.social-icon-links__item {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 3rem;
  height: 3rem;
  text-decoration: none;
  border-radius: var(--radius-sm);
  transition: opacity 0.2s ease, background 0.2s ease;
}

.social-icon-links__item:hover {
  opacity: 0.5;
  background: transparent;
}

@media (max-width: 640px) {
  .social-icon-links {
    gap: var(--space-md);
  }

  .social-icon-links__item {
    width: 2.5rem;
    height: 2.5rem;
  }
}
</style>
