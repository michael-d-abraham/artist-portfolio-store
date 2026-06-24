<template>
  <div class="contact-page">
    <h1 class="page-hero-title">{{ pageTitle }}</h1>
    <div v-if="submitted" class="contact-page__success" role="status">
      <p class="contact-page__success-message">{{ successMessage }}</p>
      <router-link to="/gallery" class="btn-primary contact-page__success-back">Back to gallery</router-link>
    </div>

    <div
      v-else
      class="contact-page__layout"
      :class="{ 'contact-page__layout--no-hero': !showHeroImage }"
    >
      <div v-if="showHeroImage && heroImageUrl" class="contact-page__hero">
        <img
          class="contact-page__hero-img"
          :src="heroImageUrl"
          alt="Artist portrait"
        />
      </div>

      <form class="form contact-page__form" @submit.prevent="onSubmit" autocomplete="on">
        <label>
          {{ formNameLabel }}
          <input v-model.trim="name" name="name" type="text" autocomplete="name" required>
        </label>
        <label for="contact-visitor-email">
          {{ formEmailLabel }}
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
          {{ formSubjectLabel }}
          <input v-model.trim="subject" name="subject" type="text" required>
        </label>
        <label>
          {{ formMessageLabel }}
          <textarea v-model.trim="message" name="message" rows="6" required></textarea>
        </label>
        <p v-if="submitError" class="error contact-form__error">{{ submitError }}</p>
        <button type="submit" class="btn-primary" :disabled="busy">
          {{ busy ? 'Submitting…' : formSubmitLabel }}
        </button>
      </form>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getPublicContactHero, submitContactForm } from '../services/api.js';
import { applyContactPageDefaults } from '../constants/contactPageDefaults.js';
import { isValidEmail } from '@shared/email.js';

const heroImageUrl = ref('');
const showHeroImage = ref(true);
const pageTitle = ref('Contact');
const formNameLabel = ref('Name');
const formEmailLabel = ref('Your email');
const formSubjectLabel = ref('Subject');
const formMessageLabel = ref('Message');
const formSubmitLabel = ref('Submit');
const successMessage = ref('Message sent successfully.');

const name = ref('');
const email = ref('');
const subject = ref('');
const message = ref('');
const submitted = ref(false);
const busy = ref(false);
const submitError = ref('');

function validateForm() {
  if (!String(name.value).trim()) return 'Name is required.';
  if (!String(email.value).trim()) return 'Email is required.';
  if (!isValidEmail(String(email.value).trim())) {
    return 'Enter a valid email address.';
  }
  if (!String(subject.value).trim()) return 'Subject is required.';
  if (!String(message.value).trim()) return 'Message is required.';
  return null;
}

function applyPageConfig(data) {
  const config = applyContactPageDefaults({
    ...data,
    contact_hero_image_url: data?.image_url || ''
  });
  showHeroImage.value = config.show_hero_image;
  heroImageUrl.value = config.contact_hero_image_url;
  pageTitle.value = config.page_title;
  formNameLabel.value = config.form_name_label;
  formEmailLabel.value = config.form_email_label;
  formSubjectLabel.value = config.form_subject_label;
  formMessageLabel.value = config.form_message_label;
  formSubmitLabel.value = config.form_submit_label;
  successMessage.value = config.success_message;
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
    successMessage.value = result.message || successMessage.value;
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
    applyPageConfig(data);
  } catch {
    applyPageConfig({});
  }
});
</script>

<style scoped>
.contact-form__error {
  margin: 0;
}

@media (max-width: 640px) {
  .contact-page__success-back {
    width: 100%;
    min-width: 0;
    pointer-events: auto;
  }
}
</style>
