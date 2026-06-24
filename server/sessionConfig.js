function isProduction() {
    return process.env.NODE_ENV === 'production';
}

function sessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction(),
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
}

const REQUIRED_PRODUCTION_ENV = [
    'MONGO_STRING',
    'SESSION_SECRET',
    'STRIPE_SECRET_KEY',
    'STRIPE_WEBHOOK_SECRET',
    'R2_ACCESS_KEY_ID',
    'R2_SECRET_ACCESS_KEY',
    'R2_BUCKET_NAME',
    'R2_ENDPOINT',
    'R2_PUBLIC_URL',
    'RESEND_API_KEY'
];

/**
 * Fail fast at boot if a required secret is missing in production, instead of
 * silently degrading (e.g. signing sessions with a public default secret).
 * @param {NodeJS.ProcessEnv} [env]
 */
function assertProductionConfig(env = process.env) {
    if (env.NODE_ENV !== 'production') {
        return;
    }
    const missing = REQUIRED_PRODUCTION_ENV.filter(
        (key) => !env[key] || !String(env[key]).trim()
    );
    if (missing.length) {
        throw new Error(
            `Missing required production environment variables: ${missing.join(', ')}`
        );
    }
}

module.exports = {
    isProduction,
    sessionCookieOptions,
    assertProductionConfig,
    REQUIRED_PRODUCTION_ENV
};
