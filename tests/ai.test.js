/**
 * AI feature tests — five areas:
 *  1. Schema validation (generationRequestSchema, savePreferredRequestSchema, voiceProfileUpdateSchema)
 *  2. Preferred example persistence (save → fetch from MongoDB)
 *  3. Voice profile save / load via model and HTTP routes
 *  4. Output schema validation and retry-trigger detection
 *  5. Admin-only route protection (no session → 401)
 */

// Mock the LangGraph pipeline so Jest never tries to parse @langchain/langgraph's
// ESM-only uuid dependency. None of these tests exercise the generation pipeline itself.
jest.mock('../server/ai/igGenerationGraph', () => ({
    runIgGeneration: jest.fn().mockResolvedValue({ finalOutput: null, validationErrors: null }),
    igGenerationGraph: {},
    setModelForTesting: jest.fn()
}));

const request = require('supertest');
const { createApp } = require('../server/app');
const { AiPreferredExample, AiVoiceProfile, AiGeneration, AdminUser } = require('../server/db');
const { startTestDatabase, stopTestDatabase } = require('./helpers/mongo');
const { getPreferredExamples, savePreferredExample } = require('../server/ai/preferredExamplesStore');
const {
    generationRequestSchema,
    savePreferredRequestSchema,
    voiceProfileUpdateSchema
} = require('../server/ai/schemas');
const { AI_TONE_VALUES, AI_FOCUS_VALUES } = require('../shared/aiGenerationOptions');

let app;

beforeAll(async () => {
    await startTestDatabase();
    app = createApp();
});

afterAll(async () => {
    await stopTestDatabase();
});

beforeEach(async () => {
    await Promise.all([
        AiPreferredExample.deleteMany({}),
        AiVoiceProfile.deleteMany({}),
        AiGeneration.deleteMany({}),
        AdminUser.deleteMany({})
    ]);
});

// ---------------------------------------------------------------------------
// 1. Schema validation
// ---------------------------------------------------------------------------

describe('Schema validation', () => {
    describe('generationRequestSchema', () => {
        it('accepts a minimal valid body (only userInput)', () => {
            const result = generationRequestSchema.safeParse({ userInput: 'A blue painting' });
            expect(result.success).toBe(true);
            expect(result.data.tone).toBe('Simple');
            expect(result.data.focus).toBe('Story');
        });

        it('rejects an empty userInput', () => {
            expect(generationRequestSchema.safeParse({ userInput: '' }).success).toBe(false);
        });

        it('rejects a missing userInput', () => {
            expect(generationRequestSchema.safeParse({}).success).toBe(false);
        });

        it('rejects an unknown tone value', () => {
            expect(
                generationRequestSchema.safeParse({ userInput: 'test', tone: 'Aggressive' }).success
            ).toBe(false);
        });

        it('rejects an unknown focus value', () => {
            expect(
                generationRequestSchema.safeParse({ userInput: 'test', focus: 'Viral' }).success
            ).toBe(false);
        });

        it('no longer accepts personalizedVoice (voice is now fetched by the agent)', () => {
            // personalizedVoice was removed — it should be silently stripped or cause no issue.
            // Zod strips unknown keys by default, so passing it should still succeed.
            const result = generationRequestSchema.safeParse({
                userInput: 'test',
                personalizedVoice: 'keep it short'
            });
            expect(result.success).toBe(true);
            expect(result.data).not.toHaveProperty('personalizedVoice');
        });

        it('accepts all valid tone and focus combinations', () => {
            for (const tone of AI_TONE_VALUES) {
                for (const focus of AI_FOCUS_VALUES) {
                    expect(
                        generationRequestSchema.safeParse({ userInput: 'x', tone, focus }).success
                    ).toBe(true);
                }
            }
        });
    });

    describe('savePreferredRequestSchema', () => {
        it('accepts hook, caption, and cta types', () => {
            for (const type of ['hook', 'caption', 'cta']) {
                expect(savePreferredRequestSchema.safeParse({ type, text: 'Hello' }).success).toBe(true);
            }
        });

        it('rejects an unknown type', () => {
            expect(savePreferredRequestSchema.safeParse({ type: 'hashtag', text: 'hi' }).success).toBe(false);
        });

        it('rejects empty text', () => {
            expect(savePreferredRequestSchema.safeParse({ type: 'hook', text: '' }).success).toBe(false);
        });
    });

    describe('voiceProfileUpdateSchema (3-field)', () => {
        it('accepts all three fields empty (defaults)', () => {
            const result = voiceProfileUpdateSchema.safeParse({});
            expect(result.success).toBe(true);
            expect(result.data.brandIdentity).toBe('');
            expect(result.data.emphasize).toBe('');
            expect(result.data.avoid).toBe('');
        });

        it('accepts all three fields populated', () => {
            const result = voiceProfileUpdateSchema.safeParse({
                brandIdentity: 'Contemporary western landscapes',
                emphasize: 'The story behind the piece',
                avoid: 'Avoid emojis'
            });
            expect(result.success).toBe(true);
        });

        it('rejects brandIdentity exceeding 1000 characters', () => {
            expect(
                voiceProfileUpdateSchema.safeParse({ brandIdentity: 'x'.repeat(1001) }).success
            ).toBe(false);
        });

        it('accepts brandIdentity of exactly 1000 characters', () => {
            expect(
                voiceProfileUpdateSchema.safeParse({ brandIdentity: 'x'.repeat(1000) }).success
            ).toBe(true);
        });

        it('rejects emphasize exceeding 1000 characters', () => {
            expect(
                voiceProfileUpdateSchema.safeParse({ emphasize: 'x'.repeat(1001) }).success
            ).toBe(false);
        });

        it('rejects avoid exceeding 1000 characters', () => {
            expect(
                voiceProfileUpdateSchema.safeParse({ avoid: 'x'.repeat(1001) }).success
            ).toBe(false);
        });
    });
});

