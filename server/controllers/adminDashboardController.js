const { getAdminDashboard } = require('../services/adminDashboardService');

async function getAdminDashboardHandler(req, res) {
    try {
        const dashboard = await getAdminDashboard();
        return res.json(dashboard);
    } catch (err) {
        console.error('getAdminDashboard', err);
        return res.status(500).json({ error: 'Unable to load dashboard' });
    }
}

module.exports = { getAdminDashboardHandler };
