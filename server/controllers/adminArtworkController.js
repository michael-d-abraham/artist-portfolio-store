const { Artwork } = require('../db');
const { slugify } = require('../utils/slugify');
const {
    isValidObjectId,
    validateCreateBody,
    validateUpdateBody
} = require('../utils/artworkValidation');

function isDuplicateKeyError(err) {
    return err && err.code === 11000;
}

function validationErrorResponse(res, messageOrResult) {
    if (messageOrResult && messageOrResult.errors) {
        return res.status(400).json({ errors: messageOrResult.errors });
    }
    return res.status(400).json({ error: typeof messageOrResult === 'string' ? messageOrResult : 'Validation failed' });
}

/**
 * @param {*} value
 * @returns {{ ok: true, value: number|null|undefined } | { ok: false, error: string }}
 */
function parseYearCreated(value) {
    if (value === undefined) {
        return { ok: true, value: undefined };
    }
    if (value === null) {
        return { ok: true, value: null };
    }
    if (typeof value !== 'number' || !Number.isInteger(value)) {
        return { ok: false, error: 'year_created must be an integer or null' };
    }
    return { ok: true, value };
}

const listAdminArtworks = async (req, res) => {
    try {
        const artworks = await Artwork.find({ deleted_at: null }).sort({ created_at: -1 });
        res.json(artworks);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const getAdminArtworkById = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid artwork id' });
        }
        const artwork = await Artwork.findOne({ _id: id, deleted_at: null });
        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' });
        }
        res.json(artwork);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const createAdminArtwork = async (req, res) => {
    try {
        const body = req.body;
        const createErr = validateCreateBody(body);
        if (createErr) {
            return validationErrorResponse(res, createErr);
        }

        const yearParsed = parseYearCreated(body.year_created);
        if (!yearParsed.ok) {
            return res.status(400).json({ error: yearParsed.error });
        }

        const slug = slugify(body.title);

        if (!slug) {
            return res.status(400).json({ error: 'slug could not be generated from title' });
        }

        const slugTaken = await Artwork.exists({ slug });
        if (slugTaken) {
            return res.status(400).json({ error: 'Slug already exists' });
        }

        const doc = {
            title: String(body.title).trim(),
            slug,
            description: String(body.description).trim(),
            is_active: body.is_active,
            deleted_at: null
        };

        if (yearParsed.value !== undefined) {
            doc.year_created = yearParsed.value;
        }

        const artwork = await Artwork.create(doc);
        res.status(201).json(artwork);
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return res.status(400).json({ error: 'Slug already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const updateAdminArtwork = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid artwork id' });
        }

        const body = req.body;
        const updateErr = validateUpdateBody(body);
        if (updateErr) {
            return validationErrorResponse(res, updateErr);
        }

        const artwork = await Artwork.findOne({ _id: id, deleted_at: null });
        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' });
        }

        if (body.title !== undefined) {
            const nextTitle = String(body.title).trim();
            const nextSlug = slugify(nextTitle);
            if (!nextSlug) {
                return res.status(400).json({ error: 'slug could not be generated from title' });
            }
            if (nextSlug !== artwork.slug) {
                const taken = await Artwork.exists({ slug: nextSlug, _id: { $ne: artwork._id } });
                if (taken) {
                    return res.status(400).json({ error: 'Slug already exists' });
                }
                artwork.slug = nextSlug;
            }
            artwork.title = nextTitle;
        }
        if (body.description !== undefined) {
            artwork.description = String(body.description).trim();
        }
        if (body.is_active !== undefined) {
            artwork.is_active = body.is_active;
        }
        if (body.year_created !== undefined) {
            const yearParsed = parseYearCreated(body.year_created);
            if (!yearParsed.ok) {
                return res.status(400).json({ error: yearParsed.error });
            }
            artwork.year_created = yearParsed.value;
        }

        await artwork.save();
        res.json(artwork);
    } catch (err) {
        if (isDuplicateKeyError(err)) {
            return res.status(400).json({ error: 'Slug already exists' });
        }
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const softDeleteAdminArtwork = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid artwork id' });
        }

        const artwork = await Artwork.findOneAndUpdate(
            { _id: id, deleted_at: null },
            { deleted_at: new Date() },
            { new: true }
        );

        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' });
        }

        res.json(artwork);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

const toggleAdminArtworkActive = async (req, res) => {
    try {
        const { id } = req.params;
        if (!isValidObjectId(id)) {
            return res.status(400).json({ error: 'Invalid artwork id' });
        }

        const artwork = await Artwork.findOne({ _id: id, deleted_at: null });
        if (!artwork) {
            return res.status(404).json({ error: 'Artwork not found' });
        }

        artwork.is_active = !artwork.is_active;
        await artwork.save();
        res.json(artwork);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    listAdminArtworks,
    getAdminArtworkById,
    createAdminArtwork,
    updateAdminArtwork,
    softDeleteAdminArtwork,
    toggleAdminArtworkActive
};
