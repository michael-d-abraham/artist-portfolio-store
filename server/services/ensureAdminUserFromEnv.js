const AdminUser = require('../models/AdminUser');
const { hashPassword, verifyPassword } = require('../utils/adminPassword');

/**
 * Create or sync the admin user from ADMIN_USERNAME and ADMIN_PASSWORD when both are set.
 */
async function ensureAdminUserFromEnv() {
    const username =
        process.env.ADMIN_USERNAME != null ? String(process.env.ADMIN_USERNAME).trim() : '';
    const password =
        process.env.ADMIN_PASSWORD != null ? String(process.env.ADMIN_PASSWORD) : '';

    if (!username || !password) {
        return;
    }

    const existing = await AdminUser.findOne({ username });
    if (!existing) {
        await AdminUser.create({
            username,
            passwordHash: hashPassword(password),
            enabled: true,
            isAdmin: true
        });
        return;
    }

    const $set = { enabled: true, isAdmin: true };
    if (!verifyPassword(password, existing.passwordHash)) {
        $set.passwordHash = hashPassword(password);
    }

    await AdminUser.updateOne({ _id: existing._id }, { $set });
}

module.exports = { ensureAdminUserFromEnv };
