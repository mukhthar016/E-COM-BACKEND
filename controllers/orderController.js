const Order = require('../models/orderModel');
const Product = require('../models/productModel');
const Cart = require('../models/cartModel');
const mongoose = require("mongoose");
const transporter = require('../config/nodemailer');
const User = require('../models/userModel'); 



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

    // ---------------------------
    // ✅ Send email notifications
    // ---------------------------
    try {
      // fetch full user details (so we have name and email)
      const userDoc = await User.findById(req.user.id).select('name email');
      const customerName = userDoc?.name || 'Customer';
      const customerEmail = userDoc?.email || null;

      // Build simple HTML for owner email
      const productsHtml = cartItems.map(ci => {
        // find product details (price/name) from DB if needed
        return `<li>Product: ${ci.product} — Quantity: ${ci.quantity}</li>`;
      }).join('');

      const ownerMail = {
        from: process.env.EMAIL_USER,
        to: process.env.OWNER_EMAIL,
        subject: `New Order Received — ${order._id}`,
        html: `
          <h2>New Order Received</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Customer:</strong> ${customerName} ${ customerEmail ? `(&lt;${customerEmail}&gt;)` : '' }</p>
          <p><strong>Total:</strong> ₹${totalPrice}</p>
          <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
          <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
          <p><strong>Address ID:</strong> ${order.addressId || 'Not provided'}</p>
          <h3>Items</h3>
          <ul>${productsHtml}</ul>
          <p>Visit admin panel for full details.</p>
        `
      };

      await transporter.sendMail(ownerMail);

      // Optional: send confirmation to user (uncomment if you want)
      if (customerEmail) {
        const userMail = {
          from: process.env.EMAIL_USER,
          to: customerEmail,
          subject: `Order Confirmation — ${order._id}`,
          html: `
            <h2>Thanks for your order!</h2>
            <p>Hello ${customerName},</p>
            <p>We have received your order <strong>${order._id}</strong> for ₹${totalPrice}.</p>
            <h3>Items</h3>
            <ul>${productsHtml}</ul>
            <p>We will notify you when your order status changes.</p>
            <p>Thanks,<br/>E-COM Team</p>
          `
        };
        // send but do not break flow if email fails
        await transporter.sendMail(userMail);
      }
    } catch (emailErr) {
      // Log email error but do not fail the whole request
      console.error('Order email send failed:', emailErr);
    }

    return res.status(201).json({ message: 'Order placed successfully', order });
  } catch (err) {
    console.error('placeOrder error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
};





//  Get user orders

// 🛒 Get user orders with filters
const getUserOrders = async (req, res) => {
  try {
    const { status, sort, startDate, endDate, range } = req.query;
    const filter = { user: req.user.id };

    // Status filter
    if (status) filter.status = status;

    // Date filtering
    if (range === "last6months") {
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
      filter.createdAt = { $gte: sixMonthsAgo };
    } else if (range === "thisyear") {
      const start = new Date(new Date().getFullYear(), 0, 1);
      const end = new Date(new Date().getFullYear(), 11, 31, 23, 59, 59);
      filter.createdAt = { $gte: start, $lte: end };
    } else if (startDate && endDate) {
      filter.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    // Sort logic
    const sortOptions = {
      latest: { createdAt: -1 },
      oldest: { createdAt: 1 },
      price_asc: { totalPrice: 1 },
      price_desc: { totalPrice: -1 },
    };

    const orders = await Order.find(filter)
      .populate("products.product", "name price image")
      .sort(sortOptions[sort] || { createdAt: -1 });

    res.json(orders);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



//  Get all orders (Admin)

const getAllOrders = async (req, res) => {
  try {
    const { status, sort, startDate, endDate } = req.query;

    const filter = {};
    if (status) filter.status = status;

    if (startDate || endDate) {
      filter.createdAt = {};
      if (startDate) filter.createdAt.$gte = new Date(startDate);
      if (endDate) {
        const nextDay = new Date(endDate);
        nextDay.setDate(nextDay.getDate() + 1);
        filter.createdAt.$lte = nextDay;
      }
    }

    let sortOptions = { createdAt: -1 };
    if (sort === "oldest") sortOptions = { createdAt: 1 };
    if (sort === "price_asc") sortOptions = { totalPrice: 1 };
    if (sort === "price_desc") sortOptions = { totalPrice: -1 };

    const orders = await Order.find(filter)
      .populate("user", "name email")
      .populate("products.product", "name price")
      .sort(sortOptions);

    res.json(orders);
  } catch (err) {
    console.error("getAllOrders error:", err);
    res.status(500).json({ message: "Server error" });
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


//  Cancel order (no transactions)

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





module.exports = {
  cancelOrder,
  placeOrder,
  getUserOrders,
  getAllOrders,
  updateOrderStatus
};
