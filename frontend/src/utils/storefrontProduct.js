/**
 * Storefront display helpers — Product is the source of truth for catalog display.
 */

import {
    displayProductName,
    primaryProductImage,
    primaryProductImageUrl
} from '@shared/productDisplay.js';

export { displayProductName, primaryProductImage, primaryProductImageUrl };

export function productTitle(product) {
    if (product?.title) {
        return product.title;
    }
    return product?.slug || 'Product';
}

export function productFormat(product) {
    return product?.format ? String(product.format).trim() : '';
}
