/**
 * LangGraph workflow for Instagram-ready copy from a rough artwork description.
 *
 * Nodes (in order): startRequest → getAllContext → generateIGComponents → formatOutput → returnResponse.
 * Uses getPreferredExamples as memory during context; Ollama (gpt-oss:20b) for generation; Zod to validate model JSON.
 */

const { Ollama } = require('ollama');
const { StateGraph, START, END, Annotation } = require('@langchain/langgraph');

const { getPreferredExamples } = require('./preferredExamplesStore');
const { modelIgOutputSchema } = require('./schemas');

const ollama = new Ollama({
    host: 'http://golem:11434'
});
const model = 'gpt-oss:20b';

// --- Graph state: one channel per field; each node returns partial updates (last value wins).

const IgState = Annotation.Root({
    userInput: Annotation(),
    personalizedVoice: Annotation(),
    tone: Annotation(),
    focus: Annotation(),
    formattedRequest: Annotation(),
    hookExamples: Annotation(),
    captionExamples: Annotation(),
    ctaExamples: Annotation(),
    rawModelText: Annotation(),
    hooks: Annotation(),
    captions: Annotation(),
    ctas: Annotation(),
    hashtags: Annotation(),
    outputJson: Annotation(),
    error: Annotation()
});

function formatExamplesList(label, items) {
    if (!items || !items.length) {
        return `${label}\n(none yet — follow the personalized voice and output rules.)`;
    }
    return `${label}\n${items.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
}

function buildGenerationPrompt(state) {
    const voice = (state.personalizedVoice || '').trim() || '(no extra style notes — use a warm, artist-friendly Instagram tone.)';
    const tone = state.tone || 'Simple';
    const focus = state.focus || 'Story';
    const hooksEx = formatExamplesList('Preferred hook examples (user liked these)', state.hookExamples);
    const capsEx = formatExamplesList('Preferred caption examples (user liked these)', state.captionExamples);
    const ctasEx = formatExamplesList('Preferred CTA examples (user liked these)', state.ctaExamples);

    return `
=== SYSTEM ROLE ===
You help a visual artist turn a rough description of their artwork into Instagram post components. Be faithful to the art described. Output must be valid JSON only — no markdown, no commentary outside the JSON object.

=== USER REQUEST (artwork / piece) ===
${state.formattedRequest}

=== PERSONALIZED VOICE (style guidelines from the artist) ===
${voice}

=== TONE (how writing should sound) ===
${tone}

=== FOCUS (main content objective) ===
${focus}

=== PREFERRED HOOK EXAMPLES ===
${hooksEx}

=== PREFERRED CAPTION EXAMPLES ===
${capsEx}

=== PREFERRED CTA EXAMPLES ===
${ctasEx}

=== OUTPUT RULES ===
Return a single JSON object with exactly these keys and array lengths:
- "hooks": array of exactly 3 strings. Short attention-grabbing openers (one line each when possible).
- "captions": array of exactly 3 strings. Main body copy: digestible, artist-aligned, not walls of text.
- "ctas": array of exactly 3 strings. Encourage gentle action — not pushy or salesy.
- "hashtags": array of exactly 10 strings. Relevant to the piece and art audience; avoid spammy filler. You may include or omit the "#" prefix consistently.

Do not include any keys other than hooks, captions, ctas, hashtags. No text before or after the JSON.
`.trim();
}

/**
 * Strip optional markdown code fences so JSON.parse succeeds.
 */
function extractJsonObjectText(raw) {
    let s = String(raw || '').trim();
    if (!s) return s;
    if (s.startsWith('```')) {
        s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    }
    return s.trim();
}

// ---------------------------------------------------------------------------
// Node 1: startRequestNode — entry; place inputs into state and clear error.
// ---------------------------------------------------------------------------
function startRequestNode(state) {
    return {
        userInput: state.userInput,
        personalizedVoice: state.personalizedVoice ?? '',
        tone: state.tone ?? 'Simple',
        focus: state.focus ?? 'Story',
        error: null,
        rawModelText: '',
        hooks: [],
        captions: [],
        ctas: [],
        hashtags: [],
        outputJson: null
    };
}

// ---------------------------------------------------------------------------
// Node 2: getAllContextNode — normalize description + load preferred examples.
// ---------------------------------------------------------------------------
function getAllContextNode(state) {
    const formattedRequest = String(state.userInput || '')
        .replace(/\s+/g, ' ')
        .trim();
    const { hooks, captions, ctas } = getPreferredExamples();
    return {
        formattedRequest,
        hookExamples: hooks,
        captionExamples: captions,
        ctaExamples: ctas
    };
}

// ---------------------------------------------------------------------------
// Node 3: generateIGComponentsNode — call Ollama; store raw text or error.
// ---------------------------------------------------------------------------
async function generateIGComponentsNode(state) {
    if (state.error) {
        return {};
    }
    if (!state.formattedRequest) {
        return { error: 'Description is empty after normalization.' };
    }

    const prompt = buildGenerationPrompt(state);
    try {
        const response = await ollama.chat({
            model,
            messages: [{ role: 'user', content: prompt }],
            options: { temperature: 0.6 }
        });
        const content = response?.message?.content;
        if (!content || !String(content).trim()) {
            return { error: 'The model returned an empty response.' };
        }
        return { rawModelText: String(content) };
    } catch (err) {
        const msg =
            err && err.message
                ? String(err.message)
                : 'Failed to reach the language model.';
        return { error: msg };
    }
}

// ---------------------------------------------------------------------------
// Node 4: formatOutputNode — parse JSON, validate with Zod, set outputJson or error.
// ---------------------------------------------------------------------------
function formatOutputNode(state) {
    if (state.error) {
        return {};
    }
    const jsonText = extractJsonObjectText(state.rawModelText);
    let parsed;
    try {
        parsed = JSON.parse(jsonText);
    } catch {
        return { error: 'Model output was not valid JSON.' };
    }

    const check = modelIgOutputSchema.safeParse(parsed);
    if (!check.success) {
        const detail = check.error.flatten().fieldErrors;
        const msg = Object.keys(detail).length
            ? `Output failed validation: ${JSON.stringify(detail)}`
            : 'Output failed validation.';
        return { error: msg };
    }

    const data = check.data;
    return {
        hooks: data.hooks,
        captions: data.captions,
        ctas: data.ctas,
        hashtags: data.hashtags,
        outputJson: {
            hooks: data.hooks,
            captions: data.captions,
            ctas: data.ctas,
            hashtags: data.hashtags
        }
    };
}

// ---------------------------------------------------------------------------
// Node 5: returnResponseNode — final pass; state already holds outputJson / error.
// ---------------------------------------------------------------------------
function returnResponseNode(state) {
    if (state.error) {
        return { outputJson: null };
    }
    return {
        outputJson: state.outputJson
    };
}

const igGenerationGraph = new StateGraph(IgState)
    .addNode('startRequest', startRequestNode)
    .addNode('getAllContext', getAllContextNode)
    .addNode('generateIGComponents', generateIGComponentsNode)
    .addNode('formatOutput', formatOutputNode)
    .addNode('returnResponse', returnResponseNode)
    .addEdge(START, 'startRequest')
    .addEdge('startRequest', 'getAllContext')
    .addEdge('getAllContext', 'generateIGComponents')
    .addEdge('generateIGComponents', 'formatOutput')
    .addEdge('formatOutput', 'returnResponse')
    .addEdge('returnResponse', END)
    .compile();

async function runIgGeneration(input) {
    return igGenerationGraph.invoke(input);
}

module.exports = {
    runIgGeneration,
    igGenerationGraph
};
