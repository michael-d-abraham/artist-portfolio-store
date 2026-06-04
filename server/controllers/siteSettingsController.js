const {
    getAdminSocialSettings,
    getPublicSocialLinks,
    getPublicContactEmail,
    updateSocialSettings,
    getAdminDisplayPictures,
    getPublicContactHero,
    updateDisplayPictures,
    getAdminHomePage,
    getPublicHomePage,
    updateHomePage
} = require('../services/siteSettingsService');

const getPublicContactEmailHandler = async (_req, res) => {
    try {
        const data = await getPublicContactEmail();
        return res.json(data);
    } catch (err) {
        console.error('getPublicContactEmail', err);
        return res.status(500).json({ error: 'Failed to load contact email' });
    }
};

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

const getPublicContactHeroHandler = async (_req, res) => {
    try {
        const data = await getPublicContactHero();
        return res.json(data);
    } catch (err) {
        console.error('getPublicContactHero', err);
        return res.status(500).json({ error: 'Failed to load contact image' });
    }
};

const getAdminDisplayPicturesHandler = async (_req, res) => {
    try {
        const settings = await getAdminDisplayPictures();
        return res.json(settings);
    } catch (err) {
        console.error('getAdminDisplayPictures', err);
        return res.status(500).json({ error: 'Failed to load display pictures' });
    }
};

const updateAdminDisplayPicturesHandler = async (req, res) => {
    try {
        const result = await updateDisplayPictures(req.body);
        if (!result.ok) {
            return res.status(result.status || 400).json({ errors: result.errors });
        }
        return res.json(result.settings);
    } catch (err) {
        console.error('updateAdminDisplayPictures', err);
        return res.status(500).json({ error: 'Failed to save display pictures' });
    }
};

const getPublicHomePageHandler = async (_req, res) => {
    try {
        const data = await getPublicHomePage();
        return res.json(data);
    } catch (err) {
        console.error('getPublicHomePage', err);
        return res.status(500).json({ error: 'Failed to load home page' });
    }
};

const getAdminHomePageHandler = async (_req, res) => {
    try {
        const settings = await getAdminHomePage();
        return res.json(settings);
    } catch (err) {
        console.error('getAdminHomePage', err);
        return res.status(500).json({ error: 'Failed to load home page settings' });
    }
};

const updateAdminHomePageHandler = async (req, res) => {
    try {
        const result = await updateHomePage(req.body);
        if (!result.ok) {
            return res.status(result.status || 400).json({ errors: result.errors });
        }
        return res.json(result.settings);
    } catch (err) {
        console.error('updateAdminHomePage', err);
        return res.status(500).json({ error: 'Failed to save home page settings' });
    }
};

module.exports = {
    getPublicContactEmailHandler,
    getPublicSocialLinksHandler,
    getAdminSocialSettingsHandler,
    updateAdminSocialSettingsHandler,
    getPublicContactHeroHandler,
    getAdminDisplayPicturesHandler,
    updateAdminDisplayPicturesHandler,
    getPublicHomePageHandler,
    getAdminHomePageHandler,
    updateAdminHomePageHandler
};
