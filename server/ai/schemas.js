
// Gets all the users input and validates it
// This where the exampels can be hearted and added to "memory" ):
// The return fro ollama retunrs TextDecoderStream, and parsees the json to match what we are looking for. (enforced using zod)


const z = require('zod');
const { it } = require('zod/v4/locales')

/*
 * Tone / focus enums — match what the Vue admin page sends so requests are predictable
 * and the prompt can name the same labels the user picked.
 */
// options for tone and focus
const toneSchema = z.enum(['Poetic', 'Simple', 'Emotional', 'Sales', 'Luxury']);
const focusSchema = z.enum(['Engagement', 'Sell', 'Story', 'Awareness']);

/*
 * POST /api/admin/ai/generate-ig body.
 * userInput: required artwork blurb; optional voice/tone/focus shape the system prompt in the graph.
 */
const generationRequestSchema = z.object({
    userInput: z.string().min(1, 'userInput is required'),
    personalizedVoice: z.string().optional().default(''),
    tone: toneSchema.optional().default('Simple'),
    focus: focusSchema.optional().default('Story')
});

/*
 * POST /api/admin/ai/save-preferred body.
 * When the user “hearts” a line, we store it in memory (FIFO per type)
 */
// This is stored in memoery --- dumb as they are erased everytime I restart the server
const savePreferredRequestSchema = z.object({
    type: z.enum(['hook', 'caption', 'cta']),
    text: z.string().min(1, 'text is required')
});

// uses zod to enforce / validate the output of the model
// This doesn't do any pushing or popping or used for validation for the output of the model. 
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
