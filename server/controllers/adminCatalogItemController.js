const { createCatalogItem } = require('../services/catalogItemService');

const createAdminCatalogItem = async (req, res) => {
    try {
        const result = await createCatalogItem(req.body);
        if (!result.ok) {
            if (result.errors) {
                return res.status(result.status).json({ errors: result.errors });
            }
            return res.status(result.status).json({ error: result.error || 'Request failed' });
        }
        return res.status(result.status).json(result.data);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ error: 'Server error' });
    }
};

module.exports = {
    createAdminCatalogItem
};
