const User = require('../models/userModel');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

// Register
const registerUser = async (req, res) => {
    try {
        const { name, email, password } = req.body;
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ message: 'User already exists' });

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({ name, email, password: hashedPassword });
        res.status(201).json({ message: 'User registered', user });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// Login
const loginUser = async (req, res) => {
    console.log(res)
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });
        if (!user) return res.status(400).json({ message: 'Invalid credentials' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ message: 'Invalid credentials' });

        const token = jwt.sign({ id: user._id, email: user.email, isAdmin: user.isAdmin }, process.env.JWT_SECRET, { expiresIn: '1d' });

        res.json({ message: 'Login successful', token, user: { id: user._id, name: user.name, email: user.email, isAdmin: user.isAdmin } });
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

// Profile
const getProfile = (req, res) => {
    res.json({ message: 'Profile data', user: req.user });
};

// List all users (admin)
const listUsers = async (req, res) => {
    console.log(res)
    try {
        const users = await User.find().select('-password'); // hide password
        res.json(users);
    } catch (err) { res.status(500).json({ message: 'Server error' }); }
};

module.exports = { registerUser, loginUser, getProfile, listUsers };
