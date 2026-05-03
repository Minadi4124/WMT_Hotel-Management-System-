const mongoose = require('mongoose');

const staffSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  role: { type: String, enum: ['Housekeeping', 'Chef', 'Security'], required: true },
  phoneNumber: { type: String, required: true },
  email: { type: String, required: true },
  tasks: [{ type: String }],
  assignedRoomId: { type: mongoose.Schema.Types.ObjectId, ref: 'Room' }
}, { timestamps: true });

module.exports = mongoose.model('Staff', staffSchema);
