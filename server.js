require('dotenv').config();
require("./db/conn.js");
const express = require('express');
const app = express();
const PORT = process.env.PORT || 5000;
const path = require('path');
const userdb = require("./model/user");
const dealerdb = require("./model/dealer");
const encrypt = require("./hash/encrypt.js");
const decrypt = require("./hash/decrypt.js");
const jwtToken = require('jsonwebtoken');
const validateCookie = require('./middleWares/jwtMiddle.js');
const cookieParser = require('cookie-parser');
const upload = require('./middleWares/multer');
const session = require('express-session');
const mongoose = require('mongoose');

app.use(express.json());       // for parsing json
app.use(express.urlencoded({ extended: true }));       // Converts URL-encoded form data (like key=value) into JavaScript objects, available on req.body


app.set('view engine', 'ejs');      // for rendering ejs
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
// app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

app.use(cookieParser());       // for user login verification
app.use(validateCookie("token"));      // for user login verification


app.use(session({      // Not for user login verification, but only for storing success/error messages
  secret: process.env.SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: false,
  },
  name: 'message',
}));


app.post("/login", async (req, res) => {
  try {
    const { email, password, role } = req.body;
    // console.log("Received data:", req.body);

    let user;
    if (role === 'vendor') {
      user = await userdb.findOne({ email });
      if (!user) {
        req.session.error = "User not found or incorrect email/role.";
        return res.status(401).redirect('/');
      }
      const passwordMatch = await decrypt(password, user.password);
      if (!passwordMatch) {
        req.session.error = "Incorrect password.";
        return res.status(401).redirect('/');
      }
      const profile = {
        name: user.name,
        email: user.email,
        role: user.role,
        currentDealer: user.currentDealer,
      };
      const token = jwtToken.sign(profile, "JaiShreeRam");
      if (user.profileImage?.data) {
        imageBase64 = `data:${user.profileImage.contentType};base64,${user.profileImage.data.toString('base64')}`;
      }
      res.cookie("token", token);
      req.session.success = "Successfully logged in as Vendor !!!";
      return res.status(200).redirect('/');
    } else {
      user = await dealerdb.findOne({ email });
      if (!user) {
        req.session.error = "User not found or incorrect email/role.";
        return res.status(401).redirect('/');
      }
      const passwordMatch = await decrypt(password, user.password);
      if (!passwordMatch) {
        req.session.error = "Incorrect password.";
        return res.status(401).redirect('/');
      }
      const profile = {
        name: user.name,
        email: user.email,
        role: user.role,
      };
      const token = jwtToken.sign(profile, process.env.TOKEN_SECRET);
      res.cookie("token", token);
      req.session.success = "Successfully logged in as Dealer !!!";
      return res.status(200).redirect('/');
    }
  } catch (error) {
    console.error("Login error:", error);
    // return res.status(500).json({ success: false, message: "Internal Server Error" });
    req.session.error = "Internal Server Error.";
    return res.status(500).redirect('/');
  }
});


app.post("/register", upload.single('profileImage'), async (req, res) => {
  try {
    const { name, email, password, phone, role } = req.body;

    const hashedPassword = await encrypt(password);
    if (role === 'vendor') {
      const newUser = new userdb({
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        profileImage: {
          data: req.file.buffer,
          contentType: req.file.mimetype,
        }
      });

      await newUser.save();
      req.session.success = "Successfully Registered as Vendor !!!";
      return res.status(200).redirect('/');
    }
    else {
      const newUser = new dealerdb({
        name,
        email,
        password: hashedPassword,
        phone,
        role,
        profileImage: {
          data: req.file.buffer,
          contentType: req.file.mimetype
        }
      });

      await newUser.save();
      req.session.success = "Successfully Registered as Dealer !!!";
      return res.status(200).redirect('/');
    }
  } catch (err) {
    console.log("Register error:", err);
    req.session.error = "Internal Server Error.";
    return res.status(500).redirect('/');
  }

});


