/**
 * LangGraph: Instagram-ready copy from a rough artwork description.
 *
 * - Static edges: linear prep and tool-invocation steps.
 * - Conditional edges: route after generation (validate vs fail); route after validation (success vs retry vs fail).
 * - Two LangChain tools (Zod schemas in igTools.js): fetch preferred examples, generate draft via Ollama.
 */

const { StateGraph, START, END, Annotation } = require('@langchain/langgraph');

const {
    fetchPreferredCopyExamplesTool,
    generateIgDraftFromPromptTool
} = require('./igTools');
const { modelIgOutputSchema } = require('./schemas');

const MAX_GENERATION_ATTEMPTS = 3;

const IgState = Annotation.Root({
    userInput: Annotation(),
    personalizedVoice: Annotation(),
    tone: Annotation(),
    focus: Annotation(),
    formattedRequest: Annotation(),
    hookExamples: Annotation(),
    captionExamples: Annotation(),
    ctaExamples: Annotation(),
    generationAttempt: Annotation(),
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
    const voice =
        (state.personalizedVoice || '').trim() ||
        '(no extra style notes — use a warm, artist-friendly Instagram tone.)';
    const tone = state.tone || 'Simple';
    const focus = state.focus || 'Story';
    const hooksEx = formatExamplesList('Preferred hook examples (user liked these)', state.hookExamples);
    const capsEx = formatExamplesList(
        'Preferred caption examples (user liked these)',
        state.captionExamples
    );
    const ctasEx = formatExamplesList('Preferred CTA examples (user liked these)', state.ctaExamples);

    const retryNote =
        (state.generationAttempt || 0) > 0
            ? `\n=== RETRY ===\nYour previous reply was not valid JSON or failed schema checks. Output ONLY one JSON object with keys hooks, captions, ctas, hashtags — no markdown fences, no extra text.\n`
            : '';

    return `
=== SYSTEM ROLE ===
You help a visual artist turn a rough description of their artwork into Instagram post components. Be faithful to the art described. Output must be valid JSON only — no markdown, no commentary outside the JSON object.
${retryNote}
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

function extractJsonObjectText(raw) {
    let s = String(raw || '').trim();
    if (!s) return s;
    if (s.startsWith('```')) {
        s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    }
    return s.trim();
}

function isRetryableValidationError(message) {
    const m = String(message || '');
    return (
        m.includes('not valid JSON') ||
        m.includes('Output failed validation') ||
        m.includes('Model output was not valid JSON')
    );
}

// ---------------------------------------------------------------------------
// Nodes
// ---------------------------------------------------------------------------

function startRequestNode(state) {
    return {
        userInput: state.userInput,
        personalizedVoice: state.personalizedVoice ?? '',
        tone: state.tone ?? 'Simple',
        focus: state.focus ?? 'Story',
        error: null,
        generationAttempt: 0,
        rawModelText: '',
        hooks: [],
        captions: [],
        ctas: [],
        hashtags: [],
        outputJson: null
    };
}

function prepareContextNode(state) {
    const formattedRequest = String(state.userInput || '')
        .replace(/\s+/g, ' ')
        .trim();
    return { formattedRequest };
}

async function fetchExamplesToolNode(state) {
    const raw = await fetchPreferredCopyExamplesTool.invoke({ categories: 'all' });
    let parsed;
    try {
        parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
    } catch {
        return {
            hookExamples: [],
            captionExamples: [],
            ctaExamples: [],
            error: 'Failed to parse preferred examples tool output.'
        };
    }
    return {
        hookExamples: parsed.hooks || [],
        captionExamples: parsed.captions || [],
        ctaExamples: parsed.ctas || []
    };
}

async function generateToolNode(state) {
    if (state.error) {
        return {};
    }
    if (!state.formattedRequest) {
        return { error: 'Description is empty after normalization.' };
    }

    const prompt = buildGenerationPrompt(state);
    try {
        const raw = await generateIgDraftFromPromptTool.invoke({
            promptText: prompt,
            temperature: 0.7
        });
        const parsed = typeof raw === 'string' ? JSON.parse(raw) : raw;
        if (!parsed.ok) {
            return { error: parsed.error || 'Generation tool failed.' };
        }
        return { rawModelText: parsed.rawText, error: null };
    } catch (err) {
        const msg =
            err && err.message ? String(err.message) : 'Failed to reach the language model.';
        return { error: msg };
    }
}

function validateOutputNode(state) {
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
        },
        error: null
    };
}

function bumpRetryNode(state) {
    return {
        generationAttempt: (state.generationAttempt || 0) + 1,
        error: null,
        rawModelText: '',
        outputJson: null
    };
}

function finalizeNode(state) {
    if (state.error) {
        return { outputJson: null };
    }
    return { outputJson: state.outputJson };
}

// ---------------------------------------------------------------------------
// Routing (conditional edges)
// ---------------------------------------------------------------------------

/** After LLM tool: empty description errors skip validation; otherwise always validate when no transport error. */
function routeAfterGenerate(state) {
    if (state.error) {
        return 'finalize';
    }
    return 'validate';
}

/** After Zod/JSON check: success, bounded retry on parse/schema only, or finalize with error. */
function routeAfterValidate(state) {
    if (state.outputJson) {
        return 'success';
    }
    const attempt = state.generationAttempt || 0;
    if (
        attempt < MAX_GENERATION_ATTEMPTS - 1 &&
        state.error &&
        isRetryableValidationError(state.error)
    ) {
        return 'retry';
    }
    return 'finalize';
}

// ---------------------------------------------------------------------------
// Graph
// ---------------------------------------------------------------------------

const igGenerationGraph = new StateGraph(IgState)
    .addNode('startRequest', startRequestNode)
    .addNode('prepareContext', prepareContextNode)
    .addNode('fetchExamplesTool', fetchExamplesToolNode)
    .addNode('generateTool', generateToolNode)
    .addNode('validateOutput', validateOutputNode)
    .addNode('bumpRetry', bumpRetryNode)
    .addNode('finalize', finalizeNode)
    .addEdge(START, 'startRequest')
    .addEdge('startRequest', 'prepareContext')
    .addEdge('prepareContext', 'fetchExamplesTool')
    .addEdge('fetchExamplesTool', 'generateTool')
    .addConditionalEdges('generateTool', routeAfterGenerate, {
        validate: 'validateOutput',
        finalize: 'finalize'
    })
    .addConditionalEdges('validateOutput', routeAfterValidate, {
        success: 'finalize',
        retry: 'bumpRetry',
        finalize: 'finalize'
    })
    .addEdge('bumpRetry', 'generateTool')
    .addEdge('finalize', END)
    .compile();

async function runIgGeneration(input) {
    return igGenerationGraph.invoke(input);
}

module.exports = {
    runIgGeneration,
    igGenerationGraph
};
