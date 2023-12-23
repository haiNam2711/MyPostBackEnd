const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  userID: { type: Number, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
  email: { type: String },
  birthdate: { type: Date },
  role: {
    type: String,
    enum: ['boss', 'officeStaff', 'officeManager', 'warehouseStaff', 'warehouseManager'],
    required: true,
  },
  postOfficeID: { type: Number }, // Sử dụng khi role là 'officeStaff' hoặc 'officeManager'
  warehouseID: { type: Number }, // Sử dụng khi role là 'warehouseStaff' hoặc 'warehouseManager'
});

module.exports =  mongoose.model('User', userSchema);
