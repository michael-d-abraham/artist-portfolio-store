import { ref } from 'vue';

const mobileMenuOpen = ref(false);

export function useMobileNav() {
  function toggleMobileMenu() {
    mobileMenuOpen.value = !mobileMenuOpen.value;
  }

  function closeMobileMenu() {
    mobileMenuOpen.value = false;
  }

  return {
    mobileMenuOpen,
    toggleMobileMenu,
    closeMobileMenu
  };
}
