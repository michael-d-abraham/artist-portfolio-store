<template>
  <div class="admin-page admin-orders">
    <header class="admin-page-header">
      <h1 class="admin-page-header__title">Orders</h1>
    </header>

    <p v-if="loading" class="admin-page-header__status">Loading…</p>
    <p v-else-if="error" class="error admin-page-header__status">{{ error }}</p>
    <p v-else-if="!orders.length" class="admin-float admin-float--padded admin-page-empty">No orders yet.</p>

    <template v-else>
      <AdminListSortBar
        v-model="sortBy"
        select-id="orders-sort"
        :options="ORDER_SORT_OPTIONS"
      />

      <ul class="admin-mobile-cards" aria-label="Orders">
        <li
          v-for="order in sortedOrders"
          :key="order._id"
          class="admin-mobile-card admin-mobile-card--order"
          :class="{ 'admin-mobile-card--new-order': isNewOrder(order.fulfillment_status) }"
        >
          <span
            v-if="isNewOrder(order.fulfillment_status)"
            class="admin-order-new-dot"
            aria-hidden="true"
          ></span>
          <div class="admin-mobile-card__corner">
            <label :for="'status-' + order._id" class="visually-hidden">Order status</label>
            <select
              :id="'status-' + order._id"
              class="admin-status-select"
              :class="fulfillmentStatusClass(order.fulfillment_status)"
              :value="order.fulfillment_status"
              :disabled="savingId === order._id"
              @change="onStatusChange(order, $event)"
            >
              <option v-for="opt in statusOptions" :key="opt.value" :value="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>
          <h3 class="admin-mobile-card__title">{{ order.product_summary }}</h3>
          <p class="admin-mobile-card__order-id">{{ order.order_number }}</p>
          <dl class="admin-mobile-card__meta">
            <div class="admin-mobile-card__row">
              <dt>Customer</dt>
              <dd>{{ order.customer_display }}</dd>
            </div>
            <div class="admin-mobile-card__row">
              <dt>Date</dt>
              <dd>{{ formatOrderDate(order.created_at) }}</dd>
            </div>
            <div class="admin-mobile-card__row">
              <dt>Amount</dt>
              <dd>{{ formatAmount(order.total_cents, order.currency) }}</dd>
            </div>
          </dl>
        </li>
      </ul>

      <div class="admin-float admin-float--table admin-float--desktop-only">
      <div class="admin-panel__table-wrap admin-panel__table-wrap--desktop">
        <table class="admin-data-table">
          <thead>
            <tr>
              <th>Order</th>
              <th>Product</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Price</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="order in sortedOrders" :key="'row-' + order._id">
              <td class="admin-data-table__cell--strong admin-data-table__cell--nowrap admin-data-table__cell--order-id">
                <span
                  v-if="isNewOrder(order.fulfillment_status)"
                  class="admin-order-new-dot"
                  aria-hidden="true"
                ></span>
                {{ order.order_number }}
              </td>
              <td>{{ order.product_summary }}</td>
              <td>{{ order.customer_display }}</td>
              <td class="admin-data-table__cell--nowrap">{{ formatOrderDate(order.created_at) }}</td>
              <td class="admin-data-table__cell--nowrap">{{ formatAmount(order.total_cents, order.currency) }}</td>
              <td>
                <label :for="'status-desktop-' + order._id" class="visually-hidden">Order status</label>
                <select
                  :id="'status-desktop-' + order._id"
                  class="admin-status-select"
                  :class="fulfillmentStatusClass(order.fulfillment_status)"
                  :value="order.fulfillment_status"
                  :disabled="savingId === order._id"
                  @change="onStatusChange(order, $event)"
                >
                  <option
                    v-for="opt in statusOptions"
                    :key="'d-' + opt.value"
                    :value="opt.value"
                  >
                    {{ opt.label }}
                  </option>
                </select>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue';
import { getAdminOrders, updateAdminOrderFulfillmentStatus } from '../../services/api.js';
import { formatMoneyFromCents } from '../../utils/money.js';
import {
    FULFILLMENT_STATUS_OPTIONS,
    fulfillmentStatusClass,
    isNewOrder
} from '../../utils/orderFulfillmentStatus.js';
import { ORDER_SORT_OPTIONS, sortOrders } from '../../utils/adminListSort.js';
import AdminListSortBar from '../../components/admin/AdminListSortBar.vue';

const statusOptions = FULFILLMENT_STATUS_OPTIONS;
const orders = ref([]);
const sortBy = ref('newest');
const loading = ref(true);
const error = ref('');
const savingId = ref(null);

const sortedOrders = computed(() => sortOrders(orders.value, sortBy.value));

function formatAmount(cents, currency) {
    return formatMoneyFromCents(cents, currency || 'usd');
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
        const data = await getAdminOrders();
        orders.value = Array.isArray(data.orders) ? data.orders : [];
    } catch (e) {
        error.value = e.message || 'Failed to load orders';
    } finally {
        loading.value = false;
    }
}

async function onStatusChange(order, event) {
    const next = event.target.value;
    if (!next || next === order.fulfillment_status) {
        return;
    }
    const previous = order.fulfillment_status;
    order.fulfillment_status = next;
    savingId.value = order._id;
    try {
        const data = await updateAdminOrderFulfillmentStatus(order._id, next);
        if (data.order) {
            const idx = orders.value.findIndex((o) => o._id === order._id);
            if (idx !== -1) {
                orders.value[idx] = data.order;
            }
        }
    } catch (e) {
        order.fulfillment_status = previous;
        event.target.value = previous;
        alert(e.message || 'Could not update status');
    } finally {
        savingId.value = null;
    }
}

onMounted(load);
</script>
