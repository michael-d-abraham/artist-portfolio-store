const {
    getAdminSocialSettings,
    getPublicSocialLinks,
    updateSocialSettings
} = require('../services/siteSettingsService');

const getPublicSocialLinksHandler = async (_req, res) => {
    try {
        const data = await getPublicSocialLinks();
        return res.json(data);
    } catch (err) {
        console.error('getPublicSocialLinks', err);
        return res.status(500).json({ error: 'Failed to load social links' });
    }
};

const getAdminSocialSettingsHandler = async (_req, res) => {
    try {
        const settings = await getAdminSocialSettings();
        return res.json(settings);
    } catch (err) {
        console.error('getAdminSocialSettings', err);
        return res.status(500).json({ error: 'Failed to load settings' });
    }
};

const updateAdminSocialSettingsHandler = async (req, res) => {
    try {
        const result = await updateSocialSettings(req.body);
        if (!result.ok) {
            return res.status(result.status || 400).json({ errors: result.errors });
        }
        return res.json(result.settings);
    } catch (err) {
        console.error('updateAdminSocialSettings', err);
        return res.status(500).json({ error: 'Failed to save settings' });
    }
};

module.exports = {
    getPublicSocialLinksHandler,
    getAdminSocialSettingsHandler,
    updateAdminSocialSettingsHandler
};
