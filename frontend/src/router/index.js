import { createRouter, createWebHistory } from 'vue-router';
import Gallery from '../pages/Gallery.vue';
import Contact from '../pages/Contact.vue';
import ProductDetail from '../pages/ProductDetail.vue';
import AdminList from '../pages/AdminList.vue';
import AdminForm from '../pages/AdminForm.vue';
import AdminCreate from '../pages/AdminCreate.vue';
import AdminInstagramAi from '../pages/AdminInstagramAi.vue';
import AdminSocialLinks from '../pages/AdminSocialLinks.vue';
import AdminLogin from '../pages/AdminLogin.vue';
import Checkout from '../pages/Checkout.vue';
import OrderSuccess from '../pages/OrderSuccess.vue';
import CheckoutCancel from '../pages/CheckoutCancel.vue';
import { getAdminSession } from '../services/api.js';

const routes = [
    { path: '/', name: 'gallery', component: Gallery },
    { path: '/checkout', name: 'checkout', component: Checkout },
    { path: '/order-success', name: 'order-success', component: OrderSuccess },
    {
        path: '/checkout/success',
        redirect: (to) => ({
            path: '/order-success',
            query: to.query
        })
    },
    { path: '/checkout/cancel', name: 'checkout-cancel', component: CheckoutCancel },
    { path: '/contact', name: 'contact', component: Contact },
    // Old artwork URLs — storefront is product-first; send users to gallery.
    { path: '/art/:slug', redirect: { name: 'gallery' } },
    { path: '/product/:slug', name: 'product-detail', component: ProductDetail, props: true },
    { path: '/admin/login', name: 'admin-login', component: AdminLogin },
    { path: '/admin', name: 'admin-list', component: AdminList },
    { path: '/admin/new', name: 'admin-new', component: AdminCreate },
    { path: '/admin/edit/:id', name: 'admin-edit', component: AdminForm, props: true },
    { path: '/admin/instagram-ai', name: 'admin-instagram-ai', component: AdminInstagramAi },
    { path: '/admin/social-links', name: 'admin-social-links', component: AdminSocialLinks }
];

const router = createRouter({
    history: createWebHistory(),
    routes
});

router.beforeEach(async (to) => {
    if (!to.path.startsWith('/admin')) {
        return true;
    }
    if (to.name === 'admin-login') {
        return true;
    }
    try {
        await getAdminSession();
        return true;
    } catch {
        return { name: 'admin-login', query: { redirect: to.fullPath } };
    }
});

export default router;
