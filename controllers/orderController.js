const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const mongoose = require("mongoose");

// ======================================================
// 🧩 NEW: placeOrder (no transactions - works in standalone MongoDB)
// ======================================================
// Place order (user)
const placeOrder = async (req, res) => {
  try {
    const { addressId, paymentMethod, paymentStatus, items, totalAmount } = req.body;

    // try loading user cart
    let cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    let cartItems = [];
    let totalPrice = 0;

    if (cart && cart.items.length > 0) {
      // ✅ normal flow (cart exists)
      cartItems = cart.items.map(i => ({
        product: i.product._id,
        quantity: i.quantity
      }));

      for (const item of cart.items) {
        const product = item.product;
        if (product.stock < item.quantity) {
          return res.status(400).json({ message: `Not enough stock for ${product.name}` });
        }
        totalPrice += product.price * item.quantity;
      }
    } else if (items && items.length > 0) {
      // ✅ fallback if cart is empty (UPI async flow)
      cartItems = items.map(i => ({
        product: i.product?._id || i.product,
        quantity: i.quantity
      }));
      totalPrice = totalAmount || 0;
    } else {
      return res.status(400).json({ message: 'Cart is empty or missing.' });
    }

    // 3) create order document
    const orderPayload = {
      user: req.user.id,
      products: cartItems,
      totalPrice,
      addressId: addressId || null,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: paymentStatus || 'Pending'
    };

    const order = await Order.create(orderPayload);

    // 4) reduce stock
    for (const item of cartItems) {
      const prod = await Product.findById(item.product);
      if (prod) {
        prod.stock = Math.max(0, prod.stock - item.quantity);
        await prod.save();
      }
    }

    // 5) clear user’s cart
    if (cart) {
      cart.items = [];
      await cart.save();
    }

    return res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    console.error('placeOrder error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};


/*
====================================================================
🧾 OLD: Transactional placeOrder (for replica set / production use)
====================================================================

const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const { addressId, paymentMethod, paymentStatus } = req.body;

    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product').session(session);
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    let totalPrice = 0;
    for (const item of cart.items) {
      const product = item.product;
      if (!product) {
        await session.abortTransaction();
        session.endSession();
        return res.status(404).json({ message: `Product not found in DB: ${item.product}` });
      }
      if (product.stock < item.quantity) {
        await session.abortTransaction();
        session.endSession();
        return res.status(400).json({ message: `Not enough stock for ${product.name}` });
      }
      totalPrice += product.price * item.quantity;
    }

    const orderPayload = {
      user: req.user.id,
      products: cart.items.map(i => ({ product: i.product._id, quantity: i.quantity })),
      totalPrice,
      address: address || 'No address provided',
      paymentMethod: paymentMethod || 'COD'
    };
    if (paymentStatus) orderPayload.paymentStatus = paymentStatus;
    if (addressId) orderPayload.addressId = addressId;

    const [order] = await Order.create([orderPayload], { session });

    for (const item of cart.items) {
      const prod = await Product.findById(item.product._id).session(session);
      prod.stock = prod.stock - item.quantity;
      if (prod.stock < 0) prod.stock = 0;
      await prod.save({ session });
    }

    cart.items = [];
    await cart.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('placeOrder error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
*/

// ======================================================
// 🧾 Get user orders
// ======================================================
const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user.id })
      .populate('products.product', 'name price');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ======================================================
// 🧾 Get all orders (Admin)
// ======================================================
const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate('user', 'name email')
      .populate('products.product', 'name price');
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

// ======================================================
// 🧾 Update order status (Admin)
// ======================================================
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

// ======================================================
// 🧾 Cancel order (no transactions)
// ======================================================
const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Pending') {
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // restore stocks
    for (const item of order.products) {
      await Product.findByIdAndUpdate(
        item.product,
        { $inc: { stock: item.quantity } },
        { new: true }
      );
    }

    order.status = 'Cancelled';
    await order.save();

    return res.json({ message: 'Order cancelled', order });
  } catch (err) {
    console.error('cancelOrder error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};

/*
====================================================================
🧾 OLD: Transactional cancelOrder (for replica set / production use)
====================================================================

const cancelOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    const orderId = req.params.id;
    const order = await Order.findById(orderId).session(session);
    if (!order) {
      await session.abortTransaction();
      session.endSession();
      return res.status(404).json({ message: 'Order not found' });
    }

    if (order.status !== 'Pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    for (const item of order.products) {
      const prod = await Product.findById(item.product).session(session);
      if (prod) {
        prod.stock += item.quantity;
        await prod.save({ session });
      }
    }

    order.status = 'Cancelled';
    await order.save({ session });

    await session.commitTransaction();
    session.endSession();

    return res.json({ message: 'Order cancelled', order });
  } catch (err) {
    await session.abortTransaction();
    session.endSession();
    console.error('cancelOrder error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};
*/

module.exports = {
  cancelOrder,
  placeOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus
};
