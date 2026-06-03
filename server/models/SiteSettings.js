const mongoose = require('mongoose');

const socialLinkSchema = new mongoose.Schema(
    {
        url: { type: String, required: true, default: '' },
        enabled: { type: Boolean, required: true, default: true }
    },
    { _id: false }
);

const siteSettingsSchema = new mongoose.Schema(
    {
        key: { type: String, required: true, unique: true, default: 'default' },
        social_links: {
            youtube: { type: socialLinkSchema, default: () => ({}) },
            instagram: { type: socialLinkSchema, default: () => ({}) },
            tiktok: { type: socialLinkSchema, default: () => ({}) },
            facebook: { type: socialLinkSchema, default: () => ({}) }
        },
        contact_hero_image_url: { type: String, default: '' },
        contact_email: { type: String, default: '' }
    },
    {
        timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
        collection: 'site_settings'
    }
);

module.exports =
    mongoose.models.SiteSettings || mongoose.model('SiteSettings', siteSettingsSchema);