app.get('/', async (req, res) => {
  try {
    let imageBase64 = null;
    let user = null;

    if (req.user && req.user.email) {
      if (req.user.role == 'vendor') {
        user = await userdb.findOne({ email: req.user.email });
      }
      else {
        user = await dealerdb.findOne({ email: req.user.email });
      }

      if (!user) {
        return res.status(404).send("User not found");
      }

      if (user.profileImage?.data) {
        imageBase64 = `data:${user.profileImage.contentType};base64,${user.profileImage.data.toString('base64')}`;
      }
    }
    const successMsg = req.session?.success;
    delete req.session?.success;
    const errorMsg = req.session?.error;
    delete req.session?.error;

    res.render('vendor-dashboard', {
      user: user
        ? {
          name: user.name,
          location: `${user.location?.lat}, ${user.location?.lon}` || 'Location Not Set!',
          profileImage: imageBase64,
          role: user.role,
          activePage: user.role == 'vendor' ? 'vendor-dashboard' : 'dealer-dashboard',
        }
        : null, success: successMsg, error: errorMsg,
    });
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to load profile");
  }
});

app.get('/dealer-products', async (req, res) => {
  try {
    const currentUser = await userdb.findOne({ email: req.user.email });
    if (!currentUser) {
      return res.status(404).send("User not found");
    }

    let userImage = null;
    if (currentUser.profileImage?.data) {
      userImage = `data:${currentUser.profileImage.contentType};base64,${currentUser.profileImage.data.toString('base64')}`;
    }

    // Get dealer IDs only from current user's nearbyDealer array
    const nearbyDealerIds = currentUser.nearbyDealer || [];

    if (nearbyDealerIds.length === 0) {
      // No nearby dealers in user data, send message
      return res.render('dealer-products', {
        user: {
          name: currentUser.name,
          location: currentUser.location ? `${currentUser.location.lat}, ${currentUser.location.lon}` : 'Location Not Set!',
          profileImage: userImage,
          role: currentUser.role,
          cart: currentUser.cart,
          currentDealer: currentUser.currentDealer,
          activePage: 'dealer-products'
        },
        dealers: [],
        products: [],
        cartTotal: 0,
        message: "No dealers near you ! Update Your Location."
      });
    }

    // Convert string IDs to ObjectId if necessary
    const objectIdArray = nearbyDealerIds.map(id => new mongoose.Types.ObjectId(id));

    // Query dealerdb for only those dealers
    const filteredDealers = await dealerdb.find(
      { _id: { $in: objectIdArray } },
      { phone: 1, profileImage: 1, name: 1, email: 1 }
    );

    if (filteredDealers.length === 0) {
      // No dealers found for given IDs, send message
      return res.render('dealer-products', {
        user: {
          name: currentUser.name,
          location: currentUser.location ? `${currentUser.location.lat}, ${currentUser.location.lon}` : 'Location Not Set!',
          profileImage: userImage,
          role: currentUser.role,
          cart: currentUser.cart,
          currentDealer: currentUser.currentDealer,
          activePage: 'dealer-products'
        },
        dealers: [],
        products: [],
        cartTotal: 0,
        message: "No dealers near you ! Update Your Location."
      });
    }

    // Decode profile images if present
    filteredDealers.forEach(dealer => {
      if (dealer.profileImage?.data) {
        dealer.decodedImage = `data:${dealer.profileImage.contentType};base64,${dealer.profileImage.data.toString('base64')}`;
      } else {
        dealer.decodedImage = null;
      }
    });

    // Calculate total cart price for current user
    let totalPrice = 0;
    if (currentUser.cart && currentUser.cart.length > 0) {
      totalPrice = currentUser.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    }

    res.render('dealer-products', {
      user: {
        name: currentUser.name,
        location: currentUser.location ? `${currentUser.location.lat}, ${currentUser.location.lon}` : 'Location Not Set!',
        profileImage: userImage,
        role: currentUser.role,
        cart: currentUser.cart,
        currentDealer: currentUser.currentDealer,
        activePage: 'dealer-products'
      },
      dealers: filteredDealers,
      products: [],
      cartTotal: totalPrice,
      message: null
    });

  } catch (error) {
    console.error("Error loading dealer products:", error);
    res.status(500).send("Failed to load dealer products");
  }
});




