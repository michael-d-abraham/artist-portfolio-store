<template>
  <div class="admin-social admin-social--embedded">
    <p v-if="loading" class="admin-social__status">Loading…</p>
    <p v-else-if="loadError" class="error admin-social__status">{{ loadError }}</p>

    <form v-else class="admin-social__form" @submit.prevent="onSubmit">
      <section class="admin-social__section" aria-labelledby="contact-section-heading">
        <h2 id="contact-section-heading" class="admin-social__section-title">Contact</h2>
        <p class="admin-social__section-hint">Form submissions from the Contact page are emailed to this address.</p>
        <div class="contact-email-field">
          <label for="contact-email" class="contact-email-field__label">Notification email</label>
          <input
            id="contact-email"
            v-model="contactEmail"
            type="email"
            class="contact-email-field__input"
            placeholder="you@example.com"
            autocomplete="email"
          />
          <p v-if="contactEmailError" class="field-error">{{ contactEmailError }}</p>
        </div>
      </section>

      <section class="admin-social__section" aria-labelledby="social-section-heading">
        <h2 id="social-section-heading" class="admin-social__section-title">Social links</h2>
        <div
          v-for="platform in platforms"
          :key="platform.id"
          class="platform-row"
        >
          <SocialPlatformIcon :platform="platform.id" class="platform-row__icon" />
          <div class="platform-row__fields">
            <input
              :id="'url-' + platform.id"
              v-model="form[platform.id].url"
              type="url"
              class="platform-row__url"
              :placeholder="platform.placeholder"
              :aria-label="`${platform.label} URL`"
              autocomplete="url"
            />
            <label class="platform-row__check" :for="'enabled-' + platform.id">
              <input
                :id="'enabled-' + platform.id"
                v-model="form[platform.id].enabled"
                type="checkbox"
              />
              <span>Include</span>
            </label>
          </div>
          <p v-if="fieldErrors[platform.id]" class="field-error platform-row__error">
            {{ fieldErrors[platform.id] }}
          </p>
        </div>
      </section>

      <footer class="admin-social__footer">
        <p v-if="submitError" class="error">{{ submitError }}</p>
        <p v-if="saved" class="admin-social__success" role="status">Saved.</p>
        <button type="submit" class="btn-primary admin-social__save" :disabled="submitting">
          {{ submitting ? 'Saving…' : 'Save' }}
        </button>
      </footer>
    </form>
  </div>
</template>

<script setup>
import { reactive, ref, onMounted } from 'vue';

import { getAdminSocialLinks, updateAdminSocialLinks } from '../services/api.js';
import SocialPlatformIcon from '../components/social/SocialPlatformIcon.vue';
import {
  PLATFORMS,
  DEFAULT_SOCIAL_LINKS,
  PLATFORM_LABELS
} from '@shared/socialLinksDefaults.js';

const PLATFORM_PLACEHOLDERS = {
  youtube: 'https://www.youtube.com/@channel',
  instagram: 'https://www.instagram.com/handle',
  tiktok: 'https://www.tiktok.com/@handle',
  facebook: 'https://www.facebook.com/page'
};

const platforms = PLATFORMS.map((id) => ({
  id,
  label: PLATFORM_LABELS[id],
  placeholder: PLATFORM_PLACEHOLDERS[id]
}));

const form = reactive(
  Object.fromEntries(
    PLATFORMS.map((id) => [id, { ...DEFAULT_SOCIAL_LINKS[id] }])
  )
);

const contactEmail = ref('');
const contactEmailError = ref('');
const loading = ref(true);
const loadError = ref('');
const submitError = ref('');
const saved = ref(false);
const submitting = ref(false);
const fieldErrors = reactive(
  Object.fromEntries(PLATFORMS.map((id) => [id, '']))
);

function applySettings(data) {
  contactEmail.value =
    data?.contact_email != null ? String(data.contact_email) : '';
  const links = data?.social_links || {};
  platforms.forEach(({ id }) => {
    const row = links[id] || {};
    form[id].url = row.url || form[id].url;
    form[id].enabled = row.enabled !== false;
  });
}

