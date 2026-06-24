const express = require('express');
const AdminUser = require('../models/AdminUser');
const { verifyPassword } = require('../utils/adminPassword');
const { attachAdminUser } = require('../middleware/adminAuth');
const { sessionCookieOptions } = require('../sessionConfig');
const { loginRateLimiter } = require('../middleware/rateLimiters');

const router = express.Router();

// Single generic message for all credential failures avoids leaking whether a
// username exists or an account is disabled.
const INVALID_CREDENTIALS_MESSAGE =
    'That username or password is not correct. Check your details and try again.';

router.post('/login', loginRateLimiter, async function (req, res) {
    const username = req.body && req.body.username;
    const plainPassword = req.body && req.body.plainPassword;

    if (!username || !String(username).trim() || !plainPassword) {
        return res.status(422).json({
            error: 'Please enter your username and password.'
        });
    }

    try {
        const user = await AdminUser.findOne({ username: String(username).trim() });

        if (!user) {
            return res.status(401).json({ error: INVALID_CREDENTIALS_MESSAGE });
        }

        if (!user.enabled) {
            console.warn('admin login attempt on disabled account', user._id.toString());
            return res.status(401).json({ error: INVALID_CREDENTIALS_MESSAGE });
        }

        if (!verifyPassword(String(plainPassword), user.passwordHash)) {
            return res.status(401).json({ error: INVALID_CREDENTIALS_MESSAGE });
        }

        // Regenerate the session on privilege change to prevent session fixation.
        req.session.regenerate(function (regenErr) {
            if (regenErr) {
                console.error('admin login session regenerate', regenErr);
                return res.status(500).json({
                    error: 'Something went wrong while signing you in. Please try again in a moment.'
                });
            }

            req.session.userId = user._id.toString();
            req.session.save(function (saveErr) {
                if (saveErr) {
                    console.error('admin login session save', saveErr);
                    return res.status(500).json({
                        error: 'Something went wrong while signing you in. Please try again in a moment.'
                    });
                }
                res.json({ ok: true, username: user.username });
            });
        });
    } catch (err) {
        console.error('admin login', err);
        res.status(500).json({
            error: 'Something went wrong while signing you in. Please try again in a moment.'
        });
    }
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
            return res.status(500).json({
                error: 'Could not sign you out. Please try again.'
            });
        }
        res.clearCookie('connect.sid', { path: '/', ...sessionCookieOptions() });
        res.json({ ok: true });
    });
});

module.exports = router;
