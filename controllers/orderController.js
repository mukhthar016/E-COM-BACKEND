const Order = require('../models/orderModel');
const Product = require('../models/productModel');

// Place order (user)
const placeOrder = async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();
  try {
    // optional: accept address/paymentMethod in body
    const { address, paymentMethod } = req.body;

    // 1) load user's cart and populate products
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product').session(session);
    if (!cart || cart.items.length === 0) {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Cart is empty' });
    }

    // 2) check stock & compute total
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

    // 3) create order document (based on cart items)
    const orderPayload = {
      user: req.user.id,
      products: cart.items.map(i => ({ product: i.product._id, quantity: i.quantity })),
      totalPrice,
      address: address || 'No address provided',
      paymentMethod: paymentMethod || 'COD'
    };

    // create using session
    const [order] = await Order.create([orderPayload], { session });

    // 4) deduct stock for each product (in session)
    for (const item of cart.items) {
      const prod = await Product.findById(item.product._id).session(session);
      prod.stock = prod.stock - item.quantity;
      if (prod.stock < 0) prod.stock = 0; // safety
      await prod.save({ session });
    }

    // 5) clear cart
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

// Cancel order (user or admin) — restore stock only if order is Pending
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

    // Only allow cancel if Pending (and only owner or admin can cancel)
    if (order.status !== 'Pending') {
      await session.abortTransaction();
      session.endSession();
      return res.status(400).json({ message: 'Only pending orders can be cancelled' });
    }

    // authorize: owner or admin
    if (order.user.toString() !== req.user.id && !req.user.isAdmin) {
      await session.abortTransaction();
      session.endSession();
      return res.status(403).json({ message: 'Not authorized to cancel this order' });
    }

    // restore stocks
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

module.exports = { cancelOrder,placeOrder, getUserOrders, getAllOrders, updateOrderStatus };
