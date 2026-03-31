/**
 * API base: same-origin `/api` (Vite dev server proxies to Express).
 *
 * Storefront: getProducts (gallery), getProductBySlug (detail)
 * Admin: getAdminArtworks, getAdminArtworkById, updateArtwork, deleteArtwork, toggleArtworkActive
 * Admin create: getAdminProductTypes, createCatalogItem
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

/** Storefront — list products (populated artwork_id, product_type_id, product_images). */
export function getProducts() {
    return fetchJson('/api/products');
}

/** Storefront — one product by Product.slug */
export function getProductBySlug(slug) {
    return fetchJson(`/api/product/${encodeURIComponent(slug)}`);
}

/** Admin session (cookie) — login, current user, logout */
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

export function getAdminArtworks() {
    return fetchJson('/api/admin/artworks');
}

export function getAdminArtworkById(id) {
    return fetchJson(`/api/admin/artworks/${encodeURIComponent(id)}`);
}

/** Catalog orchestration: artwork + product type + product rows → DB */
export function createCatalogItem(body) {
    return fetchJson('/api/admin/catalog-items', {
        method: 'POST',
        body
    });
}

export function getAdminProductTypes() {
    return fetchJson('/api/admin/product-types');
}

export function updateArtwork(id, data) {
    return fetchJson(`/api/admin/artworks/${encodeURIComponent(id)}`, {
        method: 'PUT',
        body: data
    });
}

export function deleteArtwork(id) {
    return fetchJson(`/api/admin/artworks/${encodeURIComponent(id)}`, {
        method: 'DELETE'
    });
}

export function toggleArtworkActive(id) {
    return fetchJson(`/api/admin/artworks/${encodeURIComponent(id)}/toggle-active`, {
        method: 'PATCH'
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
