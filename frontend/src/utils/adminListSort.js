/** Milliseconds since epoch for sorting; missing/invalid dates sort last when descending. */
export function dateMs(value) {
  if (!value) return 0;
  const t = new Date(value).getTime();
  return Number.isFinite(t) ? t : 0;
}

/** Fulfillment workflow order for admin status sort. */
export const FULFILLMENT_STATUS_SORT_RANK = {
  new_order: 0,
  shipped: 1,
  completed: 2,
  cancelled: 3
};

export const ORDER_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'status', label: 'Status' }
];

export const LISTING_SORT_OPTIONS = [
  { value: 'newest', label: 'Newest first' },
  { value: 'oldest', label: 'Oldest first' },
  { value: 'status', label: 'Status (active first)' }
];

/**
 * @param {Array<{ created_at?: string, fulfillment_status?: string }>} orders
 * @param {'newest' | 'oldest' | 'status'} mode
 */
export function sortOrders(orders, mode) {
  const list = [...orders];
  if (mode === 'oldest') {
    return list.sort((a, b) => dateMs(a.created_at) - dateMs(b.created_at));
  }
  if (mode === 'status') {
    return list.sort((a, b) => {
      const ra = FULFILLMENT_STATUS_SORT_RANK[a.fulfillment_status] ?? 99;
      const rb = FULFILLMENT_STATUS_SORT_RANK[b.fulfillment_status] ?? 99;
      if (ra !== rb) return ra - rb;
      return dateMs(b.created_at) - dateMs(a.created_at);
    });
  }
  return list.sort((a, b) => dateMs(b.created_at) - dateMs(a.created_at));
}

/**
 * @param {Array<{ created_at?: string, is_active?: boolean }>} products
 * @param {'newest' | 'oldest' | 'status'} mode
 */
export function sortProducts(products, mode) {
  const list = [...products];
  if (mode === 'oldest') {
    return list.sort((a, b) => dateMs(a.created_at) - dateMs(b.created_at));
  }
  if (mode === 'status') {
    return list.sort((a, b) => {
      const aActive = Boolean(a.is_active);
      const bActive = Boolean(b.is_active);
      if (aActive !== bActive) return aActive ? -1 : 1;
      return dateMs(b.created_at) - dateMs(a.created_at);
    });
  }
  return list.sort((a, b) => dateMs(b.created_at) - dateMs(a.created_at));
}
