const express = require('express');
const router = express.Router();
const User = require('../models/User');

// Register User
router.post('/register', async (req, res) => {
  try {
    console.log("Registration Request Body:", req.body);
    const { fullName, phoneNumber, email, username, password, role, guestType, age } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      return res.status(400).json({ message: 'User with this email or username already exists' });
    }

    const typeToSave = guestType || 'Local';
    const newUser = new User({ 
      fullName, 
      phoneNumber, 
      email, 
      username, 
      password, 
      role, 
      guestType: typeToSave 
    });
    await newUser.save();
    
    res.status(201).json({ message: 'User registered successfully!' });
  } catch (error) {
    res.status(500).json({ message: error.message || 'Server Error', error });
  }
});

// Login User
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;

    const user = await User.findOne({ username });
    if (!user) {
      return res.status(404).json({ message: 'User not found. Please register.' });
    }

    if (user.password !== password) {
      return res.status(400).json({ message: 'Invalid password' });
    }

    // In a real app, you would generate a JWT token here
    res.status(200).json({ 
      message: 'Login successful', 
      user: {
        id: user._id,
        _id: user._id,
        username: user.username,
        role: user.role,
        fullName: user.fullName,
        guestType: user.guestType
      }
    });
  } catch (error) {
    res.status(500).json({ message: 'Server Error', error });
  }
});

// Admin: Get all guests
router.get('/guests', async (req, res) => {
  try {
    const guests = await User.find({ role: 'guest' });
    res.json(guests);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Admin: Update user
router.put('/users/:id', async (req, res) => {
  try {
    const updatedUser = await User.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedUser);
  } catch (error) {
    res.status(500).json({ message: 'Server Error' });
  }
});

// Admin: Delete user (DELETE method)
router.delete('/users/:id', async (req, res) => {
  try {
    console.log(`DELETE REQUEST (DELETE): Removing user ${req.params.id}`);
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("Delete Error:", error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

// Admin: Delete user (POST fallback method)
router.post('/users/delete/:id', async (req, res) => {
  try {
    console.log(`DELETE REQUEST (POST Fallback): Removing user ${req.params.id}`);
    const deletedUser = await User.findByIdAndDelete(req.params.id);
    if (!deletedUser) return res.status(404).json({ message: 'User not found' });
    res.json({ message: 'User deleted successfully' });
  } catch (error) {
    console.error("Delete Fallback Error:", error);
    res.status(500).json({ message: 'Server Error', error });
  }
});

module.exports = router;
