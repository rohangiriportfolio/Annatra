const mongoose = require('mongoose');

const vendorOrderSchema = new mongoose.Schema({
  vendorName: String, 
  vendorEmail: String,
  vendorId: String,
  orderId: String,
  items: [
    {
      item: String,
      price: Number,
      quantity: Number
    }
  ],
  totalAmount: Number,
  orderCompleted: Boolean,
  orderApprovedAt: String,
  orderUpdatedAt: String,
}, { timestamps: true } );

const productSchema = new mongoose.Schema({
  name: String,
  price: Number,
  priceUnit: String,
  quantity: Number,
  quantityUnit: String,
  description: String,
  image: {
    data: Buffer,
    contentType: String,
    fileName: String,
  },
}, { timestamps: true } );

const dealerSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: {
    type: String,
    default: 'dealer'
  },
  profileImage: {
    data: Buffer,
    contentType: String,
  },
  location: {
    lat: String,
    lon: String
  },
  radius: String,
  buyLimit: String,
  vendorOrders: [vendorOrderSchema], // group of orders from vendors
  products: [productSchema]
});

module.exports = mongoose.model('Dealer', dealerSchema);
