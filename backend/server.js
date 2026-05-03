require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log('MongoDB Connected ✅'))
  .catch(err => {
    console.log('----------------------------------------------------');
    console.log('❌ MONGODB CONNECTION ERROR!');
    console.log('Reason: ', err.message);
    if (err.message.includes('IP isn\'t whitelisted')) {
      console.log('TIP: Please go to MongoDB Atlas -> Network Access -> Add your Current IP.');
    } else {
      console.log('TIP: Ensure your MongoDB server is running.');
    }
    console.log('----------------------------------------------------');
    process.exit(1);
  });

// Simple Route
app.get('/', (req, res) => {
  res.send('Hotel Management API is running...');
});

const authRoutes = require('./routes/auth');
const roomRoutes = require('./routes/rooms');
const bookingRoutes = require('./routes/bookings');
const staffRoutes = require('./routes/staff');
const billingRoutes = require('./routes/billing');

app.use('/api/auth', authRoutes);
app.use('/api/rooms', roomRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/billing', billingRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
