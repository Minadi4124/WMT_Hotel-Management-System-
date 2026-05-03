const mongoose = require('mongoose');

const roomSchema = new mongoose.Schema({
  roomNumber: { type: String, required: true, unique: true },
  type: { type: String, required: true }, // e.g., Deluxe, Standard, Family
  localPrice: { type: Number, required: true },
  foreignPrice: { type: Number, required: true },
  capacity: { type: Number, required: true }, // Max guests
  facilities: [{ type: String }], // e.g., ["WiFi", "AC", "Pool"]
  image: { type: String },
  status: { type: String, enum: ['Available', 'Occupied', 'Booked', 'Out of Order', 'Repair'], default: 'Available' },
  discount: { type: Number, default: 0 },
  isPromotional: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Room', roomSchema);
