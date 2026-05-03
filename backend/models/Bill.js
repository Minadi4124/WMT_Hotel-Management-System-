const mongoose = require('mongoose');

const billSchema = new mongoose.Schema({
  bookingId: { type: mongoose.Schema.Types.ObjectId, ref: 'Booking', required: true },
  guestId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  originalPrice: { type: Number, required: true },
  discountAmount: { type: Number, default: 0 },
  extraCharges: { type: Number, default: 0 },
  extraChargesDescription: { type: String, default: '' },
  finalAmount: { type: Number, required: true },
  paymentStatus: { type: String, enum: ['Unpaid', 'Pending', 'Done'], default: 'Unpaid' },
  currency: { type: String, default: 'Rs' },
  paymentMethod: { type: String }, // e.g., 'Card', 'Cash'
  paymentDate: { type: Date },
  isVisibleToGuest: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Bill', billSchema);
