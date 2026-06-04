<template>
  <div class="admin-page admin-dashboard">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Dashboard</h1>
    </header>

    <p v-if="loading" class="admin-page-header__status">Loading…</p>
    <p v-else-if="error" class="error admin-page-header__status">{{ error }}</p>

    <div v-else class="admin-dash">
      <section class="admin-float admin-dash-hero" aria-labelledby="dash-earned-heading">
        <p id="dash-earned-heading" class="admin-dash-hero__label">Total earned</p>
        <p class="admin-dash-hero__value">{{ formatAmount(stats.total_earned_cents, stats.currency) }}</p>
        <p class="admin-dash-hero__hint">From completed orders only</p>
      </section>

      <div class="admin-dash-columns">
        <section
          class="admin-float admin-dash-section-card"
          aria-labelledby="dash-listings-heading"
        >
          <div class="admin-dash-section__head">
            <h2 id="dash-listings-heading" class="admin-dash-section__title">Active listings</h2>
            <div class="admin-dash-section__head-end">
              <span class="admin-dash-section__count">{{ stats.active_listings_count }}</span>
              <router-link to="/admin/listings" class="admin-dash-section__link">View all</router-link>
            </div>
          </div>

          <p v-if="!stats.active_listings.length" class="admin-dash-section-card__empty">
            No active listings.
          </p>
          <ul v-else class="admin-dash-stack">
            <li v-for="item in stats.active_listings" :key="item._id">
              <article class="admin-dash-row">
                <div class="admin-dash-list__thumb" aria-hidden="true">
                  <img
                    v-if="item.image_url"
                    :src="item.image_url"
                    :alt="item.title"
                    width="40"
                    height="40"
                    loading="lazy"
                  />
                  <span v-else class="admin-dash-list__thumb-placeholder">—</span>
                </div>
                <div class="admin-dash-list__main">
                  <p class="admin-dash-list__title">{{ item.title }}</p>
                  <p class="admin-dash-list__meta">
                    ${{ formatPrice(item.price_cents) }} · {{ item.quantity_available }} in stock
                  </p>
                </div>
                <span class="admin-status-pill admin-status-pill--active">Active</span>
              </article>
            </li>
          </ul>
        </section>

        <section
          class="admin-float admin-dash-section-card"
          aria-labelledby="dash-orders-heading"
        >
          <div class="admin-dash-section__head">
            <h2 id="dash-orders-heading" class="admin-dash-section__title">Recent orders</h2>
            <div class="admin-dash-section__head-end">
              <span class="admin-dash-section__count">
                {{ stats.recent_orders_count }}
              </span>
              <router-link to="/admin/orders" class="admin-dash-section__link">View all</router-link>
            </div>
          </div>

          <p v-if="!stats.recent_orders.length" class="admin-dash-section-card__empty">
            No new orders right now.
          </p>
          <ul v-else class="admin-dash-stack">
            <li v-for="order in stats.recent_orders" :key="order._id">
              <article class="admin-dash-row">
                <div class="admin-dash-list__main admin-dash-order">
                  <div class="admin-dash-order__top">
                    <span class="admin-dash-order__id">{{ order.order_number }}</span>
                    <span class="admin-dash-order__amount">
                      {{ formatAmount(order.total_cents, order.currency) }}
                    </span>
                  </div>
                  <p class="admin-dash-order__sub">{{ order.customer_display }} · {{ order.product_summary }}</p>
                  <p class="admin-dash-order__date">{{ formatOrderDate(order.created_at) }}</p>
                </div>
                <span class="admin-status-pill admin-status-pill--new">New Order</span>
              </article>
            </li>
          </ul>
        </section>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { getAdminDashboard } from '../../services/api.js';
import { formatUsdFromCents } from '../../utils/storefrontProduct.js';

const loading = ref(true);
const error = ref('');
const stats = ref({
  total_earned_cents: 0,
  currency: 'usd',
  active_listings: [],
  active_listings_count: 0,
  recent_orders: [],
  recent_orders_count: 0
});

function formatPrice(cents) {
  return formatUsdFromCents(cents);
}

function formatAmount(cents, currency) {
    const code = (currency || 'usd').toUpperCase();
    const amount = `$${formatUsdFromCents(cents)}`;
    return code === 'USD' ? amount : `${amount} ${code}`;
}

function formatOrderDate(value) {
    if (!value) {
        return '—';
    }
    try {
        return new Intl.DateTimeFormat('en-GB', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        }).format(new Date(value));
    } catch {
        return String(value);
    }
}

async function load() {
    loading.value = true;
    error.value = '';
    try {
        const data = await getAdminDashboard();
        stats.value = {
            total_earned_cents: data.total_earned_cents ?? 0,
            currency: data.currency || 'usd',
            active_listings: Array.isArray(data.active_listings) ? data.active_listings : [],
            active_listings_count: data.active_listings_count ?? 0,
            recent_orders: Array.isArray(data.recent_orders) ? data.recent_orders : [],
            recent_orders_count: data.recent_orders_count ?? 0
        };
    } catch (e) {
        error.value = e.message || 'Failed to load dashboard';
    } finally {
        loading.value = false;
    }
}

onMounted(load);
</script>
