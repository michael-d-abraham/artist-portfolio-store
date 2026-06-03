/**
 * Default populate paths for Product queries.
 */
const PRODUCT_POPULATE_PATHS = ['product_images'];

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
