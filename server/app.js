const path = require('path');
const express = require('express');
const session = require('express-session');

const adminProductRoutes = require('./routes/adminProducts');
const adminSessionRoutes = require('./routes/adminSession');
const checkoutRoutes = require('./routes/checkout');
const { createCheckoutSessionHandler } = require('./controllers/checkoutController');
const ordersRoutes = require('./routes/orders');
const stripeWebhookRoutes = require('./routes/stripeWebhook');
const { listRouter, detailRouter } = require('./routes/catalog');
const aiIgRoutes = require('./routes/aiIg');
const siteRoutes = require('./routes/site');
const contactRoutes = require('./routes/contact');
const adminSiteSettingsRoutes = require('./routes/adminSiteSettings');
const adminUploadRoutes = require('./routes/adminUpload');
const { attachAdminUser, requireAdminRole } = require('./middleware/adminAuth');

function createApp() {
    const app = express();

    app.use(
        '/api/webhooks/stripe',
        express.raw({ type: 'application/json' }),
        stripeWebhookRoutes
    );

    app.use(express.json());

    app.use(
        session({
            secret: process.env.SESSION_SECRET || 'dev-session-secret-change-me',
            saveUninitialized: false,
            resave: false,
            cookie: {
                httpOnly: true,
                sameSite: 'lax',
                secure: process.env.NODE_ENV === 'production',
                maxAge: 7 * 24 * 60 * 60 * 1000
            }
        })
    );

    const requireAdmin = [attachAdminUser, requireAdminRole];

    app.use('/api/admin/session', adminSessionRoutes);
    app.use('/api/admin', ...requireAdmin, adminUploadRoutes);
    app.use('/api/admin/products', ...requireAdmin, adminProductRoutes);
    app.use('/api/admin/site', ...requireAdmin, adminSiteSettingsRoutes);
    app.use('/api/site', siteRoutes);
    app.use('/api/contact', contactRoutes);
    app.use('/api/products', listRouter);
    app.use('/api/product', detailRouter);
    app.use('/api/checkout', checkoutRoutes);
    app.post('/api/create-checkout-session', createCheckoutSessionHandler);
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
