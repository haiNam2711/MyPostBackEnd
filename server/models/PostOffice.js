const mongoose = require('mongoose');

const poSchema = new mongoose.Schema({
  postOfficeID: { type: Number, required: true, unique: true },
  district: { type: String, required: true, unique: true },
  belongToWarehouseID: { type: Number, required: true },
});

const PostOffice = mongoose.model('PostOffice', poSchema);

module.exports = PostOffice;
 