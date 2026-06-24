import { PLATFORM_LABELS } from '@shared/socialLinksDefaults.js';

/** Display size in CSS px — CDN assets match this (2x for retina). */
export const SOCIAL_ICON_DISPLAY_PX = 36;

const FILE_IDS = {
    youtube: '11062b_8dcadfa428954b1d919f8499f75aa27a~mv2.png',
    instagram: '11062b_55e4be1e75564866b6c28290f9a9d271~mv2.png',
    tiktok: '11062b_69d309d6dbde492fae325fb0deca6556~mv2.png',
    facebook: '11062b_2381e8a6e7444f4f902e7b649aa3f0ac~mv2.png'
};

function wixFillUrl(fileId, size) {
    return `https://static.wixstatic.com/media/${fileId}/v1/fill/w_${size},h_${size},al_c,q_85,usm_0.66_1.00_0.01,enc_avif,quality_auto/${fileId}`;
}

function buildIcon(fileId, alt) {
    const size = SOCIAL_ICON_DISPLAY_PX;
    const size2x = size * 2;
    const url1x = wixFillUrl(fileId, size);
    const url2x = wixFillUrl(fileId, size2x);
    return {
        alt,
        src: url1x,
        srcSet: `${url1x} 1x, ${url2x} 2x`,
        width: size,
        height: size
    };
}

/** Social platform icon images (Wix CDN) at native display resolution. */
export const SOCIAL_PLATFORM_ICONS = Object.fromEntries(
    Object.entries(FILE_IDS).map(([platform, fileId]) => [
        platform,
        buildIcon(fileId, PLATFORM_LABELS[platform])
    ])
);
