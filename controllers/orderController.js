const Order = require('../models/orderModel');
const Product = require('../models/productModel');

// Place order (user)
const placeOrder = async (req, res) => {
  try {
    const { products, address, paymentMethod } = req.body;

    let totalPrice = 0;

    // Step 1: Check products and calculate total
    for (const item of products) {
      const product = await Product.findById(item.product);
      if (!product)
        return res.status(404).json({ message: `Product not found: ${item.product}` });

      if (product.stock < item.quantity)
        return res
          .status(400)
          .json({ message: `Not enough stock for ${product.name}` });

      totalPrice += product.price * item.quantity;
    }

    // Step 2: Create the order
    const order = await Order.create({
      user: req.user.id,
      products,
      totalPrice,
      address,
      paymentMethod,
    });

    // Step 3: Update product stock AFTER order creation
    for (const item of products) {
      const product = await Product.findById(item.product);
      product.stock -= item.quantity;
      await product.save();
    }

    res.status(201).json({ message: "Order placed successfully", order });
  } catch (err) {
    console.error(" Error placing order:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get user orders
const getUserOrders = async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user.id }).populate('products.product', 'name price');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get all orders (Admin)
const getAllOrders = async (req, res) => {
    try {
        const orders = await Order.find().populate('user', 'name email').populate('products.product', 'name price');
        res.json(orders);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update order status (Admin)
const updateOrderStatus = async (req, res) => {
    try {
        const { status } = req.body;
        const order = await Order.findByIdAndUpdate(
            req.params.id,
            { status },
            { new: true }
        );
        if (!order) return res.status(404).json({ message: 'Order not found' });
        res.json({ message: 'Order status updated', order });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { placeOrder, getUserOrders, getAllOrders, updateOrderStatus };
