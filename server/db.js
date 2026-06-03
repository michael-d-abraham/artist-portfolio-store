const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

async function connectDb(uri, dbName) {
    const connectionUri = uri || process.env.MONGO_STRING;
    const name = dbName || process.env.DB_NAME;
    if (!connectionUri) {
        throw new Error('MONGO_STRING is not configured');
    }
    await mongoose.connect(connectionUri, { dbName: name });
    return mongoose.connection;
}

async function disconnectDb() {
    await mongoose.disconnect();
}

if (process.env.NODE_ENV !== 'test' && !process.env.SKIP_DB_AUTO_CONNECT) {
    connectDb()
        .then(() => {
            console.log('Connected to MongoDB');
        })
        .catch((err) => {
            console.error('MongoDB connection error:', err);
        });
}

const Product = require('./models/Product');
const ProductImage = require('./models/ProductImage');
const Order = require('./models/Order');
const OrderItem = require('./models/OrderItem');
const AdminUser = require('./models/AdminUser');
const SiteSettings = require('./models/SiteSettings');

module.exports = {
    Product,
    ProductImage,
    Order,
    OrderItem,
    AdminUser,
    SiteSettings,
    connectDb,
    disconnectDb
};
