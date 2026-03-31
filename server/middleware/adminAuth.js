const AdminUser = require('../models/AdminUser');

/**
 * Loads the admin user from MongoDB when req.session.userId is set (same idea as class authorizeUser).
 */
function attachAdminUser(req, res, next) {
    if (!req.session || !req.session.userId) {
        return res.sendStatus(401);
    }

    AdminUser.findById(req.session.userId)
        .then(function (user) {
            if (user && user.enabled) {
                req.user = user;
                next();
            } else {
                res.sendStatus(401);
            }
        })
        .catch(function (err) {
            console.error('attachAdminUser', err);
            res.sendStatus(500);
        });
}

/**
 * Ensures the loaded user is an admin (same idea as class authorizeAdmin).
 */
function requireAdminRole(req, res, next) {
    if (req.user && req.user.isAdmin) {
        next();
    } else {
        res.sendStatus(403);
    }
}

module.exports = { attachAdminUser, requireAdminRole };
