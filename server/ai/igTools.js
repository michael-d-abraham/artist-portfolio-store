/**
 * LangChain DynamicStructuredTools with Zod input schemas (assignment: distinct tools + schemas).
 * Invoked from LangGraph nodes — not model-driven tool-calling.
 */

const { Ollama } = require('ollama');
const { tool } = require('@langchain/core/tools');
const z = require('zod');

const { getPreferredExamples } = require('./preferredExamplesStore');

const ollama = new Ollama({
    host: process.env.OLLAMA_HOST || 'http://golem:11434'
});
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';

/** Schema: which slices of saved “hearted” copy to load for few-shot prompting. */
const fetchPreferredCopyExamplesSchema = z.object({
    categories: z
        .enum(['all', 'hooks', 'captions', 'ctas'])
        .optional()
        .default('all')
        .describe('Return all preferred examples or only one category.')
});

const fetchPreferredCopyExamplesTool = tool(
    async (input) => {
        const { hooks, captions, ctas } = getPreferredExamples();
        const cat = input.categories || 'all';
        if (cat === 'hooks') {
            return JSON.stringify({ hooks, captions: [], ctas: [] });
        }
        if (cat === 'captions') {
            return JSON.stringify({ hooks: [], captions, ctas: [] });
        }
        if (cat === 'ctas') {
            return JSON.stringify({ hooks: [], captions: [], ctas });
        }
        return JSON.stringify({ hooks, captions, ctas });
    },
    {
        name: 'fetch_preferred_copy_examples',
        description:
            'Loads up to five user-saved hook, caption, and CTA lines per category (FIFO) for prompt conditioning.',
        schema: fetchPreferredCopyExamplesSchema
    }
);

/** Schema: full prompt text and sampling temperature for the local Ollama model. */
const generateIgDraftFromPromptSchema = z.object({
    promptText: z
        .string()
        .min(1, 'promptText is required')
        .describe('Full user message including instructions and artwork context.'),
    temperature: z
        .number()
        .min(0)
        .max(2)
        .optional()
        .default(0.7)
        .describe('Sampling temperature for generation.')
});

const generateIgDraftFromPromptTool = tool(
    async (input) => {
        const response = await ollama.chat({
            model: DEFAULT_MODEL,
            messages: [{ role: 'user', content: input.promptText }],
            options: { temperature: input.temperature ?? 0.7 }
        });
        const content = response?.message?.content;
        if (!content || !String(content).trim()) {
            return JSON.stringify({ ok: false, error: 'The model returned an empty response.' });
        }
        return JSON.stringify({ ok: true, rawText: String(content) });
    },
    {
        name: 'generate_ig_draft_from_prompt',
        description:
            'Calls the local Ollama chat model once and returns JSON with ok flag and rawText or error.',
        schema: generateIgDraftFromPromptSchema
    }
);

module.exports = {
    fetchPreferredCopyExamplesTool,
    generateIgDraftFromPromptTool,
    fetchPreferredCopyExamplesSchema,
    generateIgDraftFromPromptSchema
};
