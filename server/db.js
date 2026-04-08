const path = require('path');
const mongoose = require('mongoose');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

mongoose
    .connect(process.env.MONGO_STRING, {
        dbName: process.env.DB_NAME
    })
    .then(() => {
        console.log('Connected to MongoDB');
    })
    .catch((err) => {
        console.error('MongoDB connection error:', err);
    });

const Artwork = require('./models/Artwork');
const ProductType = require('./models/ProductType');
const Product = require('./models/Product');
const ProductImage = require('./models/ProductImage');
const AdminUser = require('./models/AdminUser');

module.exports = {
    Artwork,
    ProductType,
    Product,
    ProductImage,
    AdminUser
};