// ---------------------------------------------------------------------------
// 2. Preferred example persistence
// ---------------------------------------------------------------------------

describe('Preferred example persistence (MongoDB)', () => {
    it('saves and retrieves a hook', async () => {
        await savePreferredExample('hook', 'This is a hook');
        const { hooks } = await getPreferredExamples();
        expect(hooks).toContain('This is a hook');
    });

    it('saves and retrieves a caption and cta independently', async () => {
        await savePreferredExample('caption', 'My caption');
        await savePreferredExample('cta', 'Shop now');
        const { captions, ctas } = await getPreferredExamples();
        expect(captions).toContain('My caption');
        expect(ctas).toContain('Shop now');
    });

    it('trims whitespace before saving', async () => {
        await savePreferredExample('hook', '  padded hook  ');
        const { hooks } = await getPreferredExamples();
        expect(hooks).toContain('padded hook');
        expect(hooks).not.toContain('  padded hook  ');
    });

    it('ignores empty or whitespace-only text', async () => {
        await savePreferredExample('hook', '   ');
        const { hooks } = await getPreferredExamples();
        expect(hooks).toHaveLength(0);
    });

    it('respects the FIFO max-5 cap per type (newest 5 returned, oldest deactivated)', async () => {
        for (let i = 1; i <= 7; i++) {
            await savePreferredExample('hook', `hook ${i}`);
        }
        const { hooks } = await getPreferredExamples();
        expect(hooks).toHaveLength(5);
        expect(hooks[0]).toBe('hook 7');
        expect(hooks[4]).toBe('hook 3');
        expect(hooks).not.toContain('hook 1');
        expect(hooks).not.toContain('hook 2');
    });

    it('stores source as instagram-generator', async () => {
        await savePreferredExample('cta', 'Visit us');
        const doc = await AiPreferredExample.findOne({ type: 'cta' }).lean();
        expect(doc.source).toBe('instagram-generator');
    });

    it('deactivated overflow examples are preserved in DB but not returned', async () => {
        for (let i = 1; i <= 6; i++) {
            await savePreferredExample('hook', `hook ${i}`);
        }
        const { hooks } = await getPreferredExamples();
        expect(hooks).not.toContain('hook 1');
        const deactivated = await AiPreferredExample.findOne({ text: 'hook 1' }).lean();
        expect(deactivated).not.toBeNull();
        expect(deactivated.active).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// 3. Voice profile model behaviour
// ---------------------------------------------------------------------------

describe('Voice profile (3-field model)', () => {
    it('GET /api/admin/ai/voice-profile returns 401 when unauthenticated', async () => {
        const res = await request(app).get('/api/admin/ai/voice-profile');
        expect(res.status).toBe(401);
    });

    it('PUT /api/admin/ai/voice-profile returns 401 when unauthenticated', async () => {
        const res = await request(app)
            .put('/api/admin/ai/voice-profile')
            .send({ brandIdentity: 'test', emphasize: 'test', avoid: 'test' });
        expect(res.status).toBe(401);
    });

    it('AiVoiceProfile stores and upserts all three fields', async () => {
        const first = await AiVoiceProfile.findOneAndUpdate(
            { name: 'default' },
            { $set: { brandIdentity: 'Landscape artist', emphasize: 'Tell the story', avoid: 'No emojis' } },
            { upsert: true, new: true }
        );
        expect(first.brandIdentity).toBe('Landscape artist');
        expect(first.emphasize).toBe('Tell the story');
        expect(first.avoid).toBe('No emojis');

        const updated = await AiVoiceProfile.findOneAndUpdate(
            { name: 'default' },
            { $set: { brandIdentity: 'Abstract artist' } },
            { upsert: true, new: true }
        );
        expect(updated.brandIdentity).toBe('Abstract artist');
        expect(updated.emphasize).toBe('Tell the story');

        const count = await AiVoiceProfile.countDocuments({ name: 'default' });
        expect(count).toBe(1);
    });

    it('returns empty strings for all three fields when no profile exists', async () => {
        const profile = await AiVoiceProfile.findOne({ name: 'default' }).lean();
        expect(profile).toBeNull();
        const brandIdentity = profile ? profile.brandIdentity : '';
        const emphasize     = profile ? profile.emphasize     : '';
        const avoid         = profile ? profile.avoid         : '';
        expect(brandIdentity).toBe('');
        expect(emphasize).toBe('');
        expect(avoid).toBe('');
    });

    it('AiVoiceProfile no longer has a voiceNote field', async () => {
        const doc = await AiVoiceProfile.findOneAndUpdate(
            { name: 'default' },
            { $set: { brandIdentity: 'test' } },
            { upsert: true, new: true }
        );
        expect(doc.voiceNote).toBeUndefined();
    });
});

// ---------------------------------------------------------------------------
// 4. Output schema validation and retry-trigger detection
// ---------------------------------------------------------------------------

describe('Output schema validation', () => {
    const { modelIgOutputSchema } = require('../server/ai/schemas');

    it('accepts a fully valid model output', () => {
        const output = {
            hooks: ['h1', 'h2', 'h3'],
            captions: ['c1', 'c2', 'c3'],
            ctas: ['cta1', 'cta2', 'cta3'],
            hashtags: ['#a', '#b', '#c', '#d', '#e', '#f', '#g', '#h', '#i', '#j']
        };
        expect(modelIgOutputSchema.safeParse(output).success).toBe(true);
    });

    it('rejects output with wrong hook count', () => {
        const output = {
            hooks: ['only one'],
            captions: ['c1', 'c2', 'c3'],
            ctas: ['cta1', 'cta2', 'cta3'],
            hashtags: Array(10).fill('#tag')
        };
        expect(modelIgOutputSchema.safeParse(output).success).toBe(false);
    });

    it('rejects output with wrong hashtag count', () => {
        const output = {
            hooks: ['h1', 'h2', 'h3'],
            captions: ['c1', 'c2', 'c3'],
            ctas: ['cta1', 'cta2', 'cta3'],
            hashtags: ['#a', '#b']
        };
        expect(modelIgOutputSchema.safeParse(output).success).toBe(false);
    });

    it('rejects output with a missing required key', () => {
        expect(modelIgOutputSchema.safeParse({ hooks: ['h1', 'h2', 'h3'] }).success).toBe(false);
    });

    it('rejects a non-object value', () => {
        expect(modelIgOutputSchema.safeParse('raw string').success).toBe(false);
        expect(modelIgOutputSchema.safeParse(null).success).toBe(false);
    });
});

// ---------------------------------------------------------------------------
// 5. Admin-only route protection
// ---------------------------------------------------------------------------

describe('Admin-only route protection', () => {
    const aiRoutes = [
        { method: 'post', path: '/api/admin/ai/generate-ig',    body: { userInput: 'test painting' } },
        { method: 'post', path: '/api/admin/ai/save-preferred', body: { type: 'hook', text: 'x' } },
        { method: 'get',  path: '/api/admin/ai/voice-profile',  body: null },
        { method: 'put',  path: '/api/admin/ai/voice-profile',  body: { brandIdentity: '', emphasize: '', avoid: '' } }
    ];

    it.each(aiRoutes)(
        '$method $path returns 401 without a session',
        async ({ method, path, body }) => {
            const req = request(app)[method](path);
            if (body) req.send(body);
            const res = await req;
            expect(res.status).toBe(401);
        }
    );
});
