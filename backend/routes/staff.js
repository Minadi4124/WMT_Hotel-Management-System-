const express = require('express');
const router = express.Router();
const Staff = require('../models/Staff');

// Get all staff
router.get('/', async (req, res) => {
  try {
    const { role } = req.query;
    let query = {};
    if (role) query.role = role;
    
    const staff = await Staff.find(query).populate('assignedRoomId');
    res.json(staff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add new staff
router.post('/', async (req, res) => {
  try {
    const newStaff = new Staff(req.body);
    await newStaff.save();
    res.status(201).json(newStaff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update staff
router.put('/:id', async (req, res) => {
  try {
    const updatedStaff = await Staff.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedStaff);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Remove staff (DELETE method)
router.delete('/:id', async (req, res) => {
  try {
    console.log(`STAFF DELETE REQUEST (DELETE): ${req.params.id}`);
    const result = await Staff.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Staff not found' });
    console.log("Staff member deleted successfully from DB");
    res.status(200).json({ message: 'Staff member removed' });
  } catch (error) {
    console.error("Staff Delete Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Remove staff (POST fallback method)
router.post('/delete/:id', async (req, res) => {
  try {
    console.log(`STAFF DELETE REQUEST (POST Fallback): ${req.params.id}`);
    const result = await Staff.findByIdAndDelete(req.params.id);
    if (!result) return res.status(404).json({ message: 'Staff not found' });
    console.log("Staff member deleted successfully from DB (Fallback)");
    res.status(200).json({ message: 'Staff member removed' });
  } catch (error) {
    console.error("Staff Delete Fallback Error:", error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
