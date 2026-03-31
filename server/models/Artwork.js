const mongoose = require('mongoose');

const artworkSchema = new mongoose.Schema({
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    year_created: { type: Number, default: null },
    is_active: { type: Boolean, required: true, default: true },
    deleted_at: { type: Date, default: null }
}, {
    timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' },
    collection: 'artworks'
});

module.exports = mongoose.models.Artwork || mongoose.model('Artwork', artworkSchema);
