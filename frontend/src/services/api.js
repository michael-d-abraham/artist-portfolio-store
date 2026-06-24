/**
 * API base: same-origin `/api` (Vite dev server proxies to Express).
 *
 * Storefront: getProducts, getProductBySlug, createCheckoutSession
 * Admin products: CRUD + toggle (images on create via images[])
 * Admin Instagram AI: generateIgContent, savePreferredExample
 */

async function fetchJson(url, options = {}) {
    const headers = {
        ...options.headers
    };
    let body = options.body;
    if (body !== undefined && body !== null && typeof body === 'object' && !(body instanceof FormData)) {
        headers['Content-Type'] = 'application/json';
        body = JSON.stringify(body);
    }

    const res = await fetch(url, {
        credentials: 'include',
        ...options,
        headers,
        body
    });

    const text = await res.text();
    let data = {};
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = {};
        }
    }

    if (!res.ok) {
        const msg =
            data.error ||
            (Array.isArray(data.errors) ? data.errors.join(' ') : null) ||
            res.statusText;
        const err = new Error(msg || 'Request failed');
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export function getProducts() {
    return fetchJson('/api/products');
}

export function getPublicSocialLinks() {
    return fetchJson('/api/site/social-links');
}

export function getPublicContactHero() {
    return fetchJson('/api/site/contact-hero');
}

export function getPublicHomePage() {
    return fetchJson('/api/site/home-page');
}

/** Contact form — returns { success, message }; throws on failure with message in Error. */
export async function submitContactForm(body) {
    const res = await fetch('/api/contact', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
    });

    const text = await res.text();
    let data = {};
    if (text) {
        try {
            data = JSON.parse(text);
        } catch {
            data = {};
        }
    }

    if (!res.ok || data.success === false) {
        const err = new Error(data.message || 'Unable to send message.');
        err.status = res.status;
        err.data = data;
        throw err;
    }

    return data;
}

export function getAdminDisplayPictures() {
    return fetchJson('/api/admin/site/display-pictures');
}

export function updateAdminDisplayPictures(body) {
    return fetchJson('/api/admin/site/display-pictures', {
        method: 'PUT',
        body
    });
}

export function getAdminHomePage() {
    return fetchJson('/api/admin/site/home-page');
}

export function updateAdminHomePage(body) {
    return fetchJson('/api/admin/site/home-page', {
        method: 'PUT',
        body
    });
}

export function getAdminSocialLinks() {
    return fetchJson('/api/admin/site/social-links');
}

export function updateAdminSocialLinks(body) {
    return fetchJson('/api/admin/site/social-links', {
        method: 'PUT',
        body
    });
}

export function getProductBySlug(slug) {
    return fetchJson(`/api/product/${encodeURIComponent(slug)}`);
}

/**
 * Stripe Checkout — send only product_id + quantity; server sets price from DB.
 * Returns { url, sessionId } — redirect customer to url (Stripe-hosted page).
 */
export function createCheckoutSession(body) {
    return fetchJson('/api/create-checkout-session', {
        method: 'POST',
        body
    });
}

/** Guest cart persisted in server session (MongoDB). */
export function getCartSession() {
    return fetchJson('/api/cart');
}

export function putCartSession(items) {
    return fetchJson('/api/cart', {
        method: 'PUT',
        body: { items }
    });
}

/** Paid Checkout Session summary from Stripe (server-side; no client prices). */
export function getCheckoutSessionOrder(sessionId) {
    return fetchJson(
        `/api/orders/checkout-session/${encodeURIComponent(sessionId)}`
    );
}

export function loginAdmin(body) {
    return fetchJson('/api/admin/session/login', {
        method: 'POST',
        body
    });
}

export function getAdminSession() {
    return fetchJson('/api/admin/session');
}

export function logoutAdmin() {
    return fetchJson('/api/admin/session/logout', {
        method: 'POST'
    });
}

export function getAdminDashboard() {
    return fetchJson('/api/admin/dashboard');
}

export function getAdminOrders() {
    return fetchJson('/api/admin/orders');
}

export function updateAdminOrderFulfillmentStatus(orderId, fulfillment_status) {
    return fetchJson(`/api/admin/orders/${encodeURIComponent(orderId)}/fulfillment-status`, {
        method: 'PATCH',
        body: { fulfillment_status }
    });
}

export function getAdminProducts() {
    return fetchJson('/api/admin/products');
}

export function getAdminProductById(id) {
    return fetchJson(`/api/admin/products/${encodeURIComponent(id)}`);
}

export function createAdminProduct(body) {
    return fetchJson('/api/admin/products', {
        method: 'POST',
        body
    });
}

export function updateAdminProduct(id, body) {
    return fetchJson(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body
    });
}

export function deleteAdminProduct(id) {
    return fetchJson(`/api/admin/products/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
}

export function toggleAdminProductActive(id) {
    return fetchJson(`/api/admin/products/${encodeURIComponent(id)}/toggle-active`, {
        method: 'PATCH'
    });
}

/** Upload a product image to R2 (admin session required). Returns { image_url }. */
export function uploadAdminImage(file) {
    const formData = new FormData();
    formData.append('image', file);
    return fetchJson('/api/admin/upload-image', {
        method: 'POST',
        body: formData
    });
}

export function generateIgContent(body) {
    return fetchJson('/api/admin/ai/generate-ig', {
        method: 'POST',
        body
    });
}

export function savePreferredExample(body) {
    return fetchJson('/api/admin/ai/save-preferred', {
        method: 'POST',
        body
    });
}

/** Returns { brandIdentity, emphasize, avoid } */
export function getVoiceProfile() {
    return fetchJson('/api/admin/ai/voice-profile');
}

/** Body: { brandIdentity, emphasize, avoid } */
export function updateVoiceProfile(body) {
    return fetchJson('/api/admin/ai/voice-profile', {
        method: 'PUT',
        body
    });
}
