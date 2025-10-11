const mongoose = require('mongoose')

const Product = require('../models/productModel');
const Category = require('../models/categoryModel')

// Add a new product (Admin)
const addProduct = async (req, res) => {
  try {
    const { name, categoryId, price, stock, image, newCategoryName } = req.body;

    let category;

    // If new category is entered
    if (newCategoryName) {
      category = await Category.create({ name: newCategoryName });
    } else {
      category = await Category.findById(categoryId);
    }

    if (!category) {
      return res.status(404).json({ message: "Category not found" });
    }

    const product = await Product.create({
      name,
      category: category._id,
      price,
      stock,
      image,
    });

    res.status(201).json({ message: "Product added successfully", product });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get all products (public)
// GET /api/products?category=catId&sort=name&order=asc
// GET /api/products?sort=price&order=desc
// GET /api/products?sort=alphabetical&order=asc
// 📦 Get Products (with category filter, sort, and search)
// 📦 Get Products (supports category + search + sort)
const getProducts = async (req, res) => {
  try {
    const { category, sort, order, search } = req.query;

    // ✅ Define sorting logic
    let sortOption = {};
    if (sort === "price") sortOption.price = order === "desc" ? -1 : 1;
    else if (sort === "name" || sort === "alphabetical")
      sortOption.name = order === "desc" ? -1 : 1;
    else if (sort === "category") sortOption["category.name"] = order === "desc" ? -1 : 1;

    // ✅ Base pipeline
    const pipeline = [
      {
        $lookup: {
          from: "categories",
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: { path: "$category", preserveNullAndEmptyArrays: true } },
    ];

    // ✅ Search logic
    if (search) {
      pipeline.push({
        $match: {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } },
            { "category.name": { $regex: search, $options: "i" } },
          ],
        },
      });
    }

    // ✅ Category filter
   if (category) {
  pipeline.push({
    $match: { "category._id": new mongoose.Types.ObjectId(category) },
  });
}
    // ✅ Sorting logic
    if (Object.keys(sortOption).length > 0) {
      pipeline.push({ $sort: sortOption });
    }

    const products = await Product.aggregate(pipeline);

    res.status(200).json(products);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
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
