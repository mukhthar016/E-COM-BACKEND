const dotenv = require('dotenv');
const express = require('express');
const mongoose = require('mongoose');

const cors = require('cors');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');
const addressRoutes = require('./routes/addressRoutes');
const feedbackRoutes = require("./routes/feedbackRoutes");



dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());
//cors
app.use(
  cors({
    origin: "http://localhost:5173", 
    credentials: true,               
  })
);


// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes);
//app.use("/api/payment", require("./routes/paymentRoutes"));
app.use('/api/addresses', addressRoutes);
app.use("/api/feedback", feedbackRoutes);


// Test route
app.get('/', (req, res) => {
    res.send('Welcome to Fruit Shop API');
});

// Connect MongoDB
mongoose.connect(process.env.MONGO_URI)
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.log('MongoDB connection error:', err.message));

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
