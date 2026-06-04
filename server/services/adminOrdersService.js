const { Order, OrderItem } = require('../db');
const { isValidObjectId } = require('../utils/objectIdValidation');
const {
    FULFILLMENT_STATUSES,
    isValidFulfillmentStatus
} = require('../utils/orderFulfillmentStatus');

function itemDisplayName(item) {
    if (item.stripe_description && String(item.stripe_description).trim()) {
        return String(item.stripe_description).trim();
    }
    if (item.product_title && String(item.product_title).trim()) {
        return String(item.product_title).trim();
    }
    return 'Item';
}

function formatProductSummary(items) {
    if (!items.length) {
        return '—';
    }
    const titles = items.map((row) => itemDisplayName(row)).filter((t) => t !== 'Item' || items.length === 1);
    if (!titles.length) {
        return '—';
    }
    if (titles.length === 1) {
        return titles[0];
    }
    if (titles.length === 2) {
        return `${titles[0]}, ${titles[1]}`;
    }
    return `${titles[0]} +${titles.length - 1} more`;
}

function resolveCustomerDisplay(order) {
    const snap = order.stripe_snapshot;
    const name =
        (snap?.customer_name && String(snap.customer_name).trim()) ||
        (order.customer_name && String(order.customer_name).trim()) ||
        (snap?.shipping_name && String(snap.shipping_name).trim()) ||
        '';
    if (name) {
        return name;
    }
    const email =
        (snap?.customer_email && String(snap.customer_email).trim()) ||
        (order.customer_email && String(order.customer_email).trim()) ||
        '';
    return email || '—';
}

function resolveOrderTotalCents(order) {
    const snap = order.stripe_snapshot;
    if (snap && typeof snap.amount_total_cents === 'number' && snap.amount_total_cents > 0) {
        return snap.amount_total_cents;
    }
    return order.total_cents;
}

function resolveOrderCurrency(order) {
    return (order.stripe_snapshot?.currency || order.currency || 'usd').toLowerCase();
}

function toAdminOrderRow(order, items) {
    const customer = resolveCustomerDisplay(order);

    return {
        _id: String(order._id),
        order_number: order.order_number,
        customer_name: order.customer_name || null,
        customer_email: order.customer_email || null,
        customer_display: customer,
        created_at: order.stripe_snapshot?.recorded_at || order.created_at,
        total_cents: resolveOrderTotalCents(order),
        currency: resolveOrderCurrency(order),
        fulfillment_status: order.fulfillment_status || 'new_order',
        product_summary: formatProductSummary(items)
    };
}

async function listPaidOrdersForAdmin() {
    const orders = await Order.find({
        payment_status: 'paid',
        status: 'paid'
    })
        .sort({ created_at: -1 })
        .lean();

    if (!orders.length) {
        return [];
    }

    const orderIds = orders.map((o) => o._id);
    const allItems = await OrderItem.find({ order_id: { $in: orderIds } })
        .sort({ created_at: 1 })
        .lean();

    const itemsByOrder = new Map();
    for (const item of allItems) {
        const key = String(item.order_id);
        if (!itemsByOrder.has(key)) {
            itemsByOrder.set(key, []);
        }
        itemsByOrder.get(key).push(item);
    }

    return orders.map((order) =>
        toAdminOrderRow(order, itemsByOrder.get(String(order._id)) || [])
    );
}

async function updateOrderFulfillmentStatus(orderId, fulfillmentStatus) {
    if (!isValidObjectId(orderId)) {
        return { ok: false, status: 400, error: 'Invalid order id' };
    }
    if (!isValidFulfillmentStatus(fulfillmentStatus)) {
        return {
            ok: false,
            status: 400,
            error: `fulfillment_status must be one of: ${FULFILLMENT_STATUSES.join(', ')}`
        };
    }

    const order = await Order.findOneAndUpdate(
        {
            _id: orderId,
            payment_status: 'paid',
            status: 'paid'
        },
        { $set: { fulfillment_status: fulfillmentStatus } },
        { new: true }
    ).lean();

    if (!order) {
        return { ok: false, status: 404, error: 'Order not found' };
    }

    const items = await OrderItem.find({ order_id: order._id }).sort({ created_at: 1 }).lean();
    return { ok: true, order: toAdminOrderRow(order, items) };
}

module.exports = {
    listPaidOrdersForAdmin,
    updateOrderFulfillmentStatus,
    FULFILLMENT_STATUSES,
    toAdminOrderRow,
    resolveOrderTotalCents,
    resolveOrderCurrency
};
