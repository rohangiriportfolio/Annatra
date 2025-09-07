const mongoose = require('mongoose');
const db = process.env.MONGODB_URI;

mongoose.connect(db, { serverSelectionTimeoutMS: 30000 })
  .then(() => console.log("MongoDB Connected"))
  .catch(err => {
    console.error("MongoDB connection error:", err);
  });
