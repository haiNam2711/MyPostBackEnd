const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  orderID: { type: Number, required: true, unique: true },
  senderName: { type: String, required: true },
  senderPhone: { type: String, required: true },
  senderAddress: { type: String, required: true },
  recipientName: { type: String, required: true },
  recipientPhone: { type: String, required: true },
  recipientAddress: { type: String, required: true },
  senderPostOfficeId: { type: Number, required: true },
  recipientPostOfficeId: { type: Number, required: true },
  processTime: { type: [Date], default: [] },
  timeSuccess: { type: Date, default: null },
  deliveryEmployeeId: { type: Number, required: false }, // ID nhân viên giao dịch đã nhận hàng của khách
  createdAt: { type: Date, default: Date.now },
  kilogram: { type: Number, required: true },
  type: { type: String, required: true },
  value: { type: Number, required: true },
  serviceCharge : { type: Number, required: true },
  quantity: { type: Number, required: true },
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
