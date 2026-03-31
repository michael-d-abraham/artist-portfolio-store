<template>
  <div class="admin-login">
    <header>
      <h1 class="page-title">Admin sign in</h1>
      <p class="sub text-muted">Session-based login (same-origin cookie). Storefront routes stay public.</p>
    </header>
    <form class="form" @submit.prevent="onSubmit">
      <label>
        Username
        <input v-model.trim="username" name="username" autocomplete="username" required>
      </label>
      <label>
        Password
        <input
          v-model="plainPassword"
          name="password"
          type="password"
          autocomplete="current-password"
          required
        >
      </label>
      <p v-if="error" class="error">{{ error }}</p>
      <button type="submit" class="btn-primary" :disabled="busy">{{ busy ? 'Signing in…' : 'Sign in' }}</button>
    </form>
    <p class="back">
      <router-link to="/">← Back to gallery</router-link>
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
    const redirect = typeof route.query.redirect === 'string' ? route.query.redirect : '/admin';
    await router.replace(redirect || '/admin');
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
  max-width: var(--max-width-narrow);
  margin: 0 auto;
  padding: var(--space-xl) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-float);
}

.admin-login .page-title {
  margin-bottom: var(--space-sm);
}

.sub {
  margin: 0 0 var(--space-lg);
  font-size: 0.9375rem;
  line-height: 1.5;
}

.form {
  display: flex;
  flex-direction: column;
  gap: var(--space-md);
}

.form label {
  display: flex;
  flex-direction: column;
  gap: var(--space-xs);
  font-size: 0.875rem;
  font-weight: 600;
  color: var(--color-text);
}

.form button {
  align-self: flex-start;
  margin-top: var(--space-xs);
}

.error {
  font-size: 0.9rem;
}

.back {
  margin-top: var(--space-lg);
  font-size: 0.9375rem;
}
</style>
