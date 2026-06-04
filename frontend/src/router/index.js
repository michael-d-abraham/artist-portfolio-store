import { createRouter, createWebHistory } from 'vue-router';
import Home from '../pages/Home.vue';
import Gallery from '../pages/Gallery.vue';
import Contact from '../pages/Contact.vue';
import ProductDetail from '../pages/ProductDetail.vue';
import AdminLayout from '../components/admin/AdminLayout.vue';
import AdminDashboard from '../pages/admin/AdminDashboard.vue';
import AdminOrders from '../pages/admin/AdminOrders.vue';
import AdminListings from '../pages/admin/AdminListings.vue';
import AdminCustomize from '../pages/admin/AdminCustomize.vue';
import AdminSettings from '../pages/admin/AdminSettings.vue';
import AdminForm from '../pages/AdminForm.vue';
import AdminCreate from '../pages/AdminCreate.vue';
import AdminInstagramAi from '../pages/AdminInstagramAi.vue';
import AdminLogin from '../pages/AdminLogin.vue';
import Checkout from '../pages/Checkout.vue';
import OrderSuccess from '../pages/OrderSuccess.vue';
import CheckoutCancel from '../pages/CheckoutCancel.vue';
import { getAdminSession } from '../services/api.js';

const routes = [
    { path: '/', name: 'home', component: Home },
    { path: '/gallery', name: 'gallery', component: Gallery },
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
    { path: '/art/:slug', redirect: { name: 'gallery' } },
    { path: '/product/:slug', name: 'product-detail', component: ProductDetail, props: true },
    { path: '/admin/login', name: 'admin-login', component: AdminLogin },
    {
        path: '/admin',
        component: AdminLayout,
        children: [
            { path: '', redirect: { name: 'admin-dashboard' } },
            { path: 'dashboard', name: 'admin-dashboard', component: AdminDashboard },
            { path: 'orders', name: 'admin-orders', component: AdminOrders },
            { path: 'listings', name: 'admin-listings', component: AdminListings },
            { path: 'customize', name: 'admin-customize', component: AdminCustomize },
            { path: 'ai', name: 'admin-ai', component: AdminInstagramAi },
            { path: 'settings', name: 'admin-settings', component: AdminSettings },
            { path: 'new', name: 'admin-new', component: AdminCreate },
            { path: 'edit/:id', name: 'admin-edit', component: AdminForm, props: true }
        ]
    },
    { path: '/admin/social-links', redirect: '/admin/customize' },
    { path: '/admin/display-pictures', redirect: '/admin/customize' },
    { path: '/admin/instagram-ai', redirect: '/admin/ai' }
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
