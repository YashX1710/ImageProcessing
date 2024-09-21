const mongoose = require('mongoose');

const ProductSchema = new mongoose.Schema({
  serialNumber: Number,
  productName: String,
  inputUrls: [String],
  outputUrls: [String],
  requestId: String,
});

const RequestSchema = new mongoose.Schema({
  requestId: String,
  status: String,
});

const Product = mongoose.model('Product', ProductSchema);
const Request = mongoose.model('Request', RequestSchema);

module.exports = { Product, Request };
