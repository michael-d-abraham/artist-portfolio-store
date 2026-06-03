<template>
  <div class="checkout-result">
    <h1 class="page-title">Checkout canceled</h1>
    <p class="lead">No charge was made. You can review your order and try again.</p>
    <button type="button" class="btn-primary preview-btn" @click="goToPreview">
      Return to order preview
    </button>
    <router-link to="/" class="link-back">Back to gallery</router-link>
  </div>
</template>

<script setup>
import { useRouter } from 'vue-router';

const router = useRouter();

function goToPreview() {
  router.push({ name: 'checkout' });
}
</script>

<style scoped>
.checkout-result {
  max-width: 32rem;
  margin: 0 auto;
  padding: var(--space-2xl) 0 var(--space-3xl);
  text-align: center;
}

.checkout-result .page-title {
  margin-bottom: var(--space-xl);
}

.lead {
  margin: 0 0 var(--space-xl);
  line-height: 1.7;
  font-weight: 300;
  color: var(--color-text-muted);
}

.preview-btn {
  display: inline-block;
  min-width: 14rem;
  margin-bottom: var(--space-lg);
  padding: 0.75rem 2rem;
  cursor: pointer;
}

.link-back {
  display: inline-block;
  font-size: 0.6875rem;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  text-decoration: underline;
  text-underline-offset: 0.25em;
  color: var(--color-text);
}

.link-back:hover {
  opacity: 0.5;
}

@media (max-width: 640px) {
  .checkout-result {
    max-width: 100%;
    padding: var(--space-xl) 0 var(--space-2xl);
  }

  .preview-btn {
    width: 100%;
    min-width: 0;
    min-height: 48px;
  }

  .link-back {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 0.8125rem;
  }
}
</style>
