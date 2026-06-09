<template>
  <Teleport to="body">
    <Transition name="cart-overlay">
      <div
        v-if="drawerOpen"
        class="cart-overlay"
        aria-hidden="true"
        @click="closeDrawer"
      />
    </Transition>
    <Transition name="cart-panel">
      <aside
        v-if="drawerOpen"
        class="cart-drawer"
        role="dialog"
        aria-modal="true"
        aria-labelledby="cart-drawer-title"
      >
        <header class="cart-drawer__header">
          <div class="cart-drawer__title-wrap">
            <h2 id="cart-drawer-title" class="cart-drawer__title">Cart</h2>
            <span v-if="!isEmpty" class="cart-drawer__count">{{ itemCountLabel(itemCount) }}</span>
          </div>
          <button type="button" class="cart-drawer__close" aria-label="Close cart" @click="closeDrawer">
            <span aria-hidden="true">×</span>
          </button>
        </header>

        <div class="cart-drawer__body">
          <p v-if="isEmpty" class="cart-drawer__empty">Your cart is empty.</p>
          <ul v-else class="cart-drawer__list">
            <CartItem
              v-for="line in items"
              :key="line.id"
              :item="line"
              :line-total-cents="lineTotalCents(line)"
              @remove="removeItem(line.id)"
              @increment="increment(line.id)"
              @decrement="decrement(line.id)"
              @update:quantity="setQuantity(line.id, $event)"
            />
          </ul>

          <div v-if="!isEmpty" class="cart-drawer__promo">
            <button type="button" class="promo-toggle" @click="togglePromo">
              Enter a promo code
            </button>
            <Transition name="promo-panel">
              <div v-if="promoExpanded" class="promo-panel">
                <input type="text" class="promo-input" placeholder="Promo code" aria-label="Promo code">
                <button type="button" class="btn-ghost promo-apply">Apply</button>
              </div>
            </Transition>
          </div>
        </div>

        <CartFooter
          v-if="!isEmpty"
          :total-formatted="totalFormatted"
          @checkout="onGoCheckout"
        />
      </aside>
    </Transition>
  </Teleport>
</template>

<script setup>
import { computed, watch, onUnmounted } from 'vue';
import CartItem from './CartItem.vue';
import CartFooter from './CartFooter.vue';
import { useCart } from '../../composables/useCart.js';
import { formatUsdFromCents } from '../../utils/storefrontProduct.js';

const {
  items,
  drawerOpen,
  promoExpanded,
  itemCount,
  estimatedTotalCents,
  isEmpty,
  closeDrawer,
  setQuantity,
  increment,
  decrement,
  removeItem,
  togglePromo,
  lineTotalCents,
  itemCountLabel
} = useCart();

const totalFormatted = computed(() => formatUsdFromCents(estimatedTotalCents.value));

function onGoCheckout() {
  closeDrawer();
}

function onEscape(event) {
  if (event.key === 'Escape' && drawerOpen.value) {
    closeDrawer();
  }
}

watch(drawerOpen, (open) => {
  if (open) {
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onEscape);
  } else {
    document.body.style.overflow = '';
    window.removeEventListener('keydown', onEscape);
  }
});

onUnmounted(() => {
  document.body.style.overflow = '';
  window.removeEventListener('keydown', onEscape);
});
</script>

<style scoped>
.cart-overlay {
  position: fixed;
  inset: 0;
  z-index: 1100;
  background: rgba(0, 0, 0, 0.25);
}

.cart-drawer {
  position: fixed;
  top: 0;
  right: 0;
  bottom: 0;
  z-index: 1101;
  width: min(400px, 100vw);
  max-width: 100%;
  height: 100%;
  height: 100dvh;
  display: flex;
  flex-direction: column;
  min-height: 0;
  background: var(--color-surface);
  border-left: 1px solid var(--color-border);
  box-shadow: none;
}

.cart-drawer__header {
  flex-shrink: 0;
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-lg);
  border-bottom: 1px solid var(--color-border);
}

.cart-drawer__title-wrap {
  display: flex;
  flex-wrap: wrap;
  align-items: baseline;
  gap: 0.35rem 0.5rem;
}

.cart-drawer__title {
  margin: 0;
  font-family: var(--font-sans);
  font-size: 1rem;
  font-weight: 500;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text);
}

.cart-drawer__count {
  font-size: 1rem;
  color: var(--color-text-muted);
}

.cart-drawer__close {
  flex-shrink: 0;
  width: 2.25rem;
  height: 2.25rem;
  padding: 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-size: 1.75rem;
  line-height: 1;
  color: var(--color-text-muted);
}

.cart-drawer__close:hover {
  color: var(--color-text);
  background: rgba(0, 0, 0, 0.04);
}

.cart-drawer__body {
  flex: 1 1 auto;
  min-height: 0;
  overflow-y: auto;
  padding: 0 var(--space-lg);
  -webkit-overflow-scrolling: touch;
}

.cart-drawer__empty {
  margin: var(--space-2xl) 0;
  text-align: center;
  color: var(--color-text-muted);
  font-size: 1.0625rem;
}

.cart-drawer__list {
  margin: 0;
  padding: 0;
}

.cart-drawer__promo {
  padding: var(--space-lg) 0 var(--space-md);
  border-top: 1px solid var(--color-border);
}

.promo-toggle {
  width: 100%;
  text-align: left;
  padding: 0.65rem 0;
  border: none;
  background: transparent;
  box-shadow: none;
  font-size: 1rem;
  color: var(--color-text);
  text-decoration: underline;
  text-underline-offset: 0.15em;
}

.promo-toggle:hover {
  color: var(--color-text-muted);
  background: transparent;
}

.promo-panel {
  display: flex;
  gap: var(--space-sm);
  margin-top: var(--space-sm);
  overflow: hidden;
}

.promo-panel-enter-active,
.promo-panel-leave-active {
  transition: max-height 0.28s ease, opacity 0.22s ease, margin 0.28s ease;
}

.promo-panel-enter-from,
.promo-panel-leave-to {
  max-height: 0;
  opacity: 0;
  margin-top: 0;
}

.promo-panel-enter-to,
.promo-panel-leave-from {
  max-height: 4rem;
  opacity: 1;
}

.promo-input {
  flex: 1;
}

.promo-apply {
  flex-shrink: 0;
}

.cart-overlay-enter-active,
.cart-overlay-leave-active,
.cart-panel-enter-active,
.cart-panel-leave-active {
  transition: opacity 0.25s ease;
}

.cart-panel-enter-active,
.cart-panel-leave-active {
  transition: transform 0.28s ease, opacity 0.25s ease;
}

.cart-overlay-enter-from,
.cart-overlay-leave-to {
  opacity: 0;
}

.cart-panel-enter-from,
.cart-panel-leave-to {
  transform: translateX(100%);
  opacity: 0.98;
}

@media (max-width: 640px) {
  .cart-drawer {
    width: 100%;
    max-width: 100%;
    border-left: none;
  }

  .cart-drawer__header {
    position: sticky;
    top: 0;
    z-index: 1;
    background: var(--color-surface);
  }

  .cart-drawer__close {
    width: 44px;
    height: 44px;
    min-width: 44px;
    min-height: 44px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }

  .promo-toggle {
    min-height: 44px;
    display: inline-flex;
    align-items: center;
  }

  .promo-apply {
    min-height: 44px;
    min-width: 44px;
  }
}
</style>
