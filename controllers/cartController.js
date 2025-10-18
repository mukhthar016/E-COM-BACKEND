const Cart = require('../models/cartModel');
const Product = require('../models/productModel');

// Get cart for logged-in user
const getCart = async (req, res) => {
  try {
    const cart = await Cart.findOne({ user: req.user.id }).populate('items.product');
    if (!cart) return res.json({ items: [], total: 0 });

    let total = 0;
    cart.items.forEach(item => {
      total += item.product.price * item.quantity;
    });

    res.json({ items: cart.items, total });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Add product to cart
const addToCart = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    // Check if product already in cart
    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);

    if (itemIndex > -1) {
      // Increase quantity
      cart.items[itemIndex].quantity += quantity;
    } else {
      cart.items.push({ product: productId, quantity });
    }

    await cart.save();
    res.json({ message: 'Product added to cart', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Merge guest cart into user's cart
const mergeGuestCart = async (req, res) => {
  try {
    const { items } = req.body; // array of { product: { _id, price, ... }, quantity }
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ message: "Invalid items format" });
    }

    let cart = await Cart.findOne({ user: req.user.id });
    if (!cart) {
      cart = await Cart.create({ user: req.user.id, items: [] });
    }

    for (const item of items) {
      const productId = item?.product?._id || item?.productId;
      const quantity = item?.quantity || 1;
      if (!productId) continue;

      const index = cart.items.findIndex(
        (i) => i.product.toString() === productId
      );

      if (index > -1) {
        // product exists → increase quantity
        cart.items[index].quantity += quantity;
      } else {
        // new product → push
        cart.items.push({ product: productId, quantity });
      }
    }

    await cart.save();
    await cart.populate("items.product");

    res.json({
      message: "Guest cart merged successfully",
      cart: cart.items,
    });
  } catch (err) {
    console.error("Error merging guest cart:", err);
    res.status(500).json({ message: "Server error while merging cart" });
  }
};


// Update quantity of a product
const updateCartItem = async (req, res) => {
  try {
    const { productId, quantity } = req.body;

    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
    if (itemIndex === -1) return res.status(404).json({ message: 'Product not in cart' });

    cart.items[itemIndex].quantity = quantity;
    await cart.save();

    res.json({ message: 'Cart updated', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Remove product from cart
const removeCartItem = async (req, res) => {
  try {
    const productId = req.params.productId; //  use params instead of body
    const cart = await Cart.findOne({ user: req.user.id });
    if (!cart) return res.status(404).json({ message: 'Cart not found' });

    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();

    res.json({ message: 'Product removed from cart', cart });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};


module.exports = { getCart, addToCart, updateCartItem, removeCartItem ,mergeGuestCart};
