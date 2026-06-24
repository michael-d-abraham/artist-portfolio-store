const {
    AI_TONE_VALUES,
    AI_FOCUS_VALUES,
    AI_TONE_DEFAULT,
    AI_FOCUS_DEFAULT,
    AI_TONE_LABELS,
    AI_FOCUS_LABELS
} = require('../../shared/aiGenerationOptions');

describe('shared/aiGenerationOptions', () => {
    it('exports expected tone and focus values', () => {
        expect(AI_TONE_VALUES).toEqual(['Poetic', 'Simple', 'Emotional', 'Sales', 'Luxury']);
        expect(AI_FOCUS_VALUES).toEqual(['Engagement', 'Sell', 'Story', 'Awareness']);
    });

    it('defaults are members of the value arrays', () => {
        expect(AI_TONE_VALUES).toContain(AI_TONE_DEFAULT);
        expect(AI_FOCUS_VALUES).toContain(AI_FOCUS_DEFAULT);
        expect(AI_TONE_DEFAULT).toBe('Simple');
        expect(AI_FOCUS_DEFAULT).toBe('Story');
    });

    it('every value has a non-empty label', () => {
        for (const value of AI_TONE_VALUES) {
            expect(typeof AI_TONE_LABELS[value]).toBe('string');
            expect(AI_TONE_LABELS[value].length).toBeGreaterThan(0);
        }
        for (const value of AI_FOCUS_VALUES) {
            expect(typeof AI_FOCUS_LABELS[value]).toBe('string');
            expect(AI_FOCUS_LABELS[value].length).toBeGreaterThan(0);
        }
    });
});
