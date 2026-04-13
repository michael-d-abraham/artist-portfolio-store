/**
 * Admin AI HTTP API for Instagram-ready post copy.
 *
 * This file is the bridge between the Vue admin UI and `server/ai/*`:
 * - Validates JSON bodies with Zod schemas from `schemas.js` (same rules as the graph expects).
 * - POST /generate-ig runs the LangGraph in `igGenerationGraph.js` and returns structured JSON or an error status.
 * - POST /save-preferred pushes one liked line into `preferredExamplesStore.js` for future prompts (no graph run).
 *
 * Related modules:
 * - server/ai/preferredExamplesStore.js — FIFO stacks of liked hooks/captions/CTAs (max 5 each)
 * - server/ai/schemas.js — Zod schemas for request bodies and model output
 * - server/ai/igGenerationGraph.js — LangGraph: context → Ollama → validated JSON
 */

const express = require('express');
const { runIgGeneration } = require('../ai/igGenerationGraph');
const { generationRequestSchema, savePreferredRequestSchema } = require('../ai/schemas');
const { savePreferredExample } = require('../ai/preferredExamplesStore');

const router = express.Router();

/*
 * POST /api/admin/ai/generate-ig
 * Body must match generationRequestSchema. On success returns { hooks, captions, ctas, hashtags }.
 * 502 if the graph ends with an error or missing outputJson; 500 on unexpected exceptions.
 */
router.post('/generate-ig', async (req, res) => {
    const parsed = generationRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
        const msg = parsed.error.issues.map((e) => e.message).join(' ') || 'Invalid request body';
        return res.status(400).json({ error: msg });
    }

    try {
        const { userInput, personalizedVoice, tone, focus } = parsed.data;
        const finalState = await runIgGeneration({ userInput, personalizedVoice, tone, focus });

        if (finalState.error) {
            return res.status(502).json({ error: finalState.error });
        }
        if (!finalState.outputJson) {
            return res.status(502).json({ error: 'No output produced.' });
        }

        return res.json(finalState.outputJson);
    } catch (err) {
        const msg = err && err.message ? String(err.message) : 'Generation failed.';
        return res.status(500).json({ error: msg });
    }
});

/*
 * POST /api/admin/ai/save-preferred
 * Body: { type: 'hook'|'caption'|'cta', text: string }. Persists to in-memory stacks for the next generation.
 */
router.post('/save-preferred', (req, res) => {
    const parsed = savePreferredRequestSchema.safeParse(req.body || {});
    if (!parsed.success) {
        const msg = parsed.error.issues.map((e) => e.message).join(' ') || 'Invalid request body';
        return res.status(400).json({ error: msg });
    }

    savePreferredExample(parsed.data.type, parsed.data.text);
    return res.json({ ok: true });
});

module.exports = router;
