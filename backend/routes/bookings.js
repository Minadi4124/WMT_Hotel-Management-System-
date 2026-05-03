const express = require('express');
const router = express.Router();
const Booking = require('../models/Booking');
const Room = require('../models/Room');
const User = require('../models/User');

// Admin: Get all bookings / reservations
router.get('/', async (req, res) => {
  try {
    const bookings = await Booking.find().populate('userId').populate('roomId');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a booking with validation (Prevent double booking)
router.post('/', async (req, res) => {
  try {
    const { userId, roomId, checkInDate, checkOutDate, guests, totalPrice } = req.body;
    
    // 1. Prevent Double Booking
    const overlappingBooking = await Booking.findOne({
      roomId,
      status: { $ne: 'Cancelled' },
      $or: [
        { checkInDate: { $lte: new Date(checkOutDate) }, checkOutDate: { $gte: new Date(checkInDate) } }
      ]
    });

    if (overlappingBooking) {
      return res.status(400).json({ message: 'Room is already booked for these dates.' });
    }

    // 2. Additional Status Check (Safety Layer)
    const room = await Room.findById(roomId);
    if (room && room.status !== 'Available') {
      return res.status(400).json({ message: 'This room is currently occupied or already reserved.' });
    }

    const newBooking = new Booking({
      userId, roomId, checkInDate: new Date(checkInDate), checkOutDate: new Date(checkOutDate), guests, totalPrice
    });

    await newBooking.save();

    // NEW: Update room status to 'Booked' immediately upon creation
    console.log(`Booking created for room ${roomId}. Updating status to Booked...`);
    await Room.findByIdAndUpdate(roomId, { status: 'Booked' });

    res.status(201).json({ message: 'Booking successful', booking: newBooking });
  } catch (error) {
    console.error("Booking Creation Error:", error);
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update Booking (Stay handling: Check-in / Check-out)
router.put('/:id', async (req, res) => {
  try {
    const { status } = req.body;
    const booking = await Booking.findById(req.params.id);
    
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    // Real-time Room Status Management with robust error handling
    if (status === 'Checked-in') {
      console.log(`Checking in guest to room: ${booking.roomId}`);
      await Room.updateOne({ _id: booking.roomId }, { status: 'Occupied' });
    } else if (status === 'Confirmed') {
      console.log(`Confirming booking for room: ${booking.roomId}`);
      await Room.updateOne({ _id: booking.roomId }, { status: 'Booked' });
    } else if (status === 'Checked-out' || status === 'Cancelled') {
      console.log(`Releasing room: ${booking.roomId}`);
      await Room.updateOne({ _id: booking.roomId }, { status: 'Available' });
    }

    // Loyalty Tracking Logic: When checked out, add points
    if (status === 'Checked-out' && booking.status !== 'Checked-out') {
      const user = await User.findById(booking.userId);
      if (user) {
        user.loyaltyPoints += 10; // Simple logic: 10 points per stay
        await user.save();
      }
    }

    const updatedBooking = await Booking.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updatedBooking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Cancel / Delete Booking
router.delete('/:id', async (req, res) => {
  try {
    await Booking.findByIdAndDelete(req.params.id);
    res.json({ message: 'Reservation removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
