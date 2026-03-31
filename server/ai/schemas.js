/**
 * Zod schemas for API bodies and for validating structured JSON from the Ollama model.
 */

const z = require('zod');

const toneSchema = z.enum(['Poetic', 'Simple', 'Emotional', 'Sales', 'Luxury']);
const focusSchema = z.enum(['Engagement', 'Sell', 'Story', 'Awareness']);

const generationRequestSchema = z.object({
    userInput: z.string().min(1, 'userInput is required'),
    personalizedVoice: z.string().optional().default(''),
    tone: toneSchema.optional().default('Simple'),
    focus: focusSchema.optional().default('Story')
});

const savePreferredRequestSchema = z.object({
    type: z.enum(['hook', 'caption', 'cta']),
    text: z.string().min(1, 'text is required')
});

/** Expected model JSON: exactly 3 hooks, 3 captions, 3 CTAs, 10 hashtags. */
const modelIgOutputSchema = z.object({
    hooks: z.array(z.string()).length(3),
    captions: z.array(z.string()).length(3),
    ctas: z.array(z.string()).length(3),
    hashtags: z.array(z.string()).length(10)
});

module.exports = {
    generationRequestSchema,
    savePreferredRequestSchema,
    modelIgOutputSchema,
    toneSchema,
    focusSchema
};
