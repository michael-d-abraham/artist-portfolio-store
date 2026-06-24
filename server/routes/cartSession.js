const express = require('express');
const { clampCartQuantity } = require('../../shared/cartQuantity');

const router = express.Router();

function normalizeCartItems(raw) {
    if (!Array.isArray(raw)) {
        return [];
    }
    return raw
        .filter((line) => line && line.productId != null && String(line.productId).trim())
        .map((line) => ({
            productId: String(line.productId).trim(),
            slug: line.slug != null ? String(line.slug).trim() : '',
            quantity: clampCartQuantity(line.quantity)
        }));
}

router.get('/', function (req, res) {
    const items = Array.isArray(req.session.cart) ? req.session.cart : [];
    res.json({ items });
});

router.put('/', function (req, res) {
    req.session.cart = normalizeCartItems(req.body && req.body.items);

    req.session.save(function (err) {
        if (err) {
            console.error('cart session save', err);
            return res.status(500).json({ error: 'Could not save cart' });
        }
        res.json({ items: req.session.cart });
    });
});

module.exports = router;
