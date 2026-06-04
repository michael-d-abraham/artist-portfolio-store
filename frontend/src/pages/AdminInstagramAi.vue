<!--
  Admin page: rough listing description → Instagram hooks, captions, CTAs, hashtags (via /api/admin/ai).
  Personalized voice persists in localStorage; hearts POST liked lines to /api/admin/ai/save-preferred.
-->
<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">AI</h1>
    </header>

    <section class="admin-float admin-float--padded">
      <div class="field-row">
        <div class="field">
          <label for="tone">Tone</label>
          <select id="tone" v-model="tone">
            <option value="Poetic">Poetic — emotional, artistic, expressive</option>
            <option value="Simple">Simple — clear, short, easy to read</option>
            <option value="Emotional">Emotional — feeling-focused, personal</option>
            <option value="Sales">Sales — slightly persuasive, product-aware</option>
            <option value="Luxury">Luxury — premium, collector-focused</option>
          </select>
        </div>
        <div class="field">
          <label for="focus">Focus</label>
          <select id="focus" v-model="focus">
            <option value="Engagement">Engagement — likes, comments, shares</option>
            <option value="Sell">Sell — drive purchase or clicks</option>
            <option value="Story">Story — tell meaning behind the piece</option>
            <option value="Awareness">Awareness — just showcase the work</option>
          </select>
        </div>
      </div>
      <div class="field">
        <label for="desc">Rough listing description</label>
        <textarea
          id="desc"
          v-model="userInput"
          rows="6"
          placeholder="Describe the piece in your own words — messy notes are fine."
        />
      </div>
      <div class="field">
        <label for="voice">Personalized voice (saved in this browser)</label>
        <textarea
          id="voice"
          v-model="personalizedVoice"
          rows="4"
          placeholder="e.g. keep tone reflective; short captions; soft CTAs…"
          @blur="persistVoice"
        />
      </div>
      <p v-if="error" class="error">{{ error }}</p>
      <button
        type="button"
        class="admin-panel__btn-primary"
        :disabled="generating"
        @click="onGenerate"
      >
        {{ generating ? 'Generating…' : 'Generate' }}
      </button>
    </section>

    <section v-if="result" class="admin-float admin-float--padded admin-ai-output">
      <h2 class="admin-float-card__title">Generated content</h2>

      <h2>Hooks</h2>
      <ul class="admin-ai-lines">
        <li v-for="(h, i) in result.hooks" :key="'h' + i">
          <span class="admin-ai-lines__text">{{ h }}</span>
          <button
            type="button"
            class="admin-ai-lines__heart is-icon"
            :class="{ on: saved.has(heartKey('hook', h)) }"
            title="Save this hook"
            aria-label="Save this hook"
            @click="onHeart('hook', h)"
          >
            ♥
          </button>
        </li>
      </ul>

      <h2>Captions</h2>
      <ul class="admin-ai-lines">
        <li v-for="(c, i) in result.captions" :key="'c' + i">
          <span class="admin-ai-lines__text">{{ c }}</span>
          <button
            type="button"
            class="admin-ai-lines__heart is-icon"
            :class="{ on: saved.has(heartKey('caption', c)) }"
            title="Save this caption"
            aria-label="Save this caption"
            @click="onHeart('caption', c)"
          >
            ♥
          </button>
        </li>
      </ul>

      <h2>Calls to action</h2>
      <ul class="admin-ai-lines">
        <li v-for="(t, i) in result.ctas" :key="'t' + i">
          <span class="admin-ai-lines__text">{{ t }}</span>
          <button
            type="button"
            class="admin-ai-lines__heart is-icon"
            :class="{ on: saved.has(heartKey('cta', t)) }"
            title="Save this CTA"
            aria-label="Save this CTA"
            @click="onHeart('cta', t)"
          >
            ♥
          </button>
        </li>
      </ul>

      <h2>Hashtags</h2>
      <p class="admin-ai-hashtags">{{ result.hashtags.join(' ') }}</p>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { generateIgContent, savePreferredExample } from '../services/api.js';

const VOICE_KEY = 'igPersonalizedVoice';

const userInput = ref('');
const personalizedVoice = ref('');
const tone = ref('Simple');
const focus = ref('Story');
const generating = ref(false);
const error = ref('');
const result = ref(null);

/** Tracks items successfully saved this session (for filled heart state). */
const saved = ref(new Set());

onMounted(() => {
  try {
    const v = localStorage.getItem(VOICE_KEY);
    if (v != null) personalizedVoice.value = v;
  } catch {
    /* ignore */
  }
});

function persistVoice() {
  try {
    localStorage.setItem(VOICE_KEY, personalizedVoice.value);
  } catch {
    /* ignore */
  }
}

function heartKey(type, text) {
  return `${type}:${text}`;
}

async function onGenerate() {
  error.value = '';
  result.value = null;
  const desc = userInput.value.trim();
  if (!desc) {
    error.value = 'Please enter a description.';
    return;
  }
  persistVoice();
  generating.value = true;
  try {
    const data = await generateIgContent({
      userInput: desc,
      personalizedVoice: personalizedVoice.value.trim(),
      tone: tone.value,
      focus: focus.value
    });
    result.value = data;
  } catch (e) {
    error.value = e.message || 'Generation failed';
  } finally {
    generating.value = false;
  }
}

async function onHeart(type, text) {
  const t = String(text).trim();
  if (!t) return;
  const key = heartKey(type, t);
  try {
    await savePreferredExample({ type, text: t });
    const next = new Set(saved.value);
    next.add(key);
    saved.value = next;
  } catch (e) {
    error.value = e.message || 'Could not save preference';
  }
}
</script>
