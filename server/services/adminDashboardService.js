const { Product, Order, OrderItem } = require('../db');
const { applyProductRelations } = require('../utils/productPopulate');
const { primaryProductImageUrl } = require('../utils/productDisplay');
const {
    toAdminOrderRow,
    resolveOrderTotalCents,
    resolveOrderCurrency
} = require('./adminOrdersService');

const RECENT_NEW_ORDERS_LIMIT = 8;

function mapActiveListing(product) {
    return {
        _id: String(product._id),
        title: product.title || 'Untitled',
        price_cents: product.price_cents ?? 0,
        quantity_available: product.quantity_available ?? 0,
        image_url: primaryProductImageUrl(product)
    };
}

async function getAdminDashboard() {
    const [activeProducts, newOrderDocs, completedOrderDocs] = await Promise.all([
        applyProductRelations(
            Product.find({ deleted_at: null, is_active: true }).sort({ created_at: -1 })
        ).exec(),
        Order.find({
            payment_status: 'paid',
            status: 'paid',
            fulfillment_status: 'new_order'
        })
            .sort({ created_at: -1 })
            .limit(RECENT_NEW_ORDERS_LIMIT)
            .lean(),
        Order.find({
            payment_status: 'paid',
            status: 'paid',
            fulfillment_status: 'completed'
        }).lean()
    ]);

    let totalEarnedCents = 0;
    let currency = 'usd';
    for (const order of completedOrderDocs) {
        totalEarnedCents += resolveOrderTotalCents(order);
        currency = resolveOrderCurrency(order);
    }

    const activeListings = activeProducts.map(mapActiveListing);

    let recentOrders = [];
    if (newOrderDocs.length) {
        const orderIds = newOrderDocs.map((o) => o._id);
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

        recentOrders = newOrderDocs.map((order) =>
            toAdminOrderRow(order, itemsByOrder.get(String(order._id)) || [])
        );
    }

    return {
        total_earned_cents: totalEarnedCents,
        currency,
        active_listings: activeListings,
        active_listings_count: activeListings.length,
        recent_orders: recentOrders,
        recent_orders_count: recentOrders.length
    };
}

module.exports = { getAdminDashboard };
