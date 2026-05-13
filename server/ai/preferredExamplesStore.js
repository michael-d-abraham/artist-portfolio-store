
// This is the rag part of it. 
// this defines the stack as a FIFO stack and defines the max items. 
// NOT PERSISTANT STUPID. 
// No validation here just pushes whatever. 

const MAX_ITEMS = 5;

/* Three parallel stacks — one list per line type so hooks don’t mix with CTAs. */
const hookStack = [];
const captionStack = [];
const ctaStack = [];

/*
 * pushFifo — append one line and drop from the front if we exceed MAX_ITEMS (oldest forgotten first).
 */
function pushFifo(stack, text) {
    stack.push(text);
    while (stack.length > MAX_ITEMS) {
        stack.shift();
    }
}

// get examples tool 
// ... is the spread Operators. puts all the iterms into a new  array. 
// same stuff new array object.  just a safty thign to not mess with the og array.  
function getPreferredExamples() {
    return {
        hooks: [...hookStack],
        captions: [...captionStack],
        ctas: [...ctaStack]
    };
}


// removes white space and than checks the type and pushes it into the right stack
// no validation here just pushes what ever. 
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
