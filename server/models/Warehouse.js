const mongoose = require('mongoose');

const warehouseSchema = new mongoose.Schema({
  warehouseID: { type: Number, required: true, unique: true },
  address: { type: String, required: true },
  province: { type: String, required: true, unique: true },
});

module.exports = mongoose.model('Warehouse', warehouseSchema)

