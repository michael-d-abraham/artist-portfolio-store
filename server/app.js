const path = require('path');
const express = require('express');
const session = require('express-session');
const helmet = require('helmet');

const adminProductRoutes = require('./routes/adminProducts');
const adminSessionRoutes = require('./routes/adminSession');
const { createCheckoutSessionHandler } = require('./controllers/checkoutController');
const ordersRoutes = require('./routes/orders');
const stripeWebhookRoutes = require('./routes/stripeWebhook');
const { listRouter, detailRouter } = require('./routes/catalog');
const aiIgRoutes = require('./routes/aiIg');
const siteRoutes = require('./routes/site');
const contactRoutes = require('./routes/contact');
const adminSiteSettingsRoutes = require('./routes/adminSiteSettings');
const adminUploadRoutes = require('./routes/adminUpload');
const adminOrderRoutes = require('./routes/adminOrders');
const adminDashboardRoutes = require('./routes/adminDashboard');
const { attachAdminUser, requireAdminRole } = require('./middleware/adminAuth');
const { isProduction } = require('./sessionConfig');
const { sessionMiddlewareOptions } = require('./sessionStore');
const { contactRateLimiter, checkoutRateLimiter } = require('./middleware/rateLimiters');
const cartSessionRoutes = require('./routes/cartSession');

function parseOrigin(value) {
    if (!value || typeof value !== 'string') {
        return null;
    }
    try {
        return new URL(value.trim()).origin;
    } catch {
        return null;
    }
}

/** Helmet defaults block all external images; allow storefront CDNs from env. */
function buildContentSecurityPolicyDirectives() {
    const imgSrc = ["'self'", 'data:', 'blob:', 'https://static.wixstatic.com'];

    const r2Origin = parseOrigin(process.env.R2_PUBLIC_URL);
    if (r2Origin) {
        imgSrc.push(r2Origin);
    }

    const extra = process.env.CSP_IMG_ORIGINS;
    if (extra) {
        for (const part of extra.split(',')) {
            const trimmed = part.trim();
            if (!trimmed) {
                continue;
            }
            const origin = parseOrigin(trimmed) || trimmed;
            if (!imgSrc.includes(origin)) {
                imgSrc.push(origin);
            }
        }
    }

    return {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        'img-src': imgSrc
    };
}

function createApp() {
    const app = express();

    // Required on Render/Heroku etc. so secure session cookies work behind HTTPS proxy
    if (isProduction()) {
        app.set('trust proxy', 1);
    }

    app.use(
        helmet({
            // Cross-origin product images (R2) must still load on the storefront.
            crossOriginEmbedderPolicy: false,
            crossOriginResourcePolicy: { policy: 'cross-origin' },
            contentSecurityPolicy: {
                directives: buildContentSecurityPolicyDirectives()
            }
        })
    );

    app.use(
        '/api/webhooks/stripe',
        express.raw({ type: 'application/json' }),
        stripeWebhookRoutes
    );

    app.use(express.json({ limit: '100kb' }));

    app.use(session(sessionMiddlewareOptions()));

    const requireAdmin = [attachAdminUser, requireAdminRole];

    app.use('/api/cart', cartSessionRoutes);
    app.use('/api/admin/session', adminSessionRoutes);
    app.use('/api/admin', ...requireAdmin, adminUploadRoutes);
    app.use('/api/admin/products', ...requireAdmin, adminProductRoutes);
    app.use('/api/admin/orders', ...requireAdmin, adminOrderRoutes);
    app.use('/api/admin/dashboard', ...requireAdmin, adminDashboardRoutes);
    app.use('/api/admin/site', ...requireAdmin, adminSiteSettingsRoutes);
    app.use('/api/site', siteRoutes);
    app.use('/api/contact', contactRateLimiter, contactRoutes);
    app.use('/api/products', listRouter);
    app.use('/api/product', detailRouter);
    app.post('/api/create-checkout-session', checkoutRateLimiter, createCheckoutSessionHandler);
    app.use('/api/orders', ordersRoutes);
    app.use('/api/admin/ai', ...requireAdmin, aiIgRoutes);

    if (process.env.NODE_ENV === 'production') {
        const frontendDistPath = path.join(__dirname, '../frontend/dist');

        app.use(express.static(frontendDistPath));

        // Express 5 requires a named wildcard (see path-to-regexp migration)
        app.get('/{*splat}', (req, res) => {
            res.sendFile(path.join(frontendDistPath, 'index.html'));
        });
    }

    return app;
}

module.exports = { createApp };
