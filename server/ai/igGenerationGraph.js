/**
 * LangGraph workflow: rough artwork description → structured Instagram copy (hooks, captions, CTAs, hashtags).
 *
 * HOW THE SYSTEM FITS TOGETHER (for explaining end-to-end):
 * 1) HTTP (`server/routes/aiIg.js`) validates the body with Zod, then calls `runIgGeneration` with
 *    userInput, personalizedVoice, tone, focus.
 * 2) This graph runs a linear prep chain, then calls two LangChain tools from `igTools.js` (not model-chosen —
 *    nodes invoke them in order): first load “hearted” examples from memory, then ask Ollama once for a draft.
 * 3) The draft must be JSON matching `modelIgOutputSchema` in `schemas.js`. If parse/validation fails and the
 *    error looks retryable, we bump a counter and call Ollama again (up to MAX_GENERATION_ATTEMPTS) with a
 *    stricter “RETRY” note in the prompt. Transport errors or bad validation after retries end in `finalize` with error.
 * 4) Success: `outputJson` holds the validated object for the API to return as JSON.
 *
 * Graph shape (edges):
 *   START → startRequest → prepareContext → fetchExamplesTool → generateTool
 *   → (conditional) validate OR finalize on hard generation error
 *   validate → (conditional) finalize success OR bumpRetry OR finalize with error
 *   bumpRetry → generateTool (loop)
 *   finalize → END
 */

const { StateGraph, START, END, Annotation } = require('@langchain/langgraph');
const {
    fetchPreferredCopyExamplesTool,
    generateIgDraftFromPromptTool
} = require('./igTools');
const { modelIgOutputSchema } = require('./schemas');

const MAX_GENERATION_ATTEMPTS = 3;


// states 
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


/*
 * formatExamplesList — turns a string array into numbered lines for the prompt, or a placeholder if empty
 * so the model still sees the section and follows “personalized voice” rules.
 */
function formatExamplesList(label, items) {
    if (!items || !items.length) {
        return `${label}\n(none yet — follow the personalized voice and output rules.)`;
    }
    return `${label}\n${items.map((t, i) => `${i + 1}. ${t}`).join('\n')}`;
}

/*
 * buildGenerationPrompt — composes one big user message for Ollama: role, artwork text, voice, tone, focus,
 * preferred examples, strict JSON output rules, and on retries an extra “RETRY” block demanding valid JSON only.
 */
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

/*
 * extractJsonObjectText — strips common ```json fences if the model wrapped JSON in markdown anyway.
 */
function extractJsonObjectText(raw) {
    let s = String(raw || '').trim();
    if (!s) return s;
    if (s.startsWith('```')) {
        s = s.replace(/^```(?:json)?\s*/i, '').replace(/\s*```\s*$/i, '');
    }
    return s.trim();
}

/*
 * isRetryableValidationError — only JSON parse failures and Zod validation failures trigger a retry loop;
 * other errors (e.g. network) skip retry and go straight to finalize.
 */
function isRetryableValidationError(message) {
    const m = String(message || '');
    return (
        m.includes('not valid JSON') ||
        m.includes('Output failed validation') ||
        m.includes('Model output was not valid JSON')
    );
}

// ---------------------------------------------------------------------------
// Nodes — each function receives partial state and returns a patch merged into state.
// ---------------------------------------------------------------------------

/*
 * startRequestNode — seed defaults: tone/focus, clear error, attempt 0, empty outputs.
 */
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

/*
 * prepareContextNode — normalize whitespace on the user’s artwork description for a stable prompt.
 */
function prepareContextNode(state) {
    const formattedRequest = String(state.userInput || '')
        .replace(/\s+/g, ' ')
        .trim();
    return { formattedRequest };
}

/*
 * fetchExamplesToolNode — invokes fetch_preferred_copy_examples; parses JSON into three arrays.
 * On parse failure, sets error so later nodes can short-circuit to finalize.
 */
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

/*
 * generateToolNode — builds the full prompt, calls generate_ig_draft_from_prompt (Ollama).
 * If a prior error exists or description is empty, skips work or returns an error patch.
 * Success stores rawModelText for validation.
 */
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

/*
 * validateOutputNode — JSON.parse + Zod safeParse; on success copies arrays into state.outputJson.
 * On failure sets error string for routing (retry vs finalize).
 */
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

/*
 * bumpRetryNode — increments generationAttempt, clears last raw text and output so the next generate step is fresh;
 * clears error so generateToolNode will run again (retry prompt text comes from generationAttempt > 0).
 */
function bumpRetryNode(state) {
    return {
        generationAttempt: (state.generationAttempt || 0) + 1,
        error: null,
        rawModelText: '',
        outputJson: null
    };
}

/*
 * finalizeNode — last step: if any error remains, ensure outputJson is null; otherwise pass through success payload.
 */
function finalizeNode(state) {
    if (state.error) {
        return { outputJson: null };
    }
    return { outputJson: state.outputJson };
}

// ---------------------------------------------------------------------------
// Routing — conditional edges read state and return the name of the next edge key (see addConditionalEdges).
// ---------------------------------------------------------------------------

/*
 * routeAfterGenerate — after Ollama: if tool reported error (network, empty, etc.), skip validation and end.
 * Otherwise always run validateOutputNode next.
 */
function routeAfterGenerate(state) {
    if (state.error) {
        return 'finalize';
    }
    return 'validate';
}

/*
 * routeAfterValidate — if outputJson is set, we’re done (success path to finalize).
 * If validation failed with a retryable message and attempts remain, go to bumpRetry → generate again.
 * Else finalize with error stuck in state (HTTP layer returns 502).
 */
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
// Graph compilation — wires nodes and edges; .compile() returns an invokable runnable.
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

/*
 * runIgGeneration — public entry: pass the same fields the HTTP route parsed; returns final graph state
 * (check error and outputJson on the result).
 */
async function runIgGeneration(input) {
    return igGenerationGraph.invoke(input);
}

module.exports = {
    runIgGeneration,
    igGenerationGraph
};
