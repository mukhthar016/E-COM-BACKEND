const Category = require('../models/categoryModel');


const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    if (!name) return res.status(400).json({ message: 'Name is required' });

    const existing = await Category.findOne({ name });
    if (existing)
      return res.status(400).json({ message: 'Category already exists' });

    const cat = await Category.create({ name, description });
    res.status(201).json({ message: 'Category added', category: cat });
  } catch (err) {
    console.error('Error adding category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

//  Read All
const listCategories = async (req, res) => {
  try {
    const cats = await Category.find().sort({ createdAt: -1 });
    res.json(cats);
  } catch (err) {
    console.error('Error fetching categories:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

//  Read One
const getCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });
    res.json(cat);
  } catch (err) {
    console.error('Error fetching category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

//  Update
const updateCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    if (name) cat.name = name;
    if (description) cat.description = description;

    await cat.save();
    res.json({ message: 'Category updated', category: cat });
  } catch (err) {
    console.error('Error updating category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

//  Delete
const deleteCategory = async (req, res) => {
  try {
    const cat = await Category.findById(req.params.id);
    if (!cat) return res.status(404).json({ message: 'Category not found' });

    await cat.deleteOne();
    res.json({ message: 'Category deleted' });
  } catch (err) {
    console.error('Error deleting category:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  addCategory,
  listCategories,
  getCategory,
  updateCategory,
  deleteCategory,
};
