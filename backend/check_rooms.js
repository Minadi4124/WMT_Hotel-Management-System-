const mongoose = require('mongoose');
require('dotenv').config();
const Room = require('./models/Room');

async function check() {
  await mongoose.connect(process.env.MONGO_URI);
  const rooms = await Room.find({});
  console.log("Total Rooms in DB:", rooms.length);
  rooms.forEach(r => console.log(`- ${r.type}: ${r.status}`));
  process.exit(0);
}

check();
