const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room', required: true },
  checkInDate: { type: Date, required: true },
  checkOutDate: { type: Date, required: true },
  guests: {
    adults: { type: Number, default: 1 },
    children: { type: Number, default: 0 }
  },
  totalPrice: { type: Number, required: true },
  status: { type: String, enum: ['Pending', 'Confirmed', 'Checked-in', 'Checked-out', 'Cancelled'], default: 'Pending' }
}, { timestamps: true });

module.exports = mongoose.model('Booking', bookingSchema);
