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

function normalizeContactEmail(value) {
    if (value === undefined || value === null) {
        return { contact_email: '' };
    }
    const email = String(value).trim();
    if (!email) {
        return { contact_email: '' };
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        return { errors: ['contact_email must be a valid email address'] };
    }
    return { contact_email: email };
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
    const contact_email =
        doc.contact_email != null ? String(doc.contact_email).trim() : '';
    return { social_links, contact_email };
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

async function getPublicContactEmail() {
    const doc = await ensureSiteSettingsDoc();
    const email = doc.contact_email != null ? String(doc.contact_email).trim() : '';
    return { email: email || null };
}

function normalizeContactHeroImageUrl(value) {
    if (value === undefined || value === null) {
        return { contact_hero_image_url: '' };
    }
    const url = String(value).trim();
    if (!url) {
        return { contact_hero_image_url: '' };
    }
    if (!isValidHttpUrl(url)) {
        return { errors: ['contact_hero_image_url must be a valid http or https URL'] };
    }
    return { contact_hero_image_url: url };
}

function toDisplayPicturesPayload(doc) {
    const url = doc.contact_hero_image_url != null ? String(doc.contact_hero_image_url).trim() : '';
    return { contact_hero_image_url: url };
}

async function getAdminDisplayPictures() {
    const doc = await ensureSiteSettingsDoc();
    return toDisplayPicturesPayload(doc);
}

async function getPublicContactHero() {
    const doc = await ensureSiteSettingsDoc();
    const url =
        doc.contact_hero_image_url != null ? String(doc.contact_hero_image_url).trim() : '';
    return { image_url: url || null };
}

async function updateDisplayPictures(body) {
    const parsed = normalizeContactHeroImageUrl(
        body && body.contact_hero_image_url
    );
    if (parsed.errors) {
        return { ok: false, status: 400, errors: parsed.errors };
    }

    const doc = await SiteSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set: { contact_hero_image_url: parsed.contact_hero_image_url } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return { ok: true, settings: toDisplayPicturesPayload(doc) };
}

async function updateSocialSettings(body) {
    const errors = [];
    const $set = {};

    if (body && body.social_links !== undefined) {
        const parsed = normalizeSocialLinksInput(body.social_links);
        if (parsed.errors) {
            errors.push(...parsed.errors);
        } else {
            $set.social_links = parsed.social_links;
        }
    }

    if (body && body.contact_email !== undefined) {
        const emailParsed = normalizeContactEmail(body.contact_email);
        if (emailParsed.errors) {
            errors.push(...emailParsed.errors);
        } else {
            $set.contact_email = emailParsed.contact_email;
        }
    }

    if (errors.length) {
        return { ok: false, status: 400, errors };
    }

    if (!Object.keys($set).length) {
        return { ok: false, status: 400, errors: ['No fields to update'] };
    }

    const doc = await SiteSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return { ok: true, settings: toAdminPayload(doc) };
}

module.exports = {
    getAdminSocialSettings,
    getPublicSocialLinks,
    getPublicContactEmail,
    updateSocialSettings,
    getAdminDisplayPictures,
    getPublicContactHero,
    updateDisplayPictures,
    ensureSiteSettingsDoc
};
