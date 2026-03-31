/**
 * Admin AI HTTP API for Instagram-ready post copy.
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
