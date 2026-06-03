<template>
  <div class="order-success">
    <p v-if="loading" class="status">Loading your order…</p>

    <template v-else-if="error">
      <h1 class="page-title">Unable to load order</h1>
      <p class="error">{{ error }}</p>
      <button type="button" class="btn-primary continue-btn" @click="goShopping">
        Continue shopping
      </button>
    </template>

    <template v-else-if="order">
      <h1 class="page-title">Thank you for your order</h1>
      <p class="lead">
        Your payment was successful. We’re preparing your order.
      </p>

      <section class="card" aria-labelledby="order-items-heading">
        <h2 id="order-items-heading" class="section-title">Order summary</h2>
        <ul class="items">
          <li v-for="(item, index) in order.items" :key="index" class="item-row">
            <div class="item-main">
              <span class="item-name">{{ item.name }}</span>
              <span class="item-qty">Qty {{ item.quantity }}</span>
            </div>
            <span class="item-price">{{ formatMoney(item.line_total_cents) }}</span>
          </li>
        </ul>

        <dl class="totals">
          <div v-if="order.amount_subtotal_cents != null" class="totals-row">
            <dt>Subtotal</dt>
            <dd>{{ formatMoney(order.amount_subtotal_cents) }}</dd>
          </div>
          <div v-if="order.amount_shipping_cents" class="totals-row">
            <dt>Shipping</dt>
            <dd>{{ formatMoney(order.amount_shipping_cents) }}</dd>
          </div>
          <div v-if="order.amount_tax_cents" class="totals-row">
            <dt>Tax</dt>
            <dd>{{ formatMoney(order.amount_tax_cents) }}</dd>
          </div>
          <div class="totals-row totals-row--total">
            <dt>Amount paid</dt>
            <dd>{{ formatMoney(order.amount_total_cents) }}</dd>
          </div>
        </dl>
      </section>

      <section v-if="hasCustomerInfo" class="card" aria-labelledby="customer-heading">
        <h2 id="customer-heading" class="section-title">Customer</h2>
        <p v-if="order.customer_name" class="info-line">{{ order.customer_name }}</p>
        <p v-if="order.customer_email" class="info-line">
          <a :href="'mailto:' + order.customer_email">{{ order.customer_email }}</a>
        </p>
        <p v-if="order.customer_email" class="note">
          A confirmation email will be sent to this address when Stripe processes it.
        </p>
      </section>

      <section v-if="order.shipping_address" class="card" aria-labelledby="shipping-heading">
        <h2 id="shipping-heading" class="section-title">Shipping address</h2>
        <address class="address">
          <span v-if="order.customer_name">{{ order.customer_name }}<br></span>
          <span v-if="order.shipping_address.line1">{{ order.shipping_address.line1 }}<br></span>
          <span v-if="order.shipping_address.line2">{{ order.shipping_address.line2 }}<br></span>
          <span>
            {{ cityStateZip(order.shipping_address) }}
            <template v-if="order.shipping_address.country">
              <br>{{ order.shipping_address.country }}
            </template>
          </span>
        </address>
      </section>

      <section
        v-if="order.billing_address && showBilling"
        class="card"
        aria-labelledby="billing-heading"
      >
        <h2 id="billing-heading" class="section-title">Billing address</h2>
        <address class="address">
          <span v-if="order.billing_address.line1">{{ order.billing_address.line1 }}<br></span>
          <span v-if="order.billing_address.line2">{{ order.billing_address.line2 }}<br></span>
          <span>
            {{ cityStateZip(order.billing_address) }}
            <template v-if="order.billing_address.country">
              <br>{{ order.billing_address.country }}
            </template>
          </span>
        </address>
      </section>

      <button type="button" class="btn-primary continue-btn" @click="goShopping">
        Continue shopping
      </button>
    </template>

    <template v-else>
      <h1 class="page-title">Order not found</h1>
      <p class="text-muted">
        Missing <code>session_id</code> in the URL. After payment you should see
        <code>/order-success?session_id=cs_test_...</code>
      </p>
      <p class="text-muted help">
        If the URL shows <code>{CHECKOUT_SESSION_ID}</code> literally, restart the server and ensure
        <code>CLIENT_URL</code> matches your Vite port (check the terminal).
      </p>
      <button type="button" class="btn-primary continue-btn" @click="goShopping">
        Continue shopping
      </button>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { getCheckoutSessionOrder } from '../services/api.js';
import { clearCart } from '../utils/cart.js';
import { formatMoneyFromCents } from '../utils/money.js';

const route = useRoute();
const router = useRouter();

function goShopping() {
  router.push({ name: 'gallery' });
}
const loading = ref(false);
const error = ref('');
const order = ref(null);

/** Read session_id from the browser URL (Stripe redirect query param). */
function readSessionIdFromUrl() {
  const params = new URLSearchParams(window.location.search);
  const id = params.get('session_id');
  if (import.meta.env.DEV) {
    console.log('sessionId from URL:', id);
  }
  return id && String(id).trim() ? String(id).trim() : '';
}

