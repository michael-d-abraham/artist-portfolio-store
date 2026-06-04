function isProduction() {
    return process.env.NODE_ENV === 'production';
}

function sessionCookieOptions() {
    return {
        httpOnly: true,
        sameSite: 'lax',
        secure: isProduction(),
        maxAge: 7 * 24 * 60 * 60 * 1000
    };
}

module.exports = { isProduction, sessionCookieOptions };
