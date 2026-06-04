<template>
  <section class="home-about" aria-labelledby="home-about-heading">
    <div class="home-about__container mobile-safe-container">
      <h2 id="home-about-heading" class="home-about__title page-hero-title">
        {{ sectionTitle }}
      </h2>
      <div class="home-about__grid">
        <div class="home-about__text">
          <h3 v-if="header" class="home-about__header">{{ header }}</h3>
          <p v-if="text" class="home-about__copy">{{ text }}</p>
        </div>
        <figure v-if="imageUrl" class="home-about__media">
          <img
            class="home-about__image"
            :src="imageUrl"
            alt=""
          />
        </figure>
        <div v-else class="home-about__media home-about__media--empty" aria-hidden="true" />
      </div>
    </div>
  </section>
</template>

<script setup>
defineProps({
  sectionTitle: { type: String, required: true },
  header: { type: String, default: '' },
  text: { type: String, default: '' },
  imageUrl: { type: String, default: '' }
});
</script>

<style scoped>
.home-about {
  width: 100%;
  padding: 0 0 var(--space-3xl);
  background: #f7f7f7;
  border-top: 1px solid var(--color-border);
}

.home-about__container {
  max-width: 1100px;
  margin: 0 auto;
  padding: var(--space-xl) 32px 0;
}

.home-about__title {
  margin: 0 0 var(--space-2xl);
  font-size: clamp(1.25rem, 3.25vw, 1.875rem);
  text-align: center;
}

.home-about__grid {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-2xl);
  align-items: start;
}

.home-about__header {
  margin: 0 0 var(--space-md);
  padding: var(--space-md) var(--space-lg);
  font-family: var(--font-sans);
  font-size: clamp(1rem, 2vw, 1.25rem);
  font-weight: 500;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  line-height: 1.4;
  color: var(--color-text);
  border: 1px solid var(--color-border);
  background: var(--color-surface);
}

.home-about__copy {
  margin: 0;
  font-size: 1rem;
  line-height: 1.7;
  color: var(--color-text);
  white-space: pre-line;
}

.home-about__image {
  display: block;
  width: 100%;
  height: auto;
  max-width: 100%;
}

.home-about__media--empty {
  min-height: 200px;
  background: var(--color-border);
}

@media (min-width: 641px) {
  .home-about__container {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .home-about__container {
    padding: var(--space-lg) 20px 0;
  }

  .home-about__title {
    margin-bottom: var(--space-xl);
  }

  .home-about__grid {
    grid-template-columns: 1fr;
    gap: var(--space-xl);
  }

  .home-about__media {
    order: 2;
  }

  .home-about__text {
    order: 1;
  }
}

@media (max-width: 390px) {
  .home-about__container {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
