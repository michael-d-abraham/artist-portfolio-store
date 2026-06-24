const z = require('zod');
const {
    AI_TONE_VALUES,
    AI_FOCUS_VALUES,
    AI_TONE_DEFAULT,
    AI_FOCUS_DEFAULT
} = require('../../shared/aiGenerationOptions');

const toneSchema = z.enum(AI_TONE_VALUES);
const focusSchema = z.enum(AI_FOCUS_VALUES);

/*
 * POST /api/admin/ai/generate-ig body.
 * The agent fetches voice preferences via the get_artist_voice_profile tool,
 * so personalizedVoice is no longer passed in the request.
 */
const generationRequestSchema = z.object({
    userInput: z.string().min(1, 'userInput is required'),
    tone: toneSchema.optional().default(AI_TONE_DEFAULT),
    focus: focusSchema.optional().default(AI_FOCUS_DEFAULT)
});

/*
 * POST /api/admin/ai/save-preferred body.
 * When the user hearts a line it is persisted to MongoDB.
 */
const savePreferredRequestSchema = z.object({
    type: z.enum(['hook', 'caption', 'cta']),
    text: z.string().min(1, 'text is required')
});

// Enforces / validates the shape of the model's final JSON output.
const modelIgOutputSchema = z.object({
    hooks: z.array(z.string()).length(3),
    captions: z.array(z.string()).length(3),
    ctas: z.array(z.string()).length(3),
    hashtags: z.array(z.string()).length(10)
});

/*
 * PUT /api/admin/ai/voice-profile body.
 * Three structured fields replace the old single voiceNote.
 */
const voiceProfileUpdateSchema = z.object({
    brandIdentity: z
        .string()
        .max(1000, 'brandIdentity must be 1000 characters or fewer')
        .default(''),
    emphasize: z
        .string()
        .max(1000, 'emphasize must be 1000 characters or fewer')
        .default(''),
    avoid: z
        .string()
        .max(1000, 'avoid must be 1000 characters or fewer')
        .default('')
});

module.exports = {
    generationRequestSchema,
    savePreferredRequestSchema,
    modelIgOutputSchema,
    voiceProfileUpdateSchema,
    toneSchema,
    focusSchema
};
