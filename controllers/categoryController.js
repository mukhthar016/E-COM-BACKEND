const Category = require('../models/categoryModel');

const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const existing = await Category.findOne({ name });
    if (existing) return res.status(400).json({ message: 'Category exists' });
    const cat = await Category.create({ name, description });
    res.status(201).json({ message: 'Category added', cat });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Server error' });
  }
};

const listCategories = async (req, res) => {
  try {
    const cats = await Category.find();
    res.json(cats);
  } catch (err) {
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addCategory, listCategories };
