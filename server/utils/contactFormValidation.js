const MAX_NAME = 200;
const MAX_SUBJECT = 300;
const MAX_MESSAGE = 10000;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isNonEmptyString(value) {
    return value != null && String(value).trim() !== '';
}

/**
 * @param {object} body
 * @returns {{ ok: true, data: { name: string, email: string, subject: string, message: string } } | { ok: false, message: string }}
 */
function validateContactFormBody(body) {
    if (body == null || typeof body !== 'object') {
        return { ok: false, message: 'Invalid request body.' };
    }

    const name = body.name != null ? String(body.name).trim() : '';
    const email = body.email != null ? String(body.email).trim() : '';
    const subject = body.subject != null ? String(body.subject).trim() : '';
    const message = body.message != null ? String(body.message).trim() : '';

    if (!isNonEmptyString(name)) {
        return { ok: false, message: 'Name is required.' };
    }
    if (name.length > MAX_NAME) {
        return { ok: false, message: 'Name is too long.' };
    }
    if (!isNonEmptyString(email)) {
        return { ok: false, message: 'Email is required.' };
    }
    if (!EMAIL_RE.test(email)) {
        return { ok: false, message: 'Enter a valid email address.' };
    }
    if (!isNonEmptyString(subject)) {
        return { ok: false, message: 'Subject is required.' };
    }
    if (subject.length > MAX_SUBJECT) {
        return { ok: false, message: 'Subject is too long.' };
    }
    if (!isNonEmptyString(message)) {
        return { ok: false, message: 'Message is required.' };
    }
    if (message.length > MAX_MESSAGE) {
        return { ok: false, message: 'Message is too long.' };
    }

    return {
        ok: true,
        data: { name, email, subject, message }
    };
}

module.exports = { validateContactFormBody };
