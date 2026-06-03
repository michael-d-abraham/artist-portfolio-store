const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { connectDb, disconnectDb, Product, ProductImage, Order, OrderItem } = require('../../server/db');

let memoryServer;

async function startTestDatabase() {
    memoryServer = await MongoMemoryServer.create();
    await connectDb(memoryServer.getUri(), 'artist_portfolio_test');
}

async function stopTestDatabase() {
    await disconnectDb();
    if (memoryServer) {
        await memoryServer.stop();
        memoryServer = null;
    }
}

async function clearDatabase() {
    await Promise.all([
        Product.deleteMany({}),
        ProductImage.deleteMany({}),
        Order.deleteMany({}),
        OrderItem.deleteMany({})
    ]);
}

async function getProductStock(productId) {
    const doc = await Product.findById(productId).lean();
    return doc ? doc.quantity_available : null;
}

module.exports = {
    startTestDatabase,
    stopTestDatabase,
    clearDatabase,
    getProductStock,
    mongoose
};
