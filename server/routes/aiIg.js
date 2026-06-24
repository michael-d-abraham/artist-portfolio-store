/**
 * Admin AI HTTP API for Instagram-ready post copy.
 *
 * Trust boundary: every route here is mounted behind requireAdmin in app.js, so
 * only authenticated admins can reach the model. userInput is bounded and shape-
 * validated by the Zod schemas below before reaching the LLM; prompt-injection
 * risk is limited to the admin's own session and the local Ollama instance.
 *
 * Routes (all require admin session):
 *   POST /api/admin/ai/generate-ig    — run LangGraph agent pipeline, save history, return copy
 *   POST /api/admin/ai/save-preferred — heart a line; persisted to MongoDB
 *   GET  /api/admin/ai/voice-profile  — load the artist's brand preferences (3 fields)
 *   PUT  /api/admin/ai/voice-profile  — upsert the artist's brand preferences
 *
 * Related modules:
 *   server/ai/igGenerationGraph.js     — LangGraph agentic loop (LLM + tool calls → validated JSON)
 *   server/ai/preferredExamplesStore.js — MongoDB-backed FIFO (max 5 per type)
 *   server/ai/schemas.js               — Zod schemas for all request bodies + model output
 *   server/models/AiVoiceProfile.js    — single 'default' doc with brandIdentity/emphasize/avoid
 *   server/models/AiGeneration.js      — write-once record of every successful generation
 */

const express = require('express');
const { runIgGeneration } = require('../ai/igGenerationGraph');
const {
    generationRequestSchema,
    savePreferredRequestSchema,
    voiceProfileUpdateSchema
} = require('../ai/schemas');
const { savePreferredExample } = require('../ai/preferredExamplesStore');
const AiVoiceProfile = require('../models/AiVoiceProfile');
const AiGeneration = require('../models/AiGeneration');

const router = express.Router();

/*
 * POST /api/admin/ai/generate-ig
 * Body must match generationRequestSchema. On success returns { hooks, captions, ctas, hashtags }
 * and fires off a background save to the ai_generations collection.
 * 502 if the agent ends without valid output; 500 on unexpected exceptions.
 */
router.post('/generate-ig', async (req, res) => {
    const parsed = generationRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
        const msg = parsed.error.issues.map((e) => e.message).join(' ') || 'Invalid request body';
        return res.status(400).json({ error: msg });
    }

    try {
        const { userInput, tone, focus } = parsed.data;
        const finalState = await runIgGeneration({ userInput, tone, focus });

        if (!finalState.finalOutput) {
            const errMsg =
                finalState.validationErrors || 'No output produced after maximum retry attempts.';
            return res.status(502).json({ error: errMsg });
        }

        // Fire-and-forget: record the generation for history.
        AiGeneration.create({
            inputDescription: userInput,
            tone,
            focus,
            output: finalState.finalOutput
        }).catch((err) => console.error('[AI] Failed to save generation history:', err));

        return res.json(finalState.finalOutput);
    } catch (err) {
        const msg = err && err.message ? String(err.message) : 'Generation failed.';
        return res.status(500).json({ error: msg });
    }
});

/*
 * POST /api/admin/ai/save-preferred
 * Body: { type: 'hook'|'caption'|'cta', text: string }
 * Persists to MongoDB FIFO stacks for the next generation.
 */
router.post('/save-preferred', async (req, res) => {
    const parsed = savePreferredRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
        const msg = parsed.error.issues.map((e) => e.message).join(' ') || 'Invalid request body';
        return res.status(400).json({ error: msg });
    }

    try {
        await savePreferredExample(parsed.data.type, parsed.data.text);
        return res.json({ ok: true });
    } catch (err) {
        const msg = err && err.message ? String(err.message) : 'Failed to save example.';
        return res.status(500).json({ error: msg });
    }
});

/*
 * GET /api/admin/ai/voice-profile
 * Returns { brandIdentity, emphasize, avoid } from MongoDB.
 * Returns empty strings on first use (no profile saved yet).
 */
router.get('/voice-profile', async (req, res) => {
    try {
        const profile = await AiVoiceProfile.findOne({ name: 'default' }).lean();
        return res.json({
            brandIdentity: profile ? (profile.brandIdentity || '') : '',
            emphasize: profile ? (profile.emphasize || '') : '',
            avoid: profile ? (profile.avoid || '') : ''
        });
    } catch (err) {
        const msg = err && err.message ? String(err.message) : 'Failed to load voice profile.';
        return res.status(500).json({ error: msg });
    }
});

/*
 * PUT /api/admin/ai/voice-profile
 * Body: { brandIdentity, emphasize, avoid } — upserts the default voice profile.
 * Returns the saved values on success.
 */
router.put('/voice-profile', async (req, res) => {
    const parsed = voiceProfileUpdateSchema.safeParse(req.body || {});
    if (!parsed.success) {
        const msg = parsed.error.issues.map((e) => e.message).join(' ') || 'Invalid request body';
        return res.status(400).json({ error: msg });
    }

    try {
        const profile = await AiVoiceProfile.findOneAndUpdate(
            { name: 'default' },
            { $set: {
                brandIdentity: parsed.data.brandIdentity,
                emphasize: parsed.data.emphasize,
                avoid: parsed.data.avoid
            }},
            { upsert: true, new: true }
        );
        return res.json({
            brandIdentity: profile.brandIdentity,
            emphasize: profile.emphasize,
            avoid: profile.avoid
        });
    } catch (err) {
        const msg = err && err.message ? String(err.message) : 'Failed to save voice profile.';
        return res.status(500).json({ error: msg });
    }
});

module.exports = router;
