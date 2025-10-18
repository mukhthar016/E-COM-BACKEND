const mongoose = require('mongoose');
const cloudinary = require('../config/cloudinary');
const streamifier = require('streamifier');
const Product = require('../models/productModel');
const Category = require('../models/categoryModel');

// Helper: upload to Cloudinary
const uploadToCloudinary = (fileBuffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      { folder: "products" },
      (err, res) => (err ? reject(err) : resolve(res))
    );
    streamifier.createReadStream(fileBuffer).pipe(uploadStream);
  });
};

// Add Product (Admin)
const addProduct = async (req, res) => {
  try {
    const { name, categoryId, price, stock, newCategoryName } = req.body;

    let category = newCategoryName
      ? await Category.create({ name: newCategoryName })
      : await Category.findById(categoryId);
    if (!category) return res.status(404).json({ message: "Category not found" });

    let imageUrl = "", cloudinaryId = "";
    if (req.file) {
      const result = await uploadToCloudinary(req.file.buffer);
      imageUrl = result.secure_url;
      cloudinaryId = result.public_id;
    }

    const product = await Product.create({
      name,
      category: category._id,
      price,
      stock,
      image: imageUrl,
      cloudinaryId
    });

    res.status(201).json({ message: "Product added successfully", product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Update Product (Admin)
const updateProduct = async (req, res) => {
  try {
    const { name, category, price, stock } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    // Replace image if new file uploaded
    if (req.file) {
      if (product.cloudinaryId) await cloudinary.uploader.destroy(product.cloudinaryId);
      const result = await uploadToCloudinary(req.file.buffer);
      product.image = result.secure_url;
      product.cloudinaryId = result.public_id;
    }

    product.name = name || product.name;
    product.category = category || product.category;
    product.price = price || product.price;
    product.stock = stock || product.stock;

    await product.save();
    res.json({ message: 'Product updated', product });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete Product (Admin)
const deleteProduct = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ message: 'Product not found' });

    if (product.cloudinaryId) await cloudinary.uploader.destroy(product.cloudinaryId);
    await product.deleteOne();

    res.json({ message: 'Product deleted' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get all products
const getProducts = async (req, res) => {
  try {
    const { category, sort, order = "asc", search = "" } = req.query;

    const query = {};

   
    if (category) {
      query.category = new mongoose.Types.ObjectId(category);
    }

    
    const searchRegex = new RegExp(search, "i");

    
    let sortOption = {};
    if (sort === "price") sortOption.price = order === "desc" ? -1 : 1;
    else if (sort === "name") sortOption.name = order === "desc" ? -1 : 1;

    
    let products = await Product.find(query)
      .populate("category", "name")
      .sort(sortOption);

    
    if (search) {
      products = products
        .filter(
          (p) =>
            searchRegex.test(p.name) || searchRegex.test(p.category?.name || "")
        )
        
        .sort((a, b) => {
          const aNameMatch = searchRegex.test(a.name);
          const bNameMatch = searchRegex.test(b.name);
          const aCatMatch = searchRegex.test(a.category?.name || "");
          const bCatMatch = searchRegex.test(b.category?.name || "");

         
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
          if (aCatMatch && !bCatMatch) return -1;
          if (!aCatMatch && bCatMatch) return 1;
          return 0;
        });
    }

    res.json(products);
  } catch (err) {
    console.error("getProducts error:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Get product by ID
const getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id).populate("category");
    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.json(product);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addProduct, updateProduct, deleteProduct, getProducts, getProductById };
