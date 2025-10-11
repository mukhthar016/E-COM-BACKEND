// controllers/addressController.js
const Address = require('../models/addressModel');

const addAddress = async (req, res) => {
  try {
    const userId = req.user.id; // authMiddleware must set req.user
    const { label, line1, line2, city, state, country, postalCode, phone, isDefault } = req.body;

    // If marking as default, clear previous default
    if (isDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    const address = await Address.create({
      user: userId,
      label, line1, line2, city, state, country, postalCode, phone, isDefault: !!isDefault
    });

    res.status(201).json({ message: 'Address added', address });
  } catch (err) {
    console.error('Address add error:', err);
    res.status(500).json({ message: 'Server error', error: err.message });
  }
};

const getAddresses = async (req, res) => {
  try {
    const userId = req.user.id;
    const addresses = await Address.find({ user: userId }).sort({ isDefault: -1, createdAt: -1 });
    res.json(addresses);
  } catch (err) {
    console.error('Get addresses error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const updateAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const update = req.body;

    if (update.isDefault) {
      await Address.updateMany({ user: userId }, { isDefault: false });
    }

    const updated = await Address.findOneAndUpdate({ _id: id, user: userId }, update, { new: true });
    if (!updated) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Address updated', address: updated });
  } catch (err) {
    console.error('Update address error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

const deleteAddress = async (req, res) => {
  try {
    const userId = req.user.id;
    const id = req.params.id;
    const removed = await Address.findOneAndDelete({ _id: id, user: userId });
    if (!removed) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Address deleted' });
  } catch (err) {
    console.error('Delete address error:', err);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { addAddress, getAddresses, updateAddress, deleteAddress };
