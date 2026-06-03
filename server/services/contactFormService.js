const { resolveNotificationEmail, sendResendEmail } = require('./resendMailService');
const { validateContactFormBody } = require('../utils/contactFormValidation');

const EMAIL_SUBJECT = '[PermSite] Contact Form Submission';

function buildEmailText({ name, email, subject, message }) {
    return [
        'New Contact Form Submission',
        '',
        `Name: ${name}`,
        `Email: ${email}`,
        `Subject: ${subject}`,
        '',
        'Message:',
        '',
        message
    ].join('\n');
}

/**
 * @param {object} body
 * @returns {Promise<{ ok: true, message: string } | { ok: false, status: number, message: string }>}
 */
async function submitContactForm(body) {
    const validated = validateContactFormBody(body);
    if (!validated.ok) {
        return { ok: false, status: 400, message: validated.message };
    }

    const to = await resolveNotificationEmail();
    if (!to) {
        return {
            ok: false,
            status: 503,
            message:
                'Contact form is not set up yet. Add an email under Admin → Links, or set NOTIFICATION_EMAIL in the server environment.'
        };
    }

    const { name, email, subject, message } = validated.data;

    try {
        const sendResult = await sendResendEmail({
            to,
            subject: EMAIL_SUBJECT,
            text: buildEmailText({ name, email, subject, message }),
            replyTo: email
        });

        if (!sendResult.ok) {
            const error = sendResult.error;
            console.error('Resend contact form', error);
            const devHint =
                process.env.NODE_ENV !== 'production' && error?.message
                    ? ` ${error.message}`
                    : '';
            return {
                ok: false,
                status: 502,
                message: `Unable to send message.${devHint}`
            };
        }

        return {
            ok: true,
            message: 'Message sent successfully.'
        };
    } catch (err) {
        console.error('submitContactForm', err);
        if (err.code === 'RESEND_NOT_CONFIGURED') {
            return {
                ok: false,
                status: 503,
                message: 'Email service is not configured. Set RESEND_API_KEY on the server.'
            };
        }
        const devHint =
            process.env.NODE_ENV !== 'production' && err.message ? ` ${err.message}` : '';
        return {
            ok: false,
            status: 500,
            message: `Unable to send message.${devHint}`
        };
    }
}

module.exports = { submitContactForm };
