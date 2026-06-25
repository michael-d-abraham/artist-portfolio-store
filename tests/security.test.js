// Mock the LangGraph pipeline so Jest never tries to parse @langchain/langgraph's
// ESM-only uuid dependency. None of these tests exercise the generation pipeline.
jest.mock('../server/ai/igGenerationGraph', () => ({
    runIgGeneration: jest.fn().mockResolvedValue({ finalOutput: null, validationErrors: null }),
    igGenerationGraph: {},
    setModelForTesting: jest.fn()
}));

const request = require('supertest');
const { createApp } = require('../server/app');
const { AdminUser } = require('../server/db');
const { startTestDatabase, stopTestDatabase } = require('./helpers/mongo');
const { hashPassword } = require('../server/utils/adminPassword');
const { assertProductionConfig, REQUIRED_PRODUCTION_ENV } = require('../server/sessionConfig');
const { detectImageMime, uploadProductImage } = require('../server/services/r2StorageService');

const app = createApp();

const ADMIN = { username: 'sec-admin', password: 'correct horse battery staple' };
const LOGIN_PATH = '/api/admin/session/login';

function sidCookie(res) {
    const cookies = res.headers['set-cookie'] || [];
    const found = cookies.find((c) => c.startsWith('connect.sid='));
    return found ? found.split(';')[0] : null;
}

async function createAdmin(overrides = {}) {
    return AdminUser.create({
        username: ADMIN.username,
        passwordHash: hashPassword(ADMIN.password),
        enabled: true,
        isAdmin: true,
        ...overrides
    });
}

describe('assertProductionConfig (production env validation)', () => {
    it('does nothing outside production even when secrets are missing', () => {
        expect(() => assertProductionConfig({ NODE_ENV: 'development' })).not.toThrow();
        expect(() => assertProductionConfig({})).not.toThrow();
    });

    it('throws in production when a required secret is missing', () => {
        const env = {
            NODE_ENV: 'production',
            STRIPE_SECRET_KEY: 'sk_test_x',
            STRIPE_WEBHOOK_SECRET: 'whsec_x',
            MONGO_STRING: 'mongodb://localhost:27017'
            // SESSION_SECRET intentionally omitted
        };
        expect(() => assertProductionConfig(env)).toThrow(/SESSION_SECRET/);
    });

    it('passes in production when all required secrets are present', () => {
        const env = { NODE_ENV: 'production' };
        REQUIRED_PRODUCTION_ENV.forEach((key) => {
            env[key] = 'set';
        });
        expect(() => assertProductionConfig(env)).not.toThrow();
    });
});

describe('upload image content validation (magic bytes)', () => {
    const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 0]);
    const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0, 0, 0, 0, 0, 0, 0, 0]);
    const GIF = Buffer.from('GIF89a-----extra', 'ascii');
    const WEBP = Buffer.concat([
        Buffer.from('RIFF', 'ascii'),
        Buffer.from([0, 0, 0, 0]),
        Buffer.from('WEBP', 'ascii')
    ]);

    it('detects supported image types from their signatures', () => {
        expect(detectImageMime(PNG)).toBe('image/png');
        expect(detectImageMime(JPEG)).toBe('image/jpeg');
        expect(detectImageMime(GIF)).toBe('image/gif');
        expect(detectImageMime(WEBP)).toBe('image/webp');
    });

    it('returns null for non-image content', () => {
        expect(detectImageMime(Buffer.from('<html>not an image</html>'))).toBeNull();
        expect(detectImageMime(Buffer.from('GIF', 'ascii'))).toBeNull();
    });

    it('rejects a file whose bytes are not a real image even if MIME claims image/png', async () => {
        await expect(
            uploadProductImage({
                buffer: Buffer.from('this is plain text, not a PNG'),
                mimeType: 'image/png',
                originalName: 'evil.png'
            })
        ).rejects.toMatchObject({ code: 'INVALID_IMAGE' });
    });

    it('rejects a disallowed claimed MIME type', async () => {
        await expect(
            uploadProductImage({
                buffer: PNG,
                mimeType: 'image/svg+xml',
                originalName: 'x.svg'
            })
        ).rejects.toMatchObject({ code: 'INVALID_IMAGE' });
    });
});

