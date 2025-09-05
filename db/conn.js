const mongoose = require("mongoose");

const DB = 'mongodb://127.0.0.1:27017/vendorDealer';


mongoose.connect(DB).then(()=>console.log("database connected")).catch((err)=>console.log("errr",err))