onMounted(async () => {
  loading.value = true;
  loadError.value = '';
  try {
    const data = await getAdminSocialLinks();
    applySettings(data);
  } catch (e) {
    loadError.value = e.message || 'Failed to load links';
  } finally {
    loading.value = false;
  }
});

function clearFieldErrors() {
  contactEmailError.value = '';
  platforms.forEach(({ id }) => {
    fieldErrors[id] = '';
  });
}

async function onSubmit() {
  submitError.value = '';
  saved.value = false;
  clearFieldErrors();
  submitting.value = true;

  try {
    const data = await updateAdminSocialLinks({
      contact_email: contactEmail.value,
      social_links: {
        youtube: { url: form.youtube.url, enabled: form.youtube.enabled },
        instagram: { url: form.instagram.url, enabled: form.instagram.enabled },
        tiktok: { url: form.tiktok.url, enabled: form.tiktok.enabled },
        facebook: { url: form.facebook.url, enabled: form.facebook.enabled }
      }
    });
    applySettings(data);
    saved.value = true;
  } catch (e) {
    const errs = e.data?.errors;
    if (Array.isArray(errs)) {
      errs.forEach((msg) => {
        if (msg.includes('contact_email')) {
          contactEmailError.value = msg;
        }
        platforms.forEach(({ id }) => {
          if (msg.includes(id)) {
            fieldErrors[id] = msg;
          }
        });
      });
      if (!contactEmailError.value && !platforms.some(({ id }) => fieldErrors[id])) {
        submitError.value = errs.join(' ');
      }
    } else {
      submitError.value = e.message || 'Failed to save';
    }
  } finally {
    submitting.value = false;
  }
}
</script>

<style scoped>
.admin-social {
  width: 100%;
  max-width: 100%;
  box-sizing: border-box;
}

.admin-social__status {
  margin: 0;
}

.admin-social__form {
  width: 100%;
  margin: 0;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
}

.admin-social__section {
  margin-bottom: var(--space-xl);
}

.admin-social__section-title {
  margin: 0 0 var(--space-xs);
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.admin-social__section-hint {
  margin: 0 0 var(--space-md);
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.45;
}

.contact-email-field {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  max-width: 24rem;
}

.contact-email-field__label {
  font-size: 0.6875rem;
  font-weight: 400;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  color: var(--color-text);
}

.contact-email-field__input {
  width: 100%;
  min-height: 44px;
  padding: 0 0.65rem;
  box-sizing: border-box;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.platform-row {
  display: grid;
  grid-template-columns: 2rem 1fr;
  grid-template-rows: auto auto;
  column-gap: var(--space-sm);
  row-gap: 0.25rem;
  align-items: center;
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.platform-row:last-of-type {
  border-bottom: none;
}

.platform-row__icon {
  grid-row: 1 / span 2;
  align-self: center;
}

.platform-row__fields {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  min-width: 0;
}

.platform-row__url {
  width: 100%;
  min-height: 44px;
  height: 44px;
  padding: 0 0.65rem;
  box-sizing: border-box;
  font-size: 1rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
}

.platform-row__check {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.75rem;
  font-weight: 500;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-text-muted);
  cursor: pointer;
  margin: 0;
}

.platform-row__check input {
  width: auto;
  margin: 0;
}

.platform-row__error {
  grid-column: 2;
  margin: 0;
}

.admin-social__footer {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: var(--space-sm);
  margin-top: var(--space-md);
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.admin-social__success {
  margin: 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
}

.admin-social__save {
  min-height: 44px;
  margin-left: auto;
}

@media (min-width: 640px) {
  .platform-row {
    grid-template-columns: 2rem 1fr auto;
    grid-template-rows: auto;
    column-gap: var(--space-md);
    padding: 0.65rem 0;
  }

  .platform-row__icon {
    grid-row: 1;
  }

  .platform-row__fields {
    flex-direction: row;
    align-items: center;
    gap: var(--space-md);
  }

  .platform-row__url {
    flex: 1;
    min-width: 0;
  }

  .platform-row__check {
    flex-shrink: 0;
    white-space: nowrap;
  }

  .platform-row__error {
    grid-column: 2 / -1;
  }
}

@media (max-width: 639px) {
  .admin-social__save {
    width: 100%;
    margin-left: 0;
  }
}
</style>
