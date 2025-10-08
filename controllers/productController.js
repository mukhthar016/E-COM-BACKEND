const Product = require('../models/productModel');


// Add a new product (Admin)
const addProduct = async (req, res) => {
    console.log(res)
    try {
        const { name, category, price, stock, image } = req.body;
        const product = await Product.create({ name, category, price, stock, image });
        res.status(201).json({ message: 'Product added', product });
    } catch (err) {
        res.status(500).json({ message: 'Server error',err });
    }
};

// Get all products (public)
const getProducts = async (req, res) => {
    try {
        const products = await Product.find();
        res.json(products);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Get single product by ID
const getProductById = async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json(product);
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Update product (Admin)
const updateProduct = async (req, res) => {
    try {
        const { name, category, price, stock, image } = req.body;
        const product = await Product.findByIdAndUpdate(
            req.params.id,
            { name, category, price, stock, image },
            { new: true }
        );
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product updated', product });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

// Delete product (Admin)
const deleteProduct = async (req, res) => {
    try {
        const product = await Product.findByIdAndDelete(req.params.id);
        if (!product) return res.status(404).json({ message: 'Product not found' });
        res.json({ message: 'Product deleted' });
    } catch (err) {
        res.status(500).json({ message: 'Server error' });
    }
};

module.exports = { addProduct, getProducts, getProductById, updateProduct, deleteProduct };
