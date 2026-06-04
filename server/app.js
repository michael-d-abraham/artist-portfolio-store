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
const adminOrderRoutes = require('./routes/adminOrders');
const adminDashboardRoutes = require('./routes/adminDashboard');
const { attachAdminUser, requireAdminRole } = require('./middleware/adminAuth');
const { isProduction, sessionCookieOptions } = require('./sessionConfig');

function createApp() {
    const app = express();

    // Required on Render/Heroku etc. so secure session cookies work behind HTTPS proxy
    if (isProduction()) {
        app.set('trust proxy', 1);
    }

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
            proxy: isProduction(),
            cookie: sessionCookieOptions()
        })
    );

    const requireAdmin = [attachAdminUser, requireAdminRole];

    app.use('/api/admin/session', adminSessionRoutes);
    app.use('/api/admin', ...requireAdmin, adminUploadRoutes);
    app.use('/api/admin/products', ...requireAdmin, adminProductRoutes);
    app.use('/api/admin/orders', ...requireAdmin, adminOrderRoutes);
    app.use('/api/admin/dashboard', ...requireAdmin, adminDashboardRoutes);
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
