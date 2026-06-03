const mongoose = require('mongoose');

function isValidObjectId(id) {
    return mongoose.isValidObjectId(id);
}

module.exports = {
    isValidObjectId
};