describe('admin auth (login / logout / session)', () => {
    beforeAll(async () => {
        await startTestDatabase();
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await AdminUser.deleteMany({});
    });

    it('logs in with correct credentials and issues a session cookie', async () => {
        await createAdmin();
        const res = await request(app)
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });

        expect(res.status).toBe(200);
        expect(res.body).toMatchObject({ ok: true, username: ADMIN.username });
        expect(sidCookie(res)).toBeTruthy();
    });

    it('rejects a wrong password with a generic message', async () => {
        await createAdmin();
        const res = await request(app)
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: 'wrong-password' });

        expect(res.status).toBe(401);
        expect(res.body.error).toMatch(/not correct/i);
    });

    it('does not reveal that an account is disabled (same generic message)', async () => {
        await createAdmin({ enabled: false });

        const wrongRes = await request(app)
            .post(LOGIN_PATH)
            .send({ username: 'nope', plainPassword: 'whatever' });
        const disabledRes = await request(app)
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });

        expect(disabledRes.status).toBe(401);
        expect(disabledRes.body.error).toBe(wrongRes.body.error);
        expect(disabledRes.body.error).not.toMatch(/disabled/i);
    });

    it('returns 422 when fields are missing', async () => {
        const res = await request(app).post(LOGIN_PATH).send({ username: 'only-user' });
        expect(res.status).toBe(422);
    });

    it('regenerates the session id on login (anti session-fixation)', async () => {
        await createAdmin();
        const agent = request.agent(app);

        const pre = await agent
            .put('/api/cart')
            .send({ items: [{ productId: '507f1f77bcf86cd799439011', quantity: 1 }] });
        const preSid = sidCookie(pre);
        expect(preSid).toBeTruthy();

        const loginRes = await agent
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });
        const postSid = sidCookie(loginRes);

        expect(loginRes.status).toBe(200);
        expect(postSid).toBeTruthy();
        expect(postSid).not.toBe(preSid);
    });

    it('logout clears the session cookie', async () => {
        await createAdmin();
        const agent = request.agent(app);
        await agent
            .post(LOGIN_PATH)
            .send({ username: ADMIN.username, plainPassword: ADMIN.password });

        const res = await agent.post('/api/admin/session/logout');
        expect(res.status).toBe(200);
        expect(res.body.ok).toBe(true);
        const cleared = (res.headers['set-cookie'] || []).find((c) => c.startsWith('connect.sid='));
        expect(cleared).toMatch(/connect\.sid=;|Expires=Thu, 01 Jan 1970/);
    });
});

describe('admin authorization matrix', () => {
    const protectedRoutes = [
        '/api/admin/products',
        '/api/admin/orders',
        '/api/admin/dashboard',
        '/api/admin/site',
        '/api/admin/ai/voice-profile',
        '/api/admin/upload-image'
    ];

    beforeAll(async () => {
        await startTestDatabase();
    });

    afterAll(async () => {
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await AdminUser.deleteMany({});
    });

    it.each(protectedRoutes)('GET %s returns 401 without a session', async (route) => {
        const res = await request(app).get(route);
        expect(res.status).toBe(401);
    });

    it.each(protectedRoutes)(
        'GET %s returns 403 for an authenticated non-admin user',
        async (route) => {
            await createAdmin({ isAdmin: false });
            const agent = request.agent(app);
            const login = await agent
                .post(LOGIN_PATH)
                .send({ username: ADMIN.username, plainPassword: ADMIN.password });
            expect(login.status).toBe(200);

            const res = await agent.get(route);
            expect(res.status).toBe(403);
        }
    );
});

describe('rate limiting', () => {
    beforeAll(async () => {
        await startTestDatabase();
        process.env.ENABLE_RATE_LIMIT = '1';
    });

    afterAll(async () => {
        delete process.env.ENABLE_RATE_LIMIT;
        await stopTestDatabase();
    });

    beforeEach(async () => {
        await AdminUser.deleteMany({});
    });

    it('locks out repeated failed admin logins with 429', async () => {
        await createAdmin();

        let lastStatus;
        for (let i = 0; i < 11; i++) {
            const res = await request(app)
                .post(LOGIN_PATH)
                .send({ username: ADMIN.username, plainPassword: 'wrong-password' });
            lastStatus = res.status;
        }
        expect(lastStatus).toBe(429);
    });

    it('throttles the public contact form with 429 after the cap', async () => {
        let lastRes;
        for (let i = 0; i < 6; i++) {
            lastRes = await request(app)
                .post('/api/contact')
                .send({ name: 'A', email: 'a@b.com', subject: 'Hi', message: 'Hello there' });
        }
        expect(lastRes.status).toBe(429);
        expect(lastRes.body.success).toBe(false);
    });
});

describe('security headers', () => {
    // Uses an unauthenticated admin route (401, no DB access) so the assertion
    // does not depend on a live database connection.
    it('sets X-Content-Type-Options: nosniff via helmet', async () => {
        const res = await request(app).get('/api/admin/products');
        expect(res.status).toBe(401);
        expect(res.headers['x-content-type-options']).toBe('nosniff');
    });

    it('allows storefront image CDNs in CSP img-src', async () => {
        const res = await request(app).get('/api/admin/products');
        const csp = res.headers['content-security-policy'] || '';
        expect(csp).toMatch(/img-src[^;]*https:\/\/static\.wixstatic\.com/);
    });
});
