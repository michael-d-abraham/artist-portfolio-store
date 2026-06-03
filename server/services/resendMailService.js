const { Resend } = require('resend');
const { getPublicContactEmail } = require('./siteSettingsService');

async function resolveNotificationEmail() {
    const { email } = await getPublicContactEmail();
    if (email) {
        return String(email).trim();
    }

    const fromEnv =
        process.env.NOTIFICATION_EMAIL != null
            ? String(process.env.NOTIFICATION_EMAIL).trim()
            : '';
    return fromEnv;
}

function getResendClient() {
    const apiKey = process.env.RESEND_API_KEY != null ? String(process.env.RESEND_API_KEY).trim() : '';
    if (!apiKey) {
        const err = new Error('RESEND_API_KEY is not configured');
        err.code = 'RESEND_NOT_CONFIGURED';
        throw err;
    }
    return new Resend(apiKey);
}

function getFromAddress() {
    const from = process.env.RESEND_FROM_EMAIL != null ? String(process.env.RESEND_FROM_EMAIL).trim() : '';
    if (from) {
        return from;
    }
    return 'PermSite <onboarding@resend.dev>';
}

/**
 * @param {{ to: string, subject: string, text: string, html?: string, replyTo?: string }} params
 * @returns {Promise<{ ok: true } | { ok: false, error: unknown }>}
 */
async function sendResendEmail({ to, subject, text, html, replyTo }) {
    const resend = getResendClient();
    const payload = {
        from: getFromAddress(),
        to: [to],
        subject,
        text
    };
    if (html) {
        payload.html = html;
    }
    if (replyTo) {
        payload.replyTo = replyTo;
    }

    const { error } = await resend.emails.send(payload);
    if (error) {
        return { ok: false, error };
    }
    return { ok: true };
}

module.exports = {
    resolveNotificationEmail,
    getResendClient,
    getFromAddress,
    sendResendEmail
};
