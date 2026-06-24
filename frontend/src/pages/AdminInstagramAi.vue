<!--
  Admin AI page — two-section layout:
    Section 1  Artist Voice & Preferences — persistent brand settings saved to MongoDB.
                Updated occasionally. Injected into every generation via the agent's tool calls.
    Section 2  Caption Generation        — per-post inputs (tone, focus, description) that
                drive a single generation run. Results appear in Section 3.
-->
<template>
  <div class="admin-page">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">AI</h1>
    </header>

    <!-- ── 1: Artist Voice & Preferences ─────────────────────────────────────── -->
    <section class="admin-float admin-float--padded">
      <button
        type="button"
        class="admin-ai-voice__toggle"
        :aria-expanded="voiceOpen.toString()"
        aria-controls="voice-body"
        @click="voiceOpen = !voiceOpen"
      >
        <h2 class="admin-float-card__title">Artist Voice &amp; Preferences</h2>
        <span class="admin-ai-voice__chevron" :class="{ 'is-open': voiceOpen }">&#8964;</span>
      </button>

      <div v-show="voiceOpen" id="voice-body">
        <p class="admin-panel__section-hint">
          Think of this as training your AI assistant. The more you update these preferences, the
          better it will reflect your brand and writing style. Start simple, then refine it over time
          as you learn what you like and don't like. The agent will use these preferences in future
          generations.
        </p>

        <div class="field">
          <label for="brandIdentity">Brand Identity</label>
          <p class="help">
            What kind of artist, brand, or artwork do you create? Describe your artistic identity,
            audience, themes, style, and how you want people to perceive your work.
          </p>
          <textarea
            id="brandIdentity"
            v-model="brandIdentity"
            rows="3"
            placeholder="e.g. Contemporary western landscapes · Luxury fine art for collectors · Modern abstract artwork inspired by nature · Minimalist desert photography · Bold, colorful statement pieces"
            @blur="persistVoice"
          />
        </div>

        <div class="field">
          <label for="emphasize">What To Emphasize</label>
          <p class="help">
            What should the AI focus on when writing about your work? Include the things that are
            most important to highlight in captions and descriptions.
          </p>
          <textarea
            id="emphasize"
            v-model="emphasize"
            rows="3"
            placeholder="e.g. The story behind the piece · The inspiration and creative process · Emotional connection · Interior design applications · Collector value · Craftsmanship and detail"
            @blur="persistVoice"
          />
        </div>

        <div class="field">
          <label for="avoid">What Should The AI Avoid</label>
          <p class="help">
            List words, styles, tones, or behaviors you do not want in your content.
          </p>
          <textarea
            id="avoid"
            v-model="avoid"
            rows="3"
            placeholder="e.g. Avoid emojis · Avoid sounding salesy · Avoid corporate language · Avoid clickbait · Avoid overly long captions · Avoid repetitive phrases"
            @blur="persistVoice"
          />
        </div>

        <p v-if="voiceSaved" class="admin-ai-voice__saved" aria-live="polite">Preferences saved.</p>
      </div>
    </section>

    <!-- ── 2: Caption Generation ──────────────────────────────────────────────── -->
    <section class="admin-float admin-float--padded">
      <h2 class="admin-float-card__title">Caption Generation</h2>
      <p class="admin-panel__section-hint">
        Specific to this post. The AI will apply your saved voice preferences automatically.
      </p>

      <div class="field-row">
        <div class="field">
          <label for="tone">Tone</label>
          <select id="tone" v-model="tone">
            <option v-for="value in AI_TONE_VALUES" :key="value" :value="value">
              {{ AI_TONE_LABELS[value] }}
            </option>
          </select>
        </div>
        <div class="field">
          <label for="focus">Focus</label>
          <select id="focus" v-model="focus">
            <option v-for="value in AI_FOCUS_VALUES" :key="value" :value="value">
              {{ AI_FOCUS_LABELS[value] }}
            </option>
          </select>
        </div>
      </div>

      <div class="field">
        <label for="desc">Rough Listing Description</label>
        <textarea
          id="desc"
          v-model="userInput"
          rows="6"
          placeholder="Describe the piece in your own words — messy notes are fine."
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

    <!-- ── 3: Generated Content ───────────────────────────────────────────────── -->
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
          >♥</button>
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
          >♥</button>
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
          >♥</button>
        </li>
      </ul>

      <h2>Hashtags</h2>
      <p class="admin-ai-hashtags">{{ result.hashtags.join(' ') }}</p>
    </section>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import {
  generateIgContent,
  savePreferredExample,
  getVoiceProfile,
  updateVoiceProfile
} from '../services/api.js';
import {
  AI_TONE_VALUES,
  AI_FOCUS_VALUES,
  AI_TONE_DEFAULT,
  AI_FOCUS_DEFAULT,
  AI_TONE_LABELS,
  AI_FOCUS_LABELS
} from '@shared/aiGenerationOptions.js';

