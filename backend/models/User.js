const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  age: { type: Number, default: 18 }, // For child detection
  loyaltyPoints: { type: Number, default: 0 },
  role: { type: String, enum: ['admin', 'staff', 'guest'], default: 'guest' },
  guestType: { type: String, enum: ['Local', 'Foreign'], default: 'Local' }
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
