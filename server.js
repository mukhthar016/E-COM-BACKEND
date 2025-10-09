const express = require('express');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const cors = require('cors');

// Import Routes
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const cartRoutes = require('./routes/cartRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const categoryRoutes = require('./routes/categoryRoutes');


dotenv.config();

const app = express();

// Middleware to parse JSON
app.use(express.json());
//cors
app.use(cors());

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/categories', categoryRoutes);
app.use("/api/payment", require("./routes/paymentRoutes"));


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