const sessionId = computed(() => readSessionIdFromUrl());

const hasCustomerInfo = computed(
  () => !!(order.value?.customer_name || order.value?.customer_email)
);

const showBilling = computed(() => {
  const ship = order.value?.shipping_address;
  const bill = order.value?.billing_address;
  if (!bill) return false;
  if (!ship) return true;
  return JSON.stringify(ship) !== JSON.stringify(bill);
});

function formatMoney(cents) {
  return formatMoneyFromCents(cents, order.value?.currency || 'usd');
}

function cityStateZip(addr) {
  const parts = [addr.city, addr.state, addr.postal_code].filter(Boolean);
  return parts.join(', ');
}

async function loadOrder() {
  error.value = '';
  order.value = null;

  const id = sessionId.value;
  if (!id) {
    return;
  }

  if (id.includes('CHECKOUT_SESSION_ID')) {
    error.value =
      'Stripe did not replace {CHECKOUT_SESSION_ID} in the success URL. Restart the server after setting CLIENT_URL, then complete checkout again.';
    return;
  }

  if (!id.startsWith('cs_')) {
    error.value =
      'Invalid session id in URL. Use the cs_test_... value from /order-success?session_id=...';
    return;
  }

  loading.value = true;
  try {
    const data = await getCheckoutSessionOrder(id);
    order.value = data;
    clearCart();
  } catch (e) {
    error.value = e.message || 'Could not load order details';
  } finally {
    loading.value = false;
  }
}

onMounted(loadOrder);
watch(() => route.fullPath, loadOrder);
</script>

<style scoped>
.order-success {
  max-width: 36rem;
  padding: var(--space-xl) 0 var(--space-2xl);
}

.status {
  color: var(--color-text-muted);
}

.lead {
  margin: 0 0 var(--space-xl);
  line-height: 1.55;
}

.card {
  background: var(--color-surface);
  border: none;
  border-top: 1px solid var(--color-border);
  border-bottom: 1px solid var(--color-border);
  padding: var(--space-xl) 0;
  margin-bottom: var(--space-xl);
  box-shadow: none;
}

.section-title {
  margin: 0 0 var(--space-md);
  font-size: 0.6875rem;
  font-weight: 400;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--color-text-muted);
}

.items {
  list-style: none;
  margin: 0;
  padding: 0;
}

.item-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  padding: var(--space-sm) 0;
  border-bottom: 1px solid var(--color-border);
}

.item-row:last-child {
  border-bottom: none;
}

.item-main {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.item-name {
  font-weight: 400;
  font-size: 0.875rem;
}

.item-qty {
  font-size: 0.8125rem;
  color: var(--color-text-muted);
}

.item-price {
  flex-shrink: 0;
  font-weight: 400;
  font-size: 0.875rem;
}

.totals {
  margin: var(--space-md) 0 0;
  padding-top: var(--space-md);
  border-top: 1px solid var(--color-border);
}

.totals-row {
  display: flex;
  justify-content: space-between;
  gap: var(--space-md);
  margin: 0.35rem 0;
  font-size: 0.9375rem;
}

.totals-row dt {
  margin: 0;
  color: var(--color-text-muted);
}

.totals-row dd {
  margin: 0;
  font-weight: 500;
}

.totals-row--total {
  margin-top: var(--space-sm);
  font-size: 0.875rem;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.totals-row--total dt,
.totals-row--total dd {
  color: var(--color-text);
  font-weight: 400;
}

.info-line {
  margin: 0 0 var(--space-xs);
}

.note {
  margin: var(--space-sm) 0 0;
  font-size: 0.875rem;
  color: var(--color-text-muted);
  line-height: 1.5;
}

.address {
  font-style: normal;
  line-height: 1.55;
}

.help {
  margin-top: var(--space-sm);
  font-size: 0.875rem;
}

.continue-btn {
  display: block;
  min-width: 12rem;
  margin-top: var(--space-xl);
  padding: 0.75rem 2rem;
  cursor: pointer;
}

.error {
  color: var(--color-error);
  margin-bottom: var(--space-lg);
  font-weight: 300;
}

@media (max-width: 640px) {
  .order-success {
    max-width: 100%;
    padding: var(--space-lg) 0 var(--space-2xl);
  }

  .lead {
    font-size: 1rem;
  }

  .card {
    padding: var(--space-lg) 0;
  }

  .item-row {
    flex-direction: column;
    align-items: flex-start;
    gap: var(--space-xs);
    padding: var(--space-md) 0;
  }

  .item-name {
    font-size: 1rem;
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .item-price {
    align-self: flex-start;
  }

  .totals-row {
    flex-wrap: wrap;
    font-size: 1rem;
  }

  .totals-row dt,
  .totals-row dd {
    min-width: 0;
    overflow-wrap: anywhere;
  }

  .address {
    overflow-wrap: anywhere;
    word-break: break-word;
  }

  .info-line {
    overflow-wrap: anywhere;
  }

  .continue-btn {
    width: 100%;
    min-width: 0;
    min-height: 48px;
    text-align: center;
  }
}
</style>
