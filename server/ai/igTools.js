
//  * Tools:
//  * - fetch_preferred_copy_examples → reads preferredExamplesStore (few-shot strings).
//  * - generate_ig_draft_from_prompt → one Ollama chat completion returning raw text (hopefully JSON).
//  */
// gets the user prompt all cleaned and ready
// Than send the user prmpt and judges if its good or not

const { Ollama } = require('ollama');
const { tool, Tool } = require('@langchain/core/tools');
const z = require('zod');

const { getPreferredExamples } = require('./preferredExamplesStore');

/*
 * Ollama client: host defaults to a LAN hostname “golem” (override with OLLAMA_HOST); model via OLLAMA_MODEL.
 */
const ollama = new Ollama({
    host: process.env.OLLAMA_HOST || 'http://golem:11434'
});
const DEFAULT_MODEL = process.env.OLLAMA_MODEL || 'gpt-oss:20b';


// schema for the input that the tool expects for the otol call
// Only the shape of the input is enforced here. 
const fetchPreferredCopyExamplesSchema = z.object({
    categories: z
        .enum(['all', 'hooks', 'captions', 'ctas'])
        .optional()
        .default('all')
        .describe('Return all preferred examples or only one category.')
});


// Tool
// This is the tool that the 'model' (code invokes it every time) uses to get the exmples from Memory
// lot of extra code becuase the model never calls a specific section and alway defalts to all. BUUUT its built to let the model do this. 
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
        // this is the shape of the input that the tool expects defined above
        schema: fetchPreferredCopyExamplesSchema
    }
);


// Schema input defintion
// using zode for templ and type ect
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

// Tool
// first it sends the user message to the model. 
// this is what is actually asked and sent to the model.
// Its creates the user message (all cleaned up and rady to go) and than sends it to the model. 

// And than it has two Conditions on the reesponse 
// if there a non empty string? ---> return ok and rawText
// if there is no response? ---> return ok false and error

// This is the shape of the output that the tool expects defined above

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
