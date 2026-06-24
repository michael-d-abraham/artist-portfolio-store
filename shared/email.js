const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(value) {
    return typeof value === 'string' && EMAIL_RE.test(value.trim());
}

module.exports = { EMAIL_RE, isValidEmail };