app.get('/dealer-products/:dealerId', async (req, res) => {
  try {
    const currentUser = await userdb.findOne({ email: req.user.email });

    if (currentUser) {
      currentUser.currentDealer = req.params.dealerId;
      await currentUser.save();
    } else {
      console.log("User not found");
    }

    const dealerId = req.params.dealerId;
    const dealer = await dealerdb.findById(dealerId);
    if (!dealer) {
      return res.status(404).json({ error: 'Dealer not found' });
    }

    let dealerImage = null;
    if (dealer.profileImage?.data) {
      dealerImage = `data:${dealer.profileImage.contentType};base64,${dealer.profileImage.data.toString('base64')}`;
    }

    // Sort products by updatedAt descending (latest first)
    const products = (Array.isArray(dealer.products) ? dealer.products : [])
      .sort((a, b) => {
        const aTime = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
        const bTime = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
        return bTime - aTime;
      })
      .map(product => ({
        name: product.name,
        price: product.price,
        priceUnit: product.priceUnit,
        quantity: product.quantity,
        quantityUnit: product.quantityUnit,
        description: product.description,
        image: product.image?.data
          ? `data:${product.image.contentType};base64,${product.image.data.toString('base64')}`
          : null,
        dealerName: dealer.name,
        dealerEmail: dealer.email,
      }));

    res.json({
      dealerName: dealer.name,
      dealerImage,
      products
    });
  } catch (error) {
    console.error("Error fetching dealer products:", error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



app.get('/view-group', async (req, res) => {
  try {
    const user = await userdb.findOne({ email: req.user.email });

    let imageBase64 = null;
    if (user.profileImage?.data) {
      imageBase64 = `data:${user.profileImage.contentType};base64,${user.profileImage.data.toString('base64')}`;
    }

    const currentDealer = user.currentDealer || null;

    const dealer = await dealerdb.findOne({ _id: currentDealer });

    const dealerAssociatedUsers = await userdb.find({ currentDealer: currentDealer });

    // Map members with calculated amount outside object literal
    const members = dealerAssociatedUsers.map(member => {
      // Calculate amount from cart array
      const amount = (member.cart || []).reduce((total, cartItem) => {
        return total + (cartItem.price * cartItem.quantity);
      }, 0);

      return {
        name: member.name || member.email || 'Unnamed',
        lat: member.location?.lat || '',
        lon: member.location?.lon || '',
        phone: member.phone || 'N/A',
        image: `data:${member.profileImage.contentType};base64,${member.profileImage.data.toString('base64')}` || 'https://randomuser.me/api/portraits/lego/1.jpg',
        amount: amount
      };
    });

    const currentUserAmount = (user.cart || []).reduce((total, cartItem) => {
      return total + (cartItem.price * cartItem.quantity);
    }, 0);

    const totalAmount = members.reduce((sum, m) => sum + m.amount, 0);

    res.render('view-group', {
      user: user ? {
        name: user.name,
        location: `${user.location?.lat}, ${user.location?.lon}` || 'Location Not Set!',
        profileImage: imageBase64,
        role: user.role,
        activePage: 'view-group',
        currentUserAmount,
      } : null,
      members,
      totalAmount,
      buyLimit: dealer.buyLimit,
    });

  } catch (error) {
    // console.error("Error in /view-group:", error);
    req.session.error = "Please select a nearby Dealer to join a Group.";
    return res.status(500).redirect('/');
    // res.status(500).send("Failed to load group");
  }
});


app.post('/add-location', async (req, res) => {
  try {
    const { lat, lon } = req.body;

    let latitude = lat.toString();
    let longitude = lon.toString();

    if (typeof latitude !== 'string' || typeof longitude !== 'string') {
      return res.status(400).json({ error: 'Latitude and longitude must be strings' });
    }

    if (!req.user || !req.user.email) {
      return res.status(401).json({ error: 'Unauthorized: user not logged in' });
    }

    // Find user by role
    let updatedUser;
    if (req.user.role === 'vendor') {
      // Find all dealers (you may want to limit fields to location and radius)
      const allDealers = await dealerdb.find({}, { location: 1, radius: 1 });

      const nearbyDealers = allDealers.filter(dealer => {
        if (!dealer.location?.lat || !dealer.location?.lon || !dealer.radius) {
          return false;
        }

        const dealerLat = Number(dealer.location.lat);
        const dealerLon = Number(dealer.location.lon);
        const userLat = Number(latitude);
        const userLon = Number(longitude);

        if (isNaN(dealerLat) || isNaN(dealerLon) || isNaN(userLat) || isNaN(userLon)) {
          console.log('Invalid lat/lon', dealer, latitude, longitude);
          return false;
        }

        const distance = haversine([dealerLat, dealerLon], [userLat, userLon]);
        console.log(`Distance to dealer ${dealer._id}: ${distance} km, radius: ${dealer.radius}`);

        return distance <= dealer.radius;
      });


      // Collect nearby dealer IDs as strings
      const nearbyDealerIds = nearbyDealers.map(d => d._id.toString());

      // Update user's location and nearbyDealer array
      updatedUser = await userdb.findOneAndUpdate(
        { email: req.user.email },
        {
          $set: {
            'location.lat': latitude,
            'location.lon': longitude,
            nearbyDealer: nearbyDealerIds,
            cart: [],                 // Clears the cart array
            currentDealer: null       // Clears currentDealer field
          }
        },
        { new: true }
      );


    } else {
      // For non-vendor roles update location only
      updatedUser = await dealerdb.findOneAndUpdate(
        { email: req.user.email },
        { $set: { 'location.lat': latitude, 'location.lon': longitude } },
        { new: true }
      );
    }

    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ message: 'Location updated', location: updatedUser.location, nearbyDealers: updatedUser.nearbyDealer });

  } catch (error) {
    console.error('Error updating location:', error);
    res.status(500).json({ error: 'Server error updating location' });
  }
});

app.get('/manual-location', (req, res) => {
  res.render('map', {
    title: 'My Page Title',       // example variable you can access in EJS
    message: 'Hello from Express' // another example variable
  });
});


app.post('/range-save', async (req, res) => {
  try {
    const { limit, radius } = req.body;

    // Find dealer and update radius and buyLimit fields
    const updatedDealer = await dealerdb.findOneAndUpdate(
      { email: req.user.email },
      { radius: radius, buyLimit: limit },
      { new: true }
    );
    if (!updatedDealer) return res.status(404).json({ message: 'Dealer not found' });

    const dealerId = updatedDealer._id;
    const users = await userdb.find({}, { _id: 1, email: 1, location: 1 });
    const locations = [];

    users.forEach(u => {
      if (u.location?.lat && u.location?.lon) {
        const lat = parseFloat(u.location.lat);
        const lon = parseFloat(u.location.lon);
        locations.push({ userId: u._id, coords: [lat, lon] });
      }
    });

    const center = [updatedDealer.location.lat, updatedDealer.location.lon];

    const radiusKm = radius;
    const usersWithinRadius = locations.filter(loc => haversine(center, loc.coords) <= radiusKm);

    // Update each matching user's nearbyDealer array with dealerId
    for (const userLoc of usersWithinRadius) {
      await userdb.updateOne(
        { _id: userLoc.userId },
        { $addToSet: { nearbyDealer: dealerId } } // Add dealerId uniquely to nearbyDealer array
      );
    }
    res.json({ message: 'Range saved successfully!', dealer: updatedDealer });
  } catch (error) {
    console.error('Error saving range:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});


function haversine(coord1, coord2) {
  const R = 6371; // Earth radius in km
  const toRad = angle => angle * (Math.PI / 180);

  const lat1 = toRad(coord1[0]);
  const lon1 = toRad(coord1[1]);
  const lat2 = toRad(coord2[0]);
  const lon2 = toRad(coord2[1]);

  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;

  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLon / 2) ** 2;

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}



app.post('/save-cart', async (req, res) => {
  const { cartItems } = req.body;

  try {
    // Check if the user is authenticated
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    const user = await userdb.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Validate that cartItems is an array of objects
    if (!Array.isArray(cartItems)) {
      return res.status(400).json({ success: false, message: "Invalid cart data" });
    }

    // Save cart to DB
    user.cart = cartItems;
    await user.save();

    return res.status(200).json({ success: true, message: "Cart saved successfully" });

  } catch (error) {
    console.error('Error saving cart:', error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});

app.get('/get-cart', async (req, res) => {
  try {
    // Check if user is authenticated
    if (!req.user || !req.user.email) {
      return res.status(401).json({ success: false, message: "User not authenticated" });
    }

    // Find user by email
    const user = await userdb.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Return the user's saved cart (or empty array if none)
    return res.status(200).json({ success: true, cart: user.cart || [] });

  } catch (error) {
    console.error('Error loading cart:', error);
    return res.status(500).json({ success: false, message: "Internal server error" });
  }
});




app.post('/confirm-order', async (req, res) => {
  try {
    const user = await userdb.findOne({ email: req.user?.email });
    if (!user) {
      console.log("User not found.");
      return res.json({ success: false, message: 'User not found' });
    }
    if (!user.cart || user.cart.length === 0) {
      console.log("Cart is empty.");
      return res.json({ success: false, message: 'Cart is empty' });
    }

    const date = new Date();
    const pad = (num) => num.toString().padStart(2, '0');
    const HH = pad(date.getHours());
    const MM = pad(date.getMinutes());
    const DD = pad(date.getDate());
    const MMth = pad(date.getMonth() + 1);
    const YYYY = date.getFullYear();
    const formatted = `${HH}${MM}-${DD}${MMth}${YYYY}`;

    // Find dealer
    const dealer = await dealerdb.findOne({ _id: user.currentDealer });

    let orderId;
    if (dealer) {
      const incompleteOrderForOtherVendor = dealer.vendorOrders.find(o => o.orderCompleted === false && o.vendorId.toString() !== user._id.toString());
      orderId = incompleteOrderForOtherVendor ? incompleteOrderForOtherVendor.orderId : 'ORD-' + formatted;
    } else {
      orderId = 'ORD-' + formatted;
    }

    const orderData = {
      dealer: user.currentDealer,
      orderId,
      items: user.cart.map(c => ({
        item: c.item,
        price: c.price,
        quantity: c.quantity
      })),
      totalAmount: user.cart.reduce((sum, item) => sum + (item.price * item.quantity), 0),
      orderCompleted: false,
      orderUpdatedAt: new Date()   // Added timestamp here
    };

    // UserDB logic
    const existingUserOrder = user.orders.find(o => o.orderCompleted === false);
    if (existingUserOrder) {
      existingUserOrder.items = orderData.items;
      existingUserOrder.totalAmount = orderData.totalAmount;
      existingUserOrder.orderId = orderId;
      existingUserOrder.orderUpdatedAt = orderData.orderUpdatedAt; // update timestamp
    } else {
      user.orders.push(orderData);
    }
    await user.save();

    // DealerDB logic
    if (dealer) {
      const vendorOrderIndex = dealer.vendorOrders.findIndex(o =>
        o.orderCompleted === false &&
        o.vendorId.toString() === user._id.toString() &&
        o.orderId === orderId
      );

      if (vendorOrderIndex !== -1) {
        dealer.vendorOrders[vendorOrderIndex].items = orderData.items;
        dealer.vendorOrders[vendorOrderIndex].totalAmount = orderData.totalAmount;
        dealer.vendorOrders[vendorOrderIndex].orderUpdatedAt = orderData.orderUpdatedAt; // update timestamp
      } else {
        dealer.vendorOrders.push({
          vendorName: user.name,
          vendorEmail: user.email,
          vendorId: user._id,
          ...orderData
        });
      }
      await dealer.save();
    }

    return res.json({ success: true, orderId });

  } catch (err) {
    console.error("Order confirm error:", err);
    return res.json({ success: false, message: err.message });
  }
});


app.get('/clear-cart-dealer', async (req, res) => {
  try {
    const currentUser = await userdb.findOne({ email: req.user.email });
    if (!currentUser) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Clear cart and currentDealer
    currentUser.cart = [];
    currentUser.currentDealer = null;

    await currentUser.save();

    res.json({ success: true, message: 'Cart and current dealer cleared successfully' });
  } catch (error) {
    console.error('Error clearing cart and currentDealer:', error);
    res.status(500).json({ success: false, message: 'Internal server error' });
  }
});

app.get('/my-orders', async (req, res) => {
  try {
    const user = await userdb.findOne({ email: req.user.email });
    if (!user) return res.status(404).send("User not found");

    let imageBase64 = null;
    if (user.profileImage?.data) {
      imageBase64 = `data:${user.profileImage.contentType};base64,${user.profileImage.data.toString('base64')}`;
    }

    // Group orders by orderId
    const groupedOrders = user.orders.reduce((acc, order) => {
      const { orderId, dealer, items = [], totalAmount = 0, orderCompleted, orderUpdatedAt } = order;
      if (!acc[orderId]) {
        acc[orderId] = {
          orderId,
          dealer,
          items: [],
          total: 0,
          orderCompleted,
          orderUpdatedAt: orderUpdatedAt || new Date(0)
        };
      }
      acc[orderId].items.push(...items);
      acc[orderId].total += totalAmount;
      if (!orderCompleted) acc[orderId].orderCompleted = false;
      if (orderUpdatedAt && new Date(orderUpdatedAt) > new Date(acc[orderId].orderUpdatedAt)) {
        acc[orderId].orderUpdatedAt = orderUpdatedAt;
      }
      return acc;
    }, {});

    const ordersArray = Object.values(groupedOrders);
    ordersArray.sort((a, b) => new Date(b.orderUpdatedAt) - new Date(a.orderUpdatedAt));
    const noOrders = ordersArray.length === 0;

    const approvedOrders = ordersArray.filter(o => o.orderCompleted);

    // Build a map: orderId -> dealer phone (actual dealer for each order)
    const dealerPhoneMap = {};
    for (const order of ordersArray) {
      const dealerId = order.dealer;
      if (dealerId) {
        const dealerDoc = await dealerdb.findOne({ _id: dealerId }, { phone: 1 });
        dealerPhoneMap[order.orderId] = dealerDoc?.phone || null;
      } else {
        dealerPhoneMap[order.orderId] = null;
      }
    }

    // Prepare a map for dealer approval dates by orderId
    const dealerApprovalDates = {};
    for (const approvedOrder of approvedOrders) {
      const dealerId = approvedOrder.dealer;
      if (dealerId) {
        const dealerDoc = await dealerdb.findOne({ _id: dealerId }, { vendorOrders: 1 });
        if (dealerDoc) {
          const vendorOrder = dealerDoc.vendorOrders.find(vo =>
            vo.orderId === approvedOrder.orderId &&
            vo.vendorId?.toString() === user._id.toString()
          );
          dealerApprovalDates[approvedOrder.orderId] = vendorOrder?.orderApprovedAt || null;
        } else {
          dealerApprovalDates[approvedOrder.orderId] = null;
        }
      } else {
        dealerApprovalDates[approvedOrder.orderId] = null;
      }
    }

    // Map: orderId -> array of other members (approved) with phone number
    const otherMembersMap = {};
    for (const approvedOrder of approvedOrders) {
      const members = await userdb.find({
        email: { $ne: user.email },
        orders: {
          $elemMatch: { orderId: approvedOrder.orderId, orderCompleted: true }
        }
      }, {
        name: 1,
        location: 1,
        profileImage: 1,
        phone: 1,
        orders: { $elemMatch: { orderId: approvedOrder.orderId, orderCompleted: true } }
      });

      otherMembersMap[approvedOrder.orderId] = members
        .map(member => ({
          name: member.name,
          lat: member.location?.lat || 'N/A',
          lon: member.location?.lon || 'N/A',
          phone: member.phone || '',
          image: member.profileImage?.data
            ? `data:${member.profileImage.contentType};base64,${member.profileImage.data.toString('base64')}`
            : null,
          order: member.orders[0],
          orderUpdatedAt: member.orders[0]?.orderUpdatedAt || null
        }))
        .sort((a, b) => {
          const aTime = a.orderUpdatedAt ? new Date(a.orderUpdatedAt).getTime() : 0;
          const bTime = b.orderUpdatedAt ? new Date(b.orderUpdatedAt).getTime() : 0;
          return bTime - aTime;
        });
    }

    res.render('my-orders', {
      user: {
        name: user.name,
        location: `${user.location?.lat || ''}, ${user.location?.lon || ''}`,
        profileImage: imageBase64,
        role: user.role,
        activePage: 'my-orders'
      },
      orders: ordersArray,
      dealerPhoneMap,
      otherMembersMap,
      dealerApprovalDates,
      noOrders
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to load profile");
  }
});


app.get('/dealer-dashboard', async (req, res) => {
  try {
    const user = await dealerdb.findOne({ email: req.user.email });

    if (!user) {
      return res.status(404).send("User not found");
    }

    // Convert buffer to base64 string
    let imageBase64 = null;
    if (user.profileImage && user.profileImage.data) {
      imageBase64 = `data:${user.profileImage.contentType};base64,${user.profileImage.data.toString('base64')}`;
    }

    res.render('dealer-dashboard', {
      user: {
        name: user.name,
        location: `${user.location?.lat || ''}, ${user.location?.lon || ''}`,
        profileImage: imageBase64,
        products: user.products
      },
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to load profile");
  }
});

app.get('/add-product', async (req, res) => {
  try {
    const user = await dealerdb.findOne({ email: req.user.email });

    if (!user) return res.status(404).send("User not found");

    // Convert buffer to base64 string for profile image
    let imageBase64 = null;
    if (user.profileImage?.data) {
      imageBase64 = `data:${user.profileImage.contentType};base64,${user.profileImage.data.toString('base64')}`;
    }

    const products = (Array.isArray(user.products) ? user.products : []).map(product => ({
      name: product.name,
      price: product.price,
      priceUnit: product.priceUnit,
      quantity: product.quantity,
      quantityUnit: product.quantityUnit,
      description: product.description,
      image: product.image?.data
        ? `data:${product.image.contentType};base64,${product.image.data.toString('base64')}`
        : null,
      imageName: product.image?.fileName,
      id: product._id,
    }));

    // Prepare message if no products
    const noProductsMessage = products.length === 0 ? "Add products to show here!" : null;

    res.render('add-product', {
      user: {
        name: user.name,
        location: `${user.location?.lat || ''}, ${user.location?.lon || ''}`,
        profileImage: imageBase64,
        role: user.role,
        activePage: 'add-product'
      },
      products,
      noProductsMessage
    });

  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to load profile");
  }
});

app.post('/add-product', upload.single('productImage'), async (req, res) => {
  try {
    const {
      productId,       // pass productId from frontend if editing an existing product
      productName,
      price,
      priceUnit,
      quantity,
      quantityUnit,
      description,
      customFileName
    } = req.body;

    const dealer = await dealerdb.findOne({ email: req.user.email });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    // Check if productId exists and find product index
    const prodIndex = dealer.products.findIndex(prod => prod._id.toString() === productId);

    if (prodIndex !== -1) {
      // Update existing product
      dealer.products[prodIndex].name = productName;
      dealer.products[prodIndex].price = price;
      dealer.products[prodIndex].priceUnit = priceUnit;
      dealer.products[prodIndex].quantity = quantity;
      dealer.products[prodIndex].quantityUnit = quantityUnit;
      dealer.products[prodIndex].description = description;

      if (req.file) {
        dealer.products[prodIndex].image.data = req.file.buffer;
        dealer.products[prodIndex].image.contentType = req.file.mimetype;
        dealer.products[prodIndex].image.fileName = customFileName || req.file.originalname;
      }
    } else {
      // Add new product
      const newProduct = {
        name: productName,
        price,
        priceUnit,
        quantity,
        quantityUnit,
        description,
        image: {
          data: req.file.buffer,
          contentType: req.file.mimetype,
          fileName: customFileName || req.file.originalname
        }
      };
      dealer.products.push(newProduct);
    }

    await dealer.save();

    res.json({ success: true, message: 'Product added successfully' });
  } catch (error) {
    console.error("Add product error:", error);
    res.status(500).json({ error: 'Failed to add product' });
  }
});


app.post('/delete-product', async (req, res) => {
  try {
    const { productId } = req.body;
    const dealer = await dealerdb.findOne({ email: req.user.email });
    if (!dealer) return res.status(404).json({ error: 'Dealer not found' });

    // Remove product by id from products array
    dealer.products = dealer.products.filter(product => product._id.toString() !== productId);

    await dealer.save();
    res.json({ success: true, message: 'Product deleted successfully' });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

app.get('/view-request', async (req, res) => {
  try {
    const user = await dealerdb.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).send("User not found");
    }

    // Convert profile image buffer to base64 string
    let imageBase64 = null;
    if (user.profileImage && user.profileImage.data) {
      imageBase64 = `data:${user.profileImage.contentType};base64,${user.profileImage.data.toString('base64')}`;
    }

    // Get all users who have at least one order
    const allUsers = await userdb.find({ 'orders.0': { $exists: true } });

    // Group orders by orderId
    const groupOrders = {};

    allUsers.forEach(userDoc => {
      userDoc.orders.forEach(order => {
        const oid = order.orderId || 'Unknown';
        if (!groupOrders[oid]) {
          groupOrders[oid] = [];
        }
        groupOrders[oid].push({
          name: userDoc.name,
          lat: userDoc.location?.lat || 'N/A',
          lon: userDoc.location?.lon || 'N/A',
          amount: order.totalAmount || 0,
          image: userDoc.profileImage?.data
            ? `data:${userDoc.profileImage.contentType};base64,${userDoc.profileImage.data.toString('base64')}`
            : null,
          order: order,
          orderUpdatedAt: order.orderUpdatedAt || null
        });
      });
    });

    // Sort each group by order.updatedAt descending internally
    Object.keys(groupOrders).forEach(oid => {
      groupOrders[oid].sort((a, b) => {
        const aTime = a.order.updatedAt ? new Date(a.order.updatedAt).getTime() : 0;
        const bTime = b.order.updatedAt ? new Date(b.order.updatedAt).getTime() : 0;
        return bTime - aTime;
      });
    });

    // Get all orderIds sorted by the most recent updatedAt among their orders
    const sortedOrderIds = Object.keys(groupOrders).sort((a, b) => {
      const getLatestTime = group => Math.max(...group.map(m => new Date(m.order.updatedAt || 0).getTime()));
      return getLatestTime(groupOrders[b]) - getLatestTime(groupOrders[a]);
    });

    // Fetch dealer's vendorOrders once for dealer approval dates
    const dealerVendorOrders = user.vendorOrders || [];

    // Map orderId to dealer approval date
    const dealerApprovalDates = {};
    sortedOrderIds.forEach(orderId => {
      const vendorOrder = dealerVendorOrders.find(vo => vo.orderId === orderId);
      dealerApprovalDates[orderId] = (vendorOrder && vendorOrder.orderApprovedAt) ? vendorOrder.orderApprovedAt : null;
    });

    res.render('dealer-view-request', {
      user: {
        name: user.name,
        location: `${user.location?.lat || ''}, ${user.location?.lon || ''}`,
        profileImage: imageBase64,
        role: user.role,
        _id: user._id,
        buyLimit: user.buyLimit,
        activePage: 'view-request'
      },
      groups: groupOrders,
      sortedOrderIds,
      dealerApprovalDates,
      noRequests: sortedOrderIds.length === 0
    });
  } catch (error) {
    console.error(error);
    req.session.error = "User not found or incorrect email/role.";
    return res.status(401).redirect('/');
    res.status(500).send("Failed to load profile");
  }
});

app.post('/approve-request', async (req, res) => {
  const { orderId, dealerId } = req.body;
  try {
    const now = new Date();

    // Update all matching user orders with this orderId under the dealer to set orderCompleted = true and approval timestamp
    await userdb.updateMany(
      { 'orders.orderId': orderId, 'orders.dealer': dealerId },
      { $set: { 'orders.$[elem].orderCompleted': true, 'orders.$[elem].orderApprovedAt': now }, $unset: { cart: "", currentDealer: "" } },
      { arrayFilters: [{ 'elem.orderId': orderId, 'elem.dealer': dealerId, 'elem.orderCompleted': false }] }
    );

    // Update all matching dealer vendorOrders with this orderId to set orderCompleted = true and approval timestamp
    await dealerdb.updateOne(
      { _id: dealerId },
      { $set: { 'vendorOrders.$[elem].orderCompleted': true, 'vendorOrders.$[elem].orderApprovedAt': now } },
      { arrayFilters: [{ 'elem.orderId': orderId, 'elem.orderCompleted': false }] }
    );

    res.json({ success: true, message: `Order ${orderId} approved.` });
  } catch (error) {
    console.error('Approve request error:', error);
    res.status(500).json({ success: false, message: 'Failed to approve order' });
  }
});


app.get("/logout", (req, res) => {
  res.clearCookie('token', { path: '/' });
  res.status(200).redirect('/');
});

app.listen(PORT, () => {
  console.log(`🚀 Server running at http://localhost:${PORT}`);
});
