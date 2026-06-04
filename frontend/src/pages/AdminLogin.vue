<template>
  <div class="admin-login">
    <h1 class="page-title">Admin sign in</h1>

    <form class="admin-login__form" @submit.prevent="onSubmit">
      <label class="admin-login__field">
        <span class="admin-login__field-label">Username</span>
        <input
          v-model.trim="username"
          class="admin-login__input"
          name="username"
          type="text"
          autocomplete="username"
          required
        >
      </label>

      <label class="admin-login__field">
        <span class="admin-login__field-label">Password</span>
        <input
          v-model="plainPassword"
          class="admin-login__input"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        >
      </label>

      <p v-if="error" class="error admin-login__error">{{ error }}</p>

      <button type="submit" class="btn-primary admin-login__submit" :disabled="busy">
        {{ busy ? 'Signing in…' : 'Sign in' }}
      </button>
    </form>

    <p class="admin-login__back">
      <router-link to="/gallery">← Back to gallery</router-link>
    </p>
  </div>
</template>

<script setup>
import { ref } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { loginAdmin } from '../services/api.js';

const route = useRoute();
const router = useRouter();

const username = ref('');
const plainPassword = ref('');
const error = ref('');
const busy = ref(false);

async function onSubmit() {
  error.value = '';
  busy.value = true;
  try {
    await loginAdmin({
      username: username.value,
      plainPassword: plainPassword.value
    });
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin/dashboard';
    await router.replace(redirect || '/admin/dashboard');
  } catch (e) {
    if (e.status === 401) {
      error.value = 'Invalid username or password.';
    } else {
      error.value = e.message || 'Sign-in failed';
    }
  } finally {
    busy.value = false;
  }
}
</script>

<style scoped>
.admin-login {
  width: 100%;
  max-width: var(--max-width-narrow);
  margin: 0 auto;
  padding: var(--space-lg) 0 var(--space-2xl);
  box-sizing: border-box;
}

.admin-login .page-title {
  margin: 0 0 var(--space-xl);
  text-align: center;
}

.admin-login__form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
  width: 100%;
}

.admin-login__field {
  display: flex;
  flex-direction: column;
  gap: var(--space-sm);
  width: 100%;
  margin: 0;
  cursor: pointer;
}

.admin-login__field-label {
  font-size: 0.8125rem;
  font-weight: 500;
  letter-spacing: 0.06em;
  text-transform: uppercase;
  color: var(--color-text);
}

.admin-login__input {
  display: block;
  width: 100%;
  min-height: 48px;
  height: 48px;
  padding: 0 0.75rem;
  margin: 0;
  box-sizing: border-box;
  font-family: inherit;
  font-size: 1rem;
  font-weight: 400;
  line-height: 1.4;
  letter-spacing: 0.02em;
  color: var(--color-text);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: none;
  -webkit-appearance: none;
  appearance: none;
}

.admin-login__input:focus-visible {
  outline: none;
  border-color: var(--color-text);
  box-shadow: var(--focus-ring);
}

.admin-login__error {
  margin: 0;
  font-size: 0.9375rem;
}

.admin-login__submit {
  width: 100%;
  min-height: 48px;
  margin-top: var(--space-xs);
  padding: 0.75rem 1.25rem;
  box-sizing: border-box;
}

.admin-login__back {
  margin: var(--space-xl) 0 0;
  text-align: center;
  font-size: 0.9375rem;
}

.admin-login__back a {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}

@media (min-width: 641px) {
  .admin-login {
    padding-top: var(--space-xl);
  }

  .admin-login__submit {
    width: auto;
    min-width: 12rem;
    align-self: flex-start;
  }
}

@media (max-width: 640px) {
  .admin-login {
    max-width: 100%;
    padding-left: 20px;
    padding-right: 20px;
  }
}

@media (max-width: 390px) {
  .admin-login {
    padding-left: 16px;
    padding-right: 16px;
  }
}
</style>
