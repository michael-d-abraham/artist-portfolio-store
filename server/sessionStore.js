const { MongoStore } = require('connect-mongo');
const { sessionCookieOptions, isProduction } = require('./sessionConfig');

const TTL_SECONDS = 7 * 24 * 60 * 60;

/**
 * Persistent session store (MongoDB). Replaces default MemoryStore so admin login
 * and cart survive restarts and work on Render.
 * @returns {import('connect-mongo').MongoStore | null}
 */
function createSessionStore() {
    const mongoUrl = process.env.MONGO_STRING;
    if (!mongoUrl) {
        return null;
    }

    const options = {
        mongoUrl,
        collectionName: 'sessions',
        ttl: TTL_SECONDS,
        autoRemove: 'native',
        touchAfter: 24 * 3600
    };

    const dbName = process.env.DB_NAME != null ? String(process.env.DB_NAME).trim() : '';
    if (dbName) {
        options.dbName = dbName;
    }

    return MongoStore.create(options);
}

/**
 * Resolve the session signing secret. The insecure default is only ever used
 * outside production; production must supply SESSION_SECRET (enforced here and
 * at boot via assertProductionConfig).
 * @returns {string}
 */
function resolveSessionSecret() {
    const secret = process.env.SESSION_SECRET && String(process.env.SESSION_SECRET).trim();
    if (secret) {
        return secret;
    }
    if (isProduction()) {
        throw new Error('SESSION_SECRET is required in production');
    }
    return 'dev-session-secret-change-me';
}

function sessionMiddlewareOptions() {
    const store = createSessionStore();
    const cookie = sessionCookieOptions();

    if (store) {
        console.log('[session] Using MongoDB store (collection: sessions)');
    } else {
        console.warn(
            '[session] MONGO_STRING is not set — using MemoryStore; sessions will not persist across restarts'
        );
    }

    return {
        secret: resolveSessionSecret(),
        saveUninitialized: false,
        resave: false,
        proxy: process.env.NODE_ENV === 'production',
        store: store || undefined,
        cookie
    };
}

module.exports = { createSessionStore, sessionMiddlewareOptions, TTL_SECONDS };
