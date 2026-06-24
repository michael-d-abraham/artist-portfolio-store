const mongoose = require('mongoose');
const { SiteSettings, Product } = require('../db');
const { applyProductRelations } = require('../utils/productPopulate');
const {
    primaryProductImageUrl,
    displayProductName,
    formatMoneyFromCents
} = require('../utils/storefrontProductDisplay');
const {
    PLATFORMS,
    DEFAULT_SOCIAL_LINKS,
    isValidHttpUrl
} = require('../utils/socialLinksDefaults');
const {
    FEATURED_PRODUCT_SLOTS,
    DEFAULT_HOME_PAGE,
    emptyFeaturedProduct,
    mergeHomePageTextDefaults
} = require('../utils/homePageDefaults');
const { withContactFormLabelDefaults } = require('../utils/contactPageDefaults');
const { isValidEmail } = require('../../shared/email');

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
    if (!isValidEmail(email)) {
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

function mergeContactPageStored(stored) {
    const base = stored && typeof stored === 'object' ? stored : {};

    return {
        show_hero_image: base.show_hero_image !== false,
        page_title: normalizeOptionalText(base.page_title),
        form_name_label: normalizeOptionalText(base.form_name_label),
        form_email_label: normalizeOptionalText(base.form_email_label),
        form_subject_label: normalizeOptionalText(base.form_subject_label),
        form_message_label: normalizeOptionalText(base.form_message_label),
        form_submit_label: normalizeOptionalText(base.form_submit_label),
        success_message: normalizeOptionalText(base.success_message)
    };
}

function toContactPageAdminPayload(doc) {
    const heroUrl =
        doc.contact_hero_image_url != null ? String(doc.contact_hero_image_url).trim() : '';
    const page = mergeContactPageStored(doc.contact_page);

    return {
        contact_hero_image_url: heroUrl,
        ...page
    };
}

async function getAdminDisplayPictures() {
    const doc = await ensureSiteSettingsDoc();
    return toContactPageAdminPayload(doc);
}

async function getPublicContactHero() {
    const doc = await ensureSiteSettingsDoc();
    const heroUrl =
        doc.contact_hero_image_url != null ? String(doc.contact_hero_image_url).trim() : '';
    const page = withContactFormLabelDefaults(doc.contact_page);

    return {
        image_url: heroUrl || null,
        ...page
    };
}

function normalizeContactPageInput(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return { errors: ['Request body is required'] };
    }

    const $set = {};

    if (body.contact_hero_image_url !== undefined) {
        const heroParsed = normalizeContactHeroImageUrl(body.contact_hero_image_url);
        if (heroParsed.errors) {
            errors.push(...heroParsed.errors);
        } else {
            $set.contact_hero_image_url = heroParsed.contact_hero_image_url;
        }
    }

    const contactPage = {};
    let hasContactPageFields = false;

    if (body.show_hero_image !== undefined) {
        contactPage.show_hero_image = Boolean(body.show_hero_image);
        hasContactPageFields = true;
    }

    const textFields = [
        'page_title',
        'form_name_label',
        'form_email_label',
        'form_subject_label',
        'form_message_label',
        'form_submit_label',
        'success_message'
    ];

    for (const field of textFields) {
        if (body[field] !== undefined) {
            contactPage[field] = normalizeOptionalText(body[field]);
            hasContactPageFields = true;
        }
    }

    if (errors.length) {
        return { errors };
    }

    if (!Object.keys($set).length && !hasContactPageFields) {
        return { errors: ['No fields to update'] };
    }

    if (hasContactPageFields) {
        $set.contact_page = contactPage;
    }

    return { $set, partialContactPage: hasContactPageFields, errors: null };
}

function normalizeOptionalImageUrl(value, fieldName, errors) {
    if (value === undefined || value === null) {
        return '';
    }
    const url = String(value).trim();
    if (!url) {
        return '';
    }
    if (!isValidHttpUrl(url)) {
        errors.push(`${fieldName} must be a valid http or https URL`);
        return null;
    }
    return url;
}

function normalizeOptionalText(value) {
    if (value === undefined || value === null) {
        return '';
    }
    return String(value).trim();
}

function padFeaturedProductIds(raw) {
    const items = Array.isArray(raw) ? raw : [];
    const result = [];
    for (let i = 0; i < FEATURED_PRODUCT_SLOTS; i++) {
        const row = items[i] && typeof items[i] === 'object' ? items[i] : {};
        const product_id =
            row.product_id != null
                ? String(row.product_id).trim()
                : row._id != null
                  ? String(row._id).trim()
                  : '';
        result.push({ product_id });
    }
    return result;
}

function emptyFeaturedCard() {
    return {
        product_id: '',
        slug: '',
        title: '',
        price: '',
        image_url: ''
    };
}

function productToFeaturedCard(product) {
    if (!product) {
        return emptyFeaturedCard();
    }
    return {
        product_id: String(product._id),
        slug: product.slug ? String(product.slug) : '',
        title: displayProductName(product),
        price: formatMoneyFromCents(product.price_cents, product.currency || 'usd'),
        image_url: primaryProductImageUrl(product) ?? ''
    };
}

