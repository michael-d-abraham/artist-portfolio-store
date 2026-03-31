const express = require('express');
const AdminUser = require('../models/AdminUser');
const { verifyPassword } = require('../utils/adminPassword');
const { attachAdminUser } = require('../middleware/adminAuth');

const router = express.Router();

router.post('/login', function (req, res) {
    const username = req.body && req.body.username;
    const plainPassword = req.body && req.body.plainPassword;

    if (!username || !plainPassword) {
        return res.status(422).json({ error: 'username and plainPassword are required' });
    }

    AdminUser.findOne({ username: String(username).trim() })
        .then(function (user) {
            if (!user || !verifyPassword(plainPassword, user.passwordHash)) {
                return res.sendStatus(401);
            }
            if (!user.enabled) {
                return res.sendStatus(401);
            }
            req.session.userId = user._id.toString();
            res.json({ ok: true });
        })
        .catch(function (err) {
            console.error('admin login', err);
            res.sendStatus(500);
        });
});

router.get('/', attachAdminUser, function (req, res) {
    res.json({
        _id: req.user._id,
        username: req.user.username,
        isAdmin: req.user.isAdmin,
        enabled: req.user.enabled
    });
});

router.post('/logout', function (req, res) {
    req.session.destroy(function (err) {
        if (err) {
            console.error('session destroy', err);
            return res.sendStatus(500);
        }
        res.clearCookie('connect.sid', { path: '/' });
        res.json({ ok: true });
    });
});

module.exports = router;
