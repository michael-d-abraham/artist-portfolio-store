import { ref, computed } from 'vue';
import { getProducts } from '../services/api.js';
import {
    getCart,
    setCartQuantity,
    removeFromCart
} from '../utils/cart.js';
import {
    displayProductName,
    primaryProductImageUrl
} from '../utils/storefrontProduct.js';

const drawerOpen = ref(false);
const promoExpanded = ref(false);
const cartVersion = ref(0);
const productsById = ref(new Map());
let productsLoaded = false;

function bumpCart() {
    cartVersion.value += 1;
}

function onCartUpdated() {
    bumpCart();
}

if (typeof window !== 'undefined') {
    window.addEventListener('cart-updated', onCartUpdated);
}

async function ensureProducts() {
    if (productsLoaded) {
        return;
    }
    try {
        const list = await getProducts();
        const map = new Map();
        list.forEach((p) => map.set(String(p._id), p));
        productsById.value = map;
        productsLoaded = true;
    } catch {
        productsById.value = new Map();
    }
}

export function useCart() {
    const rawLines = computed(() => {
        cartVersion.value;
        return getCart();
    });

    const items = computed(() => {
        return rawLines.value
            .map((line) => {
                const product = productsById.value.get(line.productId);
                if (!product) {
                    return null;
                }
                const priceCents = product.price_cents ?? 0;
                const imageUrl = primaryProductImageUrl(product) || '';
                return {
                    id: line.productId,
                    name: displayProductName(product),
                    priceCents,
                    imageUrl,
                    optionLabel: product.size_label || '',
                    quantity: line.quantity
                };
            })
            .filter(Boolean);
    });

    const itemCount = computed(() =>
        items.value.reduce((sum, line) => sum + line.quantity, 0)
    );

    const estimatedTotalCents = computed(() =>
        items.value.reduce((sum, line) => sum + line.priceCents * line.quantity, 0)
    );

    const isEmpty = computed(() => items.value.length === 0);

    function openDrawer() {
        drawerOpen.value = true;
        ensureProducts();
    }

    function closeDrawer() {
        drawerOpen.value = false;
    }

    function toggleDrawer() {
        if (!drawerOpen.value) {
            openDrawer();
        } else {
            closeDrawer();
        }
    }

    function setQuantity(id, quantity) {
        setCartQuantity(id, quantity);
    }

    function increment(id) {
        const line = items.value.find((i) => i.id === id);
        if (line && line.quantity < 99) {
            setCartQuantity(id, line.quantity + 1);
        }
    }

    function decrement(id) {
        const line = items.value.find((i) => i.id === id);
        if (line && line.quantity > 1) {
            setCartQuantity(id, line.quantity - 1);
        }
    }

    function removeItem(id) {
        removeFromCart(id);
    }

    function togglePromo() {
        promoExpanded.value = !promoExpanded.value;
    }

    function lineTotalCents(line) {
        return line.priceCents * line.quantity;
    }

    function itemCountLabel(count) {
        if (count === 1) return '(1 item)';
        return `(${count} items)`;
    }

    ensureProducts();

    return {
        items,
        drawerOpen,
        promoExpanded,
        itemCount,
        estimatedTotalCents,
        isEmpty,
        openDrawer,
        closeDrawer,
        toggleDrawer,
        setQuantity,
        increment,
        decrement,
        removeItem,
        togglePromo,
        lineTotalCents,
        itemCountLabel
    };
}