async function resolveFeaturedProductCards(slots) {
    const ids = slots
        .map((s) => s.product_id)
        .filter((id) => id && mongoose.Types.ObjectId.isValid(id));

    let byId = new Map();
    if (ids.length) {
        const products = await applyProductRelations(
            Product.find({
                _id: { $in: ids },
                is_active: true,
                deleted_at: null
            })
        ).exec();
        byId = new Map(products.map((p) => [String(p._id), p]));
    }

    return slots.map((slot) => {
        if (!slot.product_id) {
            return emptyFeaturedCard();
        }
        const product = byId.get(slot.product_id);
        if (!product) {
            return { ...emptyFeaturedCard(), product_id: slot.product_id };
        }
        return productToFeaturedCard(product);
    });
}

function toAdminHomePagePayload(doc) {
    const base = doc.home_page || {};
    return {
        hero_title: normalizeOptionalText(base.hero_title),
        hero_subtitle: normalizeOptionalText(base.hero_subtitle),
        hero_image_url: normalizeOptionalText(base.hero_image_url),
        featured_title: normalizeOptionalText(base.featured_title),
        featured_products: padFeaturedProductIds(base.featured_products),
        about_title: normalizeOptionalText(base.about_title),
        about_header: normalizeOptionalText(base.about_header),
        about_text: normalizeOptionalText(base.about_text),
        about_image_url: normalizeOptionalText(base.about_image_url)
    };
}

async function toPublicHomePagePayload(doc) {
    const base = doc.home_page || {};
    const text = mergeHomePageTextDefaults(base);
    const slots = padFeaturedProductIds(base.featured_products);
    const featured_products = await resolveFeaturedProductCards(slots);
    return { ...text, featured_products };
}

function normalizeHomePageInput(body) {
    const errors = [];
    if (!body || typeof body !== 'object') {
        return { errors: ['Request body is required'] };
    }

    const hero_image_url = normalizeOptionalImageUrl(
        body.hero_image_url,
        'hero_image_url',
        errors
    );
    if (hero_image_url === null) {
        return { errors };
    }

    const about_image_url = normalizeOptionalImageUrl(
        body.about_image_url,
        'about_image_url',
        errors
    );
    if (about_image_url === null) {
        return { errors };
    }

    const featured_products = [];
    const rawFeatured = Array.isArray(body.featured_products) ? body.featured_products : [];
    const usedProductIds = new Set();
    for (let i = 0; i < FEATURED_PRODUCT_SLOTS; i++) {
        const row = rawFeatured[i] && typeof rawFeatured[i] === 'object' ? rawFeatured[i] : {};
        const product_id = normalizeOptionalText(row.product_id);
        if (product_id) {
            if (!mongoose.Types.ObjectId.isValid(product_id)) {
                errors.push(`featured_products[${i}].product_id is invalid`);
            } else if (usedProductIds.has(product_id)) {
                errors.push(`featured_products[${i}]: each listing can only be featured once`);
            } else {
                usedProductIds.add(product_id);
            }
        }
        featured_products.push({ product_id });
    }

    if (errors.length) {
        return { errors };
    }

    return {
        home_page: {
            hero_title: normalizeOptionalText(body.hero_title),
            hero_subtitle: normalizeOptionalText(body.hero_subtitle),
            hero_image_url,
            featured_title: normalizeOptionalText(body.featured_title),
            featured_products,
            about_title: normalizeOptionalText(body.about_title),
            about_header: normalizeOptionalText(body.about_header),
            about_text: normalizeOptionalText(body.about_text),
            about_image_url
        }
    };
}

async function getAdminHomePage() {
    const doc = await ensureSiteSettingsDoc();
    return toAdminHomePagePayload(doc);
}

async function getPublicHomePage() {
    const doc = await ensureSiteSettingsDoc();
    return await toPublicHomePagePayload(doc);
}

async function updateHomePage(body) {
    const parsed = normalizeHomePageInput(body);
    if (parsed.errors) {
        return { ok: false, status: 400, errors: parsed.errors };
    }

    const doc = await SiteSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set: { home_page: parsed.home_page } },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return { ok: true, settings: toAdminHomePagePayload(doc) };
}

async function updateDisplayPictures(body) {
    const parsed = normalizeContactPageInput(body);
    if (parsed.errors) {
        return { ok: false, status: 400, errors: parsed.errors };
    }

    const doc = await ensureSiteSettingsDoc();
    const $set = { ...parsed.$set };

    if (parsed.partialContactPage && parsed.$set.contact_page) {
        $set.contact_page = {
            ...mergeContactPageStored(doc.contact_page),
            ...parsed.$set.contact_page
        };
    }

    const updated = await SiteSettings.findOneAndUpdate(
        { key: SETTINGS_KEY },
        { $set },
        { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    return { ok: true, settings: toContactPageAdminPayload(updated) };
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
    getAdminHomePage,
    getPublicHomePage,
    updateHomePage,
    ensureSiteSettingsDoc,
    FEATURED_PRODUCT_SLOTS,
    emptyFeaturedProduct
};
