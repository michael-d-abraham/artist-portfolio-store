export const ADMIN_NAV_ITEMS = [
    { to: '/admin/dashboard', label: 'Dashboard' },
    { to: '/admin/orders', label: 'Orders' },
    { to: '/admin/listings', label: 'Listing' },
    { to: '/admin/customize', label: 'Customize' },
    { to: '/admin/ai', label: 'AI' },
    { to: '/admin/settings', label: 'Settings' }
];

export function isAdminNavActive(currentPath, path) {
    if (path === '/admin/listings') {
        return (
            currentPath === '/admin/listings' ||
            currentPath === '/admin/new' ||
            currentPath.startsWith('/admin/edit/')
        );
    }
    return currentPath === path || currentPath.startsWith(`${path}/`);
}
