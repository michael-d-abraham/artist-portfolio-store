const AdminUser = require('./models/AdminUser');
const { hashPassword } = require('./utils/adminPassword');

/**
 * If the collection is empty and ADMIN_USERNAME / ADMIN_PASSWORD are set,
 * creates the first admin account (simple bootstrap for local/dev).
 */
async function ensureDefaultAdmin() {
    const count = await AdminUser.countDocuments();
    if (count > 0) return;

    const username = process.env.ADMIN_USERNAME;
    const plainPassword = process.env.ADMIN_PASSWORD;
    if (!username || !plainPassword) {
        console.warn(
            '[admin] No AdminUser documents and ADMIN_USERNAME/ADMIN_PASSWORD not set — admin login will fail until you create a user.'
        );
        return;
    }

    await AdminUser.create({
        username: username.trim(),
        passwordHash: hashPassword(plainPassword),
        enabled: true,
        isAdmin: true
    });
    console.log('[admin] Created default admin user from environment.');
}

module.exports = { ensureDefaultAdmin };
