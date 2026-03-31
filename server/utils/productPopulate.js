/**
 * Default populate paths for Product queries (refs + reverse refs via schema virtuals).
 * Used by public catalog routes and admin product list/detail/update responses.
 */
const PRODUCT_POPULATE_PATHS = ['artwork_id', 'product_type_id', 'product_images'];

/**
 * @param {import('mongoose').Query} query Product find/findOne/etc. query
 * @returns {import('mongoose').Query}
 */
function applyProductRelations(query) {
    return query.populate(PRODUCT_POPULATE_PATHS);
}

module.exports = {
    PRODUCT_POPULATE_PATHS,
    applyProductRelations
};
