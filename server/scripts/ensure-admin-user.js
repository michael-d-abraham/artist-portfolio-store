/**
 * One-off: ensure admin user exists from .env (ADMIN_USERNAME, ADMIN_PASSWORD).
 * Usage: node server/scripts/ensure-admin-user.js
 */
const path = require('path');

require('dotenv').config({ path: path.join(__dirname, '..', '..', '.env') });
process.env.SKIP_DB_AUTO_CONNECT = '1';

const { connectDb, disconnectDb } = require('../db');
const { ensureAdminUserFromEnv } = require('../services/ensureAdminUserFromEnv');

async function main() {
    await connectDb();
    await ensureAdminUserFromEnv();
    await disconnectDb();
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
