require('dotenv').config();
const mongoose = require('mongoose');

const DB = process.env.MONGODB_URI;
// const DB = 'mongodb://127.0.0.1:27017/vendorDealer';


const options = {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverSelectionTimeoutMS: 5000, // Adjust timeout as needed
};

mongoose.connect(DB, options)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });
