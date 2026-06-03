<template>
  <div class="contact">
    <h1 class="page-hero-title">Contact</h1>
    <div v-if="submitted" class="contact-success" role="status">
      <p>Thanks for submitting!</p>
    </div>

    <div v-else class="contact-layout">
      <div class="contact-hero" aria-hidden="true">
        <span class="contact-hero__caption">Artist portrait — placeholder</span>
      </div>

      <form class="form contact-form" @submit.prevent="onSubmit">
        <label>
          Name
          <input v-model.trim="name" name="name" type="text" autocomplete="name" required>
        </label>
        <label>
          Email
          <input v-model.trim="email" name="email" type="email" autocomplete="email" required>
        </label>
        <label>
          Subject
          <input v-model.trim="subject" name="subject" type="text" required>
        </label>
        <label>
          Message
          <textarea v-model.trim="message" name="message" rows="6" required></textarea>
        </label>
        <button type="submit" class="btn-primary" :disabled="busy">
          {{ busy ? 'Submitting…' : 'Submit' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';

const name = ref('');
const email = ref('');
const subject = ref('');
const message = ref('');
const submitted = ref(false);
const busy = ref(false);

function onSubmit() {
  busy.value = true;
  submitted.value = true;
  busy.value = false;
}
</script>

<style scoped>
.contact {
  padding-bottom: var(--space-xl);
}

.page-hero-title {
  margin: 0 0 var(--space-2xl);
  text-align: center;
}

.contact-layout {
  display: flex;
  flex-direction: column;
  gap: var(--space-xl);
}

.contact-hero {
  aspect-ratio: 4 / 5;
  max-height: 28rem;
  background: var(--color-surface);
  border: none;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: var(--space-md);
}

.contact-hero__caption {
  font-size: 0.875rem;
  color: var(--color-text-muted);
  text-align: center;
}

.contact-form {
  max-width: var(--max-width-narrow);
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form label {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  font-size: 0.6875rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
}

.form textarea {
  min-height: 8rem;
}

.form button {
  align-self: flex-start;
  margin-top: var(--space-xs);
}

.contact-success {
  max-width: var(--max-width-narrow);
  padding: var(--space-xl) 0;
  border-top: 1px solid var(--color-border);
}

.contact-success p {
  margin: 0;
  font-size: 0.875rem;
  font-weight: 300;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  text-align: center;
}

@media (min-width: 48rem) {
  .contact-layout {
    display: grid;
    grid-template-columns: minmax(12rem, 1fr) minmax(0, var(--max-width-narrow));
    gap: var(--space-2xl);
    align-items: start;
  }

  .contact-hero {
    max-height: none;
    min-height: 20rem;
  }

  .contact-form {
    max-width: none;
  }
}

@media (max-width: 640px) {
  .contact {
    padding-bottom: var(--space-lg);
  }

  .form button {
    width: 100%;
    align-self: stretch;
    min-height: 48px;
  }
}
</style>
