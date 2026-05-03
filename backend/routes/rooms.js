const express = require('express');
const router = express.Router();
const Room = require('../models/Room');

// Get all rooms (with filters)
router.get('/', async (req, res) => {
  try {
    const { maxPrice, minCapacity, facilities, showAll } = req.query;
    
    let query = {};
    if (showAll !== 'true') {
      // Hide rooms that are under repair or out of order, but show booked/occupied ones as 'Not Available' in the frontend
      query.status = { $nin: ['Repair', 'Out of Order'] };
    }
    
    if (maxPrice) {
      query.localPrice = { $lte: Number(maxPrice) };
    }
    
    if (minCapacity) {
      query.capacity = { $gte: Number(minCapacity) };
    }
    
    if (facilities) {
      // facilities could be comma separated like "WiFi,AC"
      const facArray = facilities.split(',');
      query.facilities = { $all: facArray };
    }

    const rooms = await Room.find(query);
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Add a new room
router.post('/', async (req, res) => {
  try {
    const newRoom = new Room(req.body);
    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update a room
router.put('/:id', async (req, res) => {
  try {
    const updatedRoom = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete Room
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  console.log(`SERVER: REQUEST TO DELETE ROOM: ${id}`);
  
  try {
    // Validate ID format before database call
    if (!id || id.length < 24) {
      console.log(`SERVER: INVALID ID FORMAT: ${id}`);
      return res.status(400).json({ message: 'Invalid Room ID format' });
    }

    const result = await Room.findByIdAndDelete(id);
    
    if (!result) {
      console.log(`SERVER: ROOM NOT FOUND IN DB: ${id}`);
      return res.status(404).json({ message: 'Room not found in database' });
    }

    console.log(`SERVER: ROOM DELETED SUCCESSFULLY: ${id}`);
    res.json({ message: 'Room successfully removed', deletedId: id });
  } catch (error) {
    console.error(`SERVER: CRITICAL DELETE ERROR:`, error);
    res.status(500).json({ message: 'Server error during deletion: ' + error.message });
  }
});

module.exports = router;
