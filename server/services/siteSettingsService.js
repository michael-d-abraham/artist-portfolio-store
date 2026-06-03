const { SiteSettings } = require('../db');
const {
    PLATFORMS,
    DEFAULT_SOCIAL_LINKS,
    isValidHttpUrl
} = require('../utils/socialLinksDefaults');

const SETTINGS_KEY = 'default';

function normalizeSocialLinksInput(raw) {
    if (!raw || typeof raw !== 'object') {
        return { errors: ['social_links must be an object'] };
    }

    const errors = [];
    const social_links = {};

    for (const platform of PLATFORMS) {
        const entry = raw[platform];
        if (entry == null || typeof entry !== 'object') {
            errors.push(`social_links.${platform} is required`);
            continue;
        }

        const enabled = Boolean(entry.enabled);
        const url = entry.url != null ? String(entry.url).trim() : '';

        if (enabled && !isValidHttpUrl(url)) {
            errors.push(
                `social_links.${platform}.url must be a valid http or https URL when enabled`
            );
            continue;
        }

        social_links[platform] = {
            url: enabled ? url : url || DEFAULT_SOCIAL_LINKS[platform].url,
            enabled
        };
    }

    if (errors.length) {
        return { errors };
    }

    return { social_links };
}

async function ensureSiteSettingsDoc() {
    let doc = await SiteSettings.findOne({ key: SETTINGS_KEY });
    if (!doc) {
        doc = await SiteSettings.create({
            key: SETTINGS_KEY,
            social_links: DEFAULT_SOCIAL_LINKS
        });
    }
    return doc;
}

function toAdminPayload(doc) {
    const links = doc.social_links || {};
    const social_links = {};
    PLATFORMS.forEach((platform) => {
        const row = links[platform] || DEFAULT_SOCIAL_LINKS[platform];
        social_links[platform] = {
            url: row.url || DEFAULT_SOCIAL_LINKS[platform].url,
            enabled: row.enabled !== false
        };
    });
    return { social_links };
}

function toPublicPayload(doc) {
    const links = doc.social_links || {};
    return PLATFORMS.filter((platform) => {
        const row = links[platform];
        return row && row.enabled && isValidHttpUrl(row.url);
    }).map((platform) => ({
        platform,
        url: String(links[platform].url).trim()
    }));
}

async function getAdminSocialSettings() {
    const doc = await ensureSiteSettingsDoc();
    return toAdminPayload(doc);
}

async function getPublicSocialLinks() {
    const doc = await ensureSiteSettingsDoc();
    return { links: toPublicPayload(doc) };
}

async function updateSocialSettings(body) {
    const parsed = normalizeSocialLinksInput(body && body.social_links);
    if (parsed.errors) {
        return { ok: false, status: 400, errors: parsed.errors };
    }

    const doc = await SiteSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set: { social_links: parsed.social_links } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return { ok: true, settings: toAdminPayload(doc) };
}

module.exports = {
    getAdminSocialSettings,
    getPublicSocialLinks,
    updateSocialSettings,
    ensureSiteSettingsDoc
};
