const mongoose = require('mongoose');
const DB = process.env.MONGODB_URI;

mongoose.connect(DB)
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });
