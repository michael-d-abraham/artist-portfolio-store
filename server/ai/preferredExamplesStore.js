/**
 * In-memory preference stacks for Instagram copy (hooks, captions, CTAs).
 * Each list holds at most 5 items; saving a 6th drops the oldest (FIFO).
 * Used by getPreferredExamples during generation and savePreferredExample when the user hearts an item.
 */

const MAX_ITEMS = 5;

const hookStack = [];
const captionStack = [];
const ctaStack = [];

function pushFifo(stack, text) {
    stack.push(text);
    while (stack.length > MAX_ITEMS) {
        stack.shift();
    }
}

/**
 * Tool: getPreferredExamples — returns up to 5 liked examples per category for RAG-style prompting.
 */
function getPreferredExamples() {
    return {
        hooks: [...hookStack],
        captions: [...captionStack],
        ctas: [...ctaStack]
    };
}

/**
 * Tool: savePreferredExample — append a liked line to the right stack (FIFO cap 5).
 * @param {'hook'|'caption'|'cta'} type
 * @param {string} text
 */
function savePreferredExample(type, text) {
    const t = String(text).trim();
    if (!t) return;
    if (type === 'hook') {
        pushFifo(hookStack, t);
    } else if (type === 'caption') {
        pushFifo(captionStack, t);
    } else if (type === 'cta') {
        pushFifo(ctaStack, t);
    }
}

module.exports = {
    getPreferredExamples,
    savePreferredExample
};
