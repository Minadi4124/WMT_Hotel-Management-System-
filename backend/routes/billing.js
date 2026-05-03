const express = require('express');
const router = express.Router();
const Bill = require('../models/Bill');
const Booking = require('../models/Booking');
const User = require('../models/User');
const Room = require('../models/Room');

// Admin: Get all bills
router.get('/', async (req, res) => {
  try {
    const bills = await Bill.find().populate('guestId').populate({
      path: 'bookingId',
      populate: { path: 'roomId' }
    });
    res.json(bills);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Generate Bill for a booking
router.post('/generate/:bookingId', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.bookingId).populate('userId').populate('roomId');
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    const user = booking.userId;
    const room = booking.roomId;
    
    let originalPrice = room.localPrice;
    let currency = 'Rs';

    if (user.guestType === 'Foreign') {
      originalPrice = room.foreignPrice;
      currency = '$';
    }

    let discount = 0;
    if (user.age <= 12) discount += originalPrice * 0.2;

    const checkIn = new Date(booking.checkInDate);
    const day = checkIn.getDay();
    if (day === 0 || day === 5 || day === 6) discount += originalPrice * 0.1;

    const finalAmount = originalPrice - discount;

    const newBill = new Bill({
      bookingId: booking._id,
      guestId: user._id,
      originalPrice,
      discountAmount: discount,
      finalAmount,
      currency,
      isVisibleToGuest: false
    });

    await newBill.save();
    res.status(201).json(newBill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Mark as Done (Payment Confirmed)
router.put('/:id/pay', async (req, res) => {
  try {
    const bill = await Bill.findByIdAndUpdate(req.params.id, { 
      paymentStatus: 'Done',
      paymentDate: new Date()
    }, { new: true });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Guest: Mark as Pending (Payment Proof Uploaded/Confirmed by Guest)
router.put('/:id/guest-pay', async (req, res) => {
  try {
    const bill = await Bill.findById(req.params.id);
    if (!bill) {
      return res.status(404).json({ message: 'Bill not found' });
    }
    
    const { paymentMethod } = req.body;
    bill.paymentStatus = 'Pending';
    bill.paymentMethod = paymentMethod || 'Online Card';
    bill.paymentDate = new Date();
    await bill.save();
    
    res.json(bill);
  } catch (error) {
    console.error("Payment Error:", error);
    res.status(500).json({ message: 'Internal Server Error. Please check if the Bill ID is valid.' });
  }
});

// Admin: Toggle visibility for guest
router.put('/:id/visibility', async (req, res) => {
  try {
    const { isVisible } = req.body;
    const bill = await Bill.findByIdAndUpdate(req.params.id, { 
      isVisibleToGuest: isVisible 
    }, { new: true });
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Add extra charges
router.put('/:id/extra', async (req, res) => {
  try {
    const { amount, description } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    bill.extraCharges = Number(amount);
    bill.extraChargesDescription = description;
    // Recalculate final amount: original - discount + extra
    bill.finalAmount = bill.originalPrice - bill.discountAmount + bill.extraCharges;
    
    await bill.save();
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Update full bill
router.put('/:id', async (req, res) => {
  try {
    const { originalPrice, discountAmount, extraCharges, extraChargesDescription, paymentStatus } = req.body;
    const bill = await Bill.findById(req.params.id);
    if (!bill) return res.status(404).json({ message: 'Bill not found' });

    if (originalPrice !== undefined) bill.originalPrice = originalPrice;
    if (discountAmount !== undefined) bill.discountAmount = discountAmount;
    if (extraCharges !== undefined) bill.extraCharges = extraCharges;
    if (extraChargesDescription !== undefined) bill.extraChargesDescription = extraChargesDescription;
    if (paymentStatus !== undefined) bill.paymentStatus = paymentStatus;

    bill.finalAmount = bill.originalPrice - bill.discountAmount + bill.extraCharges;
    
    await bill.save();
    res.json(bill);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Admin: Delete bill
router.delete('/:id', async (req, res) => {
  try {
    await Bill.findByIdAndDelete(req.params.id);
    res.json({ message: 'Bill removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
