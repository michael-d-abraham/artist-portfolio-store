import { ref } from 'vue';

const adminMenuOpen = ref(false);

export function useAdminNav() {
    function toggleAdminMenu() {
        adminMenuOpen.value = !adminMenuOpen.value;
    }

    function closeAdminMenu() {
        adminMenuOpen.value = false;
    }

    return {
        adminMenuOpen,
        toggleAdminMenu,
        closeAdminMenu
    };
}
