const AI_TONE_VALUES = ['Poetic', 'Simple', 'Emotional', 'Sales', 'Luxury'];
const AI_FOCUS_VALUES = ['Engagement', 'Sell', 'Story', 'Awareness'];
const AI_TONE_DEFAULT = 'Simple';
const AI_FOCUS_DEFAULT = 'Story';

const AI_TONE_LABELS = {
    Poetic: 'Poetic — emotional, artistic, expressive',
    Simple: 'Simple — clear, short, easy to read',
    Emotional: 'Emotional — feeling-focused, personal',
    Sales: 'Sales — slightly persuasive, product-aware',
    Luxury: 'Luxury — premium, collector-focused'
};

const AI_FOCUS_LABELS = {
    Engagement: 'Engagement — likes, comments, shares',
    Sell: 'Sell — drive purchase or clicks',
    Story: 'Story — tell meaning behind the piece',
    Awareness: 'Awareness — just showcase the work'
};

module.exports = {
    AI_TONE_VALUES,
    AI_FOCUS_VALUES,
    AI_TONE_DEFAULT,
    AI_FOCUS_DEFAULT,
    AI_TONE_LABELS,
    AI_FOCUS_LABELS
};
