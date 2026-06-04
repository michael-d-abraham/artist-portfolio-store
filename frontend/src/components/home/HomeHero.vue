<template>
  <section class="home-hero hero-display" aria-label="Hero">
    <div class="home-hero__inner hero-display__inner mobile-safe-container">
      <img
        v-if="imageUrl"
        class="home-hero__image hero-display__photo"
        :src="imageUrl"
        alt=""
      />
      <div
        v-else
        class="home-hero__image home-hero__image--placeholder"
        role="img"
        aria-label="Hero image placeholder"
      />
    </div>
  </section>
</template>

<script setup>
defineProps({
  imageUrl: { type: String, default: '' }
});
</script>

<style scoped>
.home-hero {
  padding: var(--space-lg) 0;
  background: var(--color-bg);
  border: none;
  border-bottom: none;
}

.home-hero__image {
  border: none;
  border-bottom: none;
  box-shadow: none;
  outline: none;
}

.home-hero__inner {
  max-width: 1100px;
  margin: 0 auto;
  padding: 0 32px;
}

.home-hero__image--placeholder {
  width: 100%;
  max-width: 900px;
  aspect-ratio: 16 / 9;
  min-height: 180px;
  max-height: calc(var(--home-hero-max-height) - 2 * var(--space-lg));
  background: var(--color-border);
}

@media (min-width: 641px) {
  .home-hero {
    padding-bottom: var(--space-2xl);
  }

  .home-hero__inner {
    max-width: none;
    padding: 0;
  }

  .home-hero__image--placeholder {
    max-width: 75vw;
    max-height: calc(var(--home-hero-max-height) - var(--space-lg) - var(--space-2xl));
  }
}

@media (max-width: 640px) {
  .home-hero {
    padding: var(--space-md) 0 var(--space-xl);
  }

  .home-hero__inner {
    padding: 0 20px;
  }

  .home-hero__image--placeholder {
    aspect-ratio: 4 / 3;
    min-height: 160px;
    max-height: calc(var(--home-hero-max-height) - var(--space-md) - var(--space-xl));
  }
}

@media (max-width: 390px) {
  .home-hero__inner {
    padding: 0 16px;
  }
}
</style>
