const mongoose = require('mongoose');

const orderSchema = new mongoose.Schema({
  dealer: String,
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
}, { timestamps: true });


const cartItemSchema = new mongoose.Schema({
  item: String,
  price: Number,
  quantity: Number,
  image: String // Optional: base64 or image URL
});

const userSchema = new mongoose.Schema({
  name: String,
  email: String,
  password: String,
  phone: String,
  role: String,
  profileImage: {
    data: Buffer,
    contentType: String
  },
  location: {
    lat: String,
    lon: String,
  },
  cluster: String,
  orders: [orderSchema], // Previous orders
  cart: [cartItemSchema], // New cart field
  currentDealer: String,
  nearbyDealer: [String],
});

module.exports = mongoose.model('User', userSchema);

