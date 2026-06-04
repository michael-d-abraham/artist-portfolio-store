<template>
  <div class="contact">
    <h1 class="page-hero-title">Contact</h1>
    <div v-if="submitted" class="contact-success" role="status">
      <p class="contact-success__message">{{ successMessage }}</p>
      <router-link to="/gallery" class="btn-primary contact-success__back">Back to gallery</router-link>
    </div>

    <div v-else class="contact-layout">
      <div class="contact-hero">
        <img
          v-if="heroImageUrl"
          class="contact-hero__img"
          :src="heroImageUrl"
          alt="Artist portrait"
        />
        <span v-else class="contact-hero__caption">Artist portrait — placeholder</span>
      </div>

      <form class="form contact-form" @submit.prevent="onSubmit" autocomplete="on">
        <label>
          Name
          <input v-model.trim="name" name="name" type="text" autocomplete="name" required>
        </label>
        <label for="contact-visitor-email">
          Your email
          <input
            id="contact-visitor-email"
            v-model.trim="email"
            name="visitor_email"
            type="email"
            autocomplete="email"
            required
          >
        </label>
        <label>
          Subject
          <input v-model.trim="subject" name="subject" type="text" required>
        </label>
        <label>
          Message
          <textarea v-model.trim="message" name="message" rows="6" required></textarea>
        </label>
        <p v-if="submitError" class="error contact-form__error">{{ submitError }}</p>
        <button type="submit" class="btn-primary" :disabled="busy">
          {{ busy ? 'Submitting…' : 'Submit' }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPublicContactHero, submitContactForm } from '../services/api.js';

const heroImageUrl = ref('');

const name = ref('');
const email = ref('');
const subject = ref('');
const message = ref('');
const submitted = ref(false);
const busy = ref(false);
const submitError = ref('');
const successMessage = ref('Message sent successfully.');

function validateForm() {
  if (!String(name.value).trim()) return 'Name is required.';
  if (!String(email.value).trim()) return 'Email is required.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email.value).trim())) {
    return 'Enter a valid email address.';
  }
  if (!String(subject.value).trim()) return 'Subject is required.';
  if (!String(message.value).trim()) return 'Message is required.';
  return null;
}

async function onSubmit() {
  submitError.value = '';
  const validationError = validateForm();
  if (validationError) {
    submitError.value = validationError;
    return;
  }

  busy.value = true;
  try {
    const result = await submitContactForm({
      name: name.value,
      email: email.value,
      subject: subject.value,
      message: message.value
    });
    successMessage.value = result.message || 'Message sent successfully.';
    submitted.value = true;
  } catch (e) {
    submitError.value = e.message || 'Unable to send message.';
  } finally {
    busy.value = false;
  }
}

onMounted(async () => {
  try {
    const data = await getPublicContactHero();
    heroImageUrl.value = data?.image_url ? String(data.image_url) : '';
  } catch {
    heroImageUrl.value = '';
  }
});
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
  overflow: hidden;
}

.contact-hero__img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  display: block;
}

.contact-hero:has(.contact-hero__img) {
  padding: 0;
  align-items: stretch;
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

.contact-form__error {
  margin: 0;
}

.contact-success {
  max-width: var(--max-width-narrow);
  margin: 0 auto;
  padding: var(--space-2xl) 0 var(--space-xl);
  text-align: center;
}

.contact-success__message {
  margin: 0 0 var(--space-xl);
  font-size: 0.875rem;
  font-weight: 300;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}

.contact-success__back {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 44px;
  min-width: 12rem;
  padding: 0.65rem 1.5rem;
  text-decoration: none;
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

  .page-hero-title {
    margin-bottom: var(--space-md);
  }

  .form button {
    width: 100%;
    align-self: stretch;
    min-height: 48px;
  }

  .contact-success__back {
    width: 100%;
    min-width: 0;
  }
}
</style>
