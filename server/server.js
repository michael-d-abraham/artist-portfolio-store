// Imports
const express = require('express');
const session = require('express-session');

// Route imports
const artworkRoutes = require('./routes/artworks');
const adminArtworkRoutes = require('./routes/adminArtworks');
const adminProductTypeRoutes = require('./routes/adminProductTypes');
const adminProductRoutes = require('./routes/adminProducts');
const adminProductImageRoutes = require('./routes/adminProductImages');
const adminCatalogItemRoutes = require('./routes/adminCatalogItems');
const adminSessionRoutes = require('./routes/adminSession');
const productRoutes = require('./routes/product');
const productsRoutes = require('./routes/products');
const aiIgRoutes = require('./routes/aiIg');
const { attachAdminUser, requireAdminRole } = require('./middleware/adminAuth');

// App Setup
const app = express();
const PORT = process.env.PORT || 3000;

// Database Connection
// This runs the MongoDB connection setup.
// It also loads the Mongoose models used elsewhere in the app.
require('./db');

// Global Middleware
// Parse incoming JSON request bodies
app.use(express.json());

// Session (admin login — same pattern as class: req.session.userId)
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

// API Routes
// Public artworks: /api/artworks; public catalog: /api/products, /api/product
//
// Admin (CRUD + workflow): single mount per resource — no duplicate admin routers.
//   artworks:        /api/admin/artworks
//   product types:   /api/admin/product-types
//   products:        /api/admin/products  (also :productId/images, :productId/inventory for stock patch)
//   product images:  /api/admin/product-images  (list-by-product lives under /api/admin/products/.../images)
//   catalog bundle:  /api/admin/catalog-items    POST orchestration only
app.use('/api/artworks', artworkRoutes);
// Admin auth: public session endpoints, then DB-backed attachAdminUser + requireAdminRole on all other admin APIs.
app.use('/api/admin/session', adminSessionRoutes);
app.use('/api/admin/artworks', ...requireAdmin, adminArtworkRoutes);
app.use('/api/admin/product-types', ...requireAdmin, adminProductTypeRoutes);
app.use('/api/admin/products', ...requireAdmin, adminProductRoutes);
app.use('/api/admin/product-images', ...requireAdmin, adminProductImageRoutes);
app.use('/api/admin/catalog-items', ...requireAdmin, adminCatalogItemRoutes);
app.use('/api/product', productRoutes);
app.use('/api/products', productsRoutes);
app.use('/api/admin/ai', ...requireAdmin, aiIgRoutes);

// Start Server
app.listen(PORT, () => {
    console.log(`Server listening on http://localhost:${PORT}`);
});
