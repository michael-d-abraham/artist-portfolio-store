const rateLimit = require('express-rate-limit');

/**
 * Rate limiting is disabled during automated tests so existing suites are not
 * throttled, unless a test explicitly opts in via ENABLE_RATE_LIMIT=1.
 */
function shouldSkip() {
    return process.env.NODE_ENV === 'test' && process.env.ENABLE_RATE_LIMIT !== '1';
}

function jsonLimitHandler(message) {
    return function (req, res) {
        res.status(429).json({ error: message });
    };
}

/**
 * Brute-force protection for admin login. Only failed attempts count toward the
 * limit, so a legitimate admin signing in is never locked out by their own success.
 */
const loginRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 10,
    standardHeaders: true,
    legacyHeaders: false,
    skipSuccessfulRequests: true,
    skip: shouldSkip,
    handler: jsonLimitHandler(
        'Too many login attempts. Please wait a few minutes and try again.'
    )
});

/** Abuse protection for the public contact form (prevents mail flooding). */
const contactRateLimiter = rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 5,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
    handler: function (req, res) {
        res.status(429).json({
            success: false,
            message: 'Too many messages sent. Please try again later.'
        });
    }
});

/** Looser cap on checkout-session creation to limit Stripe session abuse. */
const checkoutRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 30,
    standardHeaders: true,
    legacyHeaders: false,
    skip: shouldSkip,
    handler: jsonLimitHandler('Too many checkout attempts. Please try again shortly.')
});

module.exports = {
    loginRateLimiter,
    contactRateLimiter,
    checkoutRateLimiter
};