// localStorage key for the voice profile cache (JSON object with all 3 fields).
const VOICE_CACHE_KEY = 'igVoiceProfile';

// ── Voice profile (Section 1) ─────────────────────────────────────────────────
const voiceOpen = ref(false);
const brandIdentity = ref('');
const emphasize = ref('');
const avoid = ref('');
const voiceSaved = ref(false);
let voiceSavedTimer = null;

// ── Caption generation (Section 2) ───────────────────────────────────────────
const userInput = ref('');
const tone = ref(AI_TONE_DEFAULT);
const focus = ref(AI_FOCUS_DEFAULT);
const generating = ref(false);
const error = ref('');

// ── Results (Section 3) ───────────────────────────────────────────────────────
const result = ref(null);
const saved = ref(new Set());

// ── Mount: load voice profile ─────────────────────────────────────────────────
onMounted(async () => {
  // Populate instantly from localStorage cache so fields aren't blank while loading.
  try {
    const cached = localStorage.getItem(VOICE_CACHE_KEY);
    if (cached) {
      const v = JSON.parse(cached);
      if (v.brandIdentity != null) brandIdentity.value = v.brandIdentity;
      if (v.emphasize != null)     emphasize.value     = v.emphasize;
      if (v.avoid != null)         avoid.value         = v.avoid;
    }
  } catch {
    /* ignore — stale or malformed cache */
  }

  // Fetch the server value (source of truth) and overwrite the cached values.
  try {
    const profile = await getVoiceProfile();
    brandIdentity.value = profile.brandIdentity || '';
    emphasize.value     = profile.emphasize     || '';
    avoid.value         = profile.avoid         || '';
    syncVoiceCache();
  } catch {
    /* Server unavailable — localStorage values stay as fallback. */
  }
});

function syncVoiceCache() {
  try {
    localStorage.setItem(
      VOICE_CACHE_KEY,
      JSON.stringify({
        brandIdentity: brandIdentity.value,
        emphasize: emphasize.value,
        avoid: avoid.value
      })
    );
  } catch {
    /* ignore */
  }
}

async function persistVoice() {
  syncVoiceCache();
  try {
    await updateVoiceProfile({
      brandIdentity: brandIdentity.value,
      emphasize: emphasize.value,
      avoid: avoid.value
    });
    // Show brief "Saved" confirmation.
    voiceSaved.value = true;
    clearTimeout(voiceSavedTimer);
    voiceSavedTimer = setTimeout(() => { voiceSaved.value = false; }, 2500);
  } catch {
    /* Non-fatal — cache is updated regardless. */
  }
}

// ── Caption generation ────────────────────────────────────────────────────────
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
  generating.value = true;
  try {
    const data = await generateIgContent({
      userInput: desc,
      tone: tone.value,
      focus: focus.value
    });
    result.value = data;
  } catch (e) {
    error.value = e.message || 'Generation failed.';
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
    error.value = e.message || 'Could not save preference.';
  }
}
</script>

<style scoped>
.admin-ai-voice__toggle {
  display: flex;
  align-items: center;
  justify-content: space-between;
  width: 100%;
  background: none;
  border: none;
  padding: 0;
  cursor: pointer;
  text-align: left;
}

.admin-ai-voice__toggle .admin-float-card__title {
  margin: 0;
}

.admin-ai-voice__chevron {
  font-size: 1.25rem;
  line-height: 1;
  color: #6b7280;
  transition: transform 0.2s ease;
  transform: rotate(-90deg);
  display: inline-block;
}

.admin-ai-voice__chevron.is-open {
  transform: rotate(0deg);
}

.admin-ai-voice__saved {
  margin: 0.75rem 0 0;
  font-size: 0.8125rem;
  font-weight: 600;
  color: #1b6b3f;
}
</style>
