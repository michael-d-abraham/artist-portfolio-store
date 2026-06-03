const { PaidCheckoutNotification } = require('../db');
const { resolveNotificationEmail, sendResendEmail } = require('./resendMailService');

const EMAIL_SUBJECT = '[PermSite] Order Received';
const EMAIL_TEXT = 'There was completed transaction.';

/**
 * Notify store owner once per paid Stripe Checkout session. Never throws.
 * @param {string} checkoutSessionId Stripe checkout session id (cs_...)
 * @returns {Promise<{ ok: boolean, skipped?: boolean }>}
 */
async function sendPaidTransactionNotification(checkoutSessionId) {
    const sessionId = checkoutSessionId != null ? String(checkoutSessionId).trim() : '';
    if (!sessionId) {
        return { ok: false };
    }

    try {
        const alreadySent = await PaidCheckoutNotification.findOne({
            stripe_checkout_session_id: sessionId
        }).lean();
        if (alreadySent) {
            return { ok: true, skipped: true };
        }

        const to = await resolveNotificationEmail();
        if (!to) {
            return { ok: false };
        }

        const sendResult = await sendResendEmail({
            to,
            subject: EMAIL_SUBJECT,
            text: EMAIL_TEXT
        });

        if (!sendResult.ok) {
            return { ok: false };
        }

        try {
            await PaidCheckoutNotification.create({ stripe_checkout_session_id: sessionId });
        } catch (err) {
            if (err && err.code === 11000) {
                return { ok: true, skipped: true };
            }
            throw err;
        }

        return { ok: true };
    } catch {
        return { ok: false };
    }
}

module.exports = { sendPaidTransactionNotification };
