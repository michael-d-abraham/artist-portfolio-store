<!--
  Admin page: rough artwork description → Instagram hooks, captions, CTAs, hashtags (via /api/admin/ai).
  Personalized voice persists in localStorage; hearts POST liked lines to /api/admin/ai/save-preferred.
-->
<template>
  <div class="ig-ai-page">
    <header class="top">
      <h1 class="page-title top__title">CaptionGenerator</h1>
      <router-link to="/admin">← Back to artworks</router-link>
    </header>

    <section class="inputs">
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
        <label for="desc">Rough artwork description</label>
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
      <button type="button" class="btn-primary" :disabled="generating" @click="onGenerate">
        {{ generating ? 'Generating…' : 'Generate' }}
      </button>
    </section>

    <section v-if="result" class="output">
      <h2>Hooks</h2>
      <ul class="lines">
        <li v-for="(h, i) in result.hooks" :key="'h' + i">
          <span class="text">{{ h }}</span>
          <button
            type="button"
            class="heart is-icon"
            :class="{ on: saved.has(heartKey('hook', h)) }"
            :title="'Save this hook'"
            aria-label="Save this hook"
            @click="onHeart('hook', h)"
          >
            ♥
          </button>
        </li>
      </ul>

      <h2>Captions</h2>
      <ul class="lines">
        <li v-for="(c, i) in result.captions" :key="'c' + i">
          <span class="text">{{ c }}</span>
          <button
            type="button"
            class="heart is-icon"
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
      <ul class="lines">
        <li v-for="(t, i) in result.ctas" :key="'t' + i">
          <span class="text">{{ t }}</span>
          <button
            type="button"
            class="heart is-icon"
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
      <p class="hashtags">{{ result.hashtags.join(' ') }}</p>
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

<style scoped>
.ig-ai-page {
  padding-bottom: var(--space-2xl);
}

.top {
  display: flex;
  align-items: flex-end;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: var(--space-md);
  margin-bottom: var(--space-lg);
}

.top__title {
  margin: 0;
}

.inputs {
  max-width: 44rem;
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  padding: var(--space-lg);
  box-shadow: var(--shadow-float);
}

.field {
  margin-bottom: var(--space-md);
}

.field-row {
  display: flex;
  flex-wrap: wrap;
  gap: var(--space-lg);
  margin-bottom: var(--space-md);
}

.field-row .field {
  flex: 1;
  min-width: 12rem;
  margin-bottom: 0;
}

.field label {
  display: block;
  margin-bottom: var(--space-xs);
  font-weight: 600;
  font-size: 0.875rem;
}

.field textarea,
.field select {
  width: 100%;
  max-width: 44rem;
  font: inherit;
}

.inputs .btn-primary {
  margin-top: var(--space-sm);
}

.output {
  margin-top: var(--space-xl);
  max-width: 44rem;
}

.output h2 {
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 600;
  margin: var(--space-lg) 0 var(--space-sm);
  letter-spacing: 0.02em;
}

.lines {
  list-style: none;
  padding: 0;
  margin: 0;
}

.lines li {
  display: flex;
  align-items: flex-start;
  gap: var(--space-sm);
  margin-bottom: var(--space-sm);
  padding: var(--space-sm) var(--space-md);
  background: var(--color-surface);
  border: 1px solid var(--color-border);
  border-radius: var(--radius-sm);
  box-shadow: var(--shadow-border);
}

.text {
  flex: 1;
  white-space: pre-wrap;
  font-size: 0.9375rem;
  line-height: 1.5;
}

.heart {
  flex-shrink: 0;
  cursor: pointer;
  font-size: 1.2rem;
  color: var(--color-text-muted);
}

.heart.on {
  color: var(--color-error);
}

.hashtags {
  white-space: pre-wrap;
  word-break: break-word;
  margin: 0;
  font-size: 0.9375rem;
  line-height: 1.55;
  color: var(--color-text);
}
</style>
