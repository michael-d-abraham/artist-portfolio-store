const CART_KEY = 'artist-portfolio-cart';

function readCart() {
    try {
        const raw = localStorage.getItem(CART_KEY);
        const parsed = raw ? JSON.parse(raw) : [];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function notifyCartUpdated() {
    if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('cart-updated'));
    }
}

function writeCart(items) {
    localStorage.setItem(CART_KEY, JSON.stringify(items));
    notifyCartUpdated();
}

/**
 * Cart lines store only productId + quantity (+ slug for display).
 * Prices are never trusted from the client — server loads them at checkout.
 */
export function addToCart(product) {
    if (!product || !product._id) {
        return { ok: false, reason: 'invalid' };
    }
    const q = product.quantity_available;
    if (typeof q === 'number' && q <= 0) {
        return { ok: false, reason: 'out_of_stock' };
    }

    const cart = readCart();
    const id = String(product._id);
    const existing = cart.find((line) => line.productId === id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({
            productId: id,
            slug: product.slug || '',
            quantity: 1
        });
    }
    writeCart(cart);
    return { ok: true };
}

/** Replace cart with a single item (e.g. Buy now on product page). */
export function setBuyNowCart(product, quantity = 1) {
    if (!product || !product._id) {
        return { ok: false, reason: 'invalid' };
    }
    const qty = Math.max(1, Number(quantity) || 1);
    writeCart([
        {
            productId: String(product._id),
            slug: product.slug || '',
            quantity: qty
        }
    ]);
    return { ok: true };
}

export function getCart() {
    return readCart();
}

export function setCartQuantity(productId, quantity) {
    const cart = readCart();
    const line = cart.find((i) => i.productId === String(productId));
    if (!line) return;
    const next = Math.max(1, Math.min(99, Number(quantity) || 1));
    line.quantity = next;
    writeCart(cart);
}

export function removeFromCart(productId) {
    writeCart(readCart().filter((i) => i.productId !== String(productId)));
}

export function clearCart() {
    writeCart([]);
}

/** Payload for POST /api/checkout/create-session — ids and quantities only. */
export function getCheckoutItems() {
    return readCart().map((line) => ({
        product_id: line.productId,
        quantity: line.quantity
    }));
}
