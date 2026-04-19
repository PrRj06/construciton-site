require('dotenv').config();

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function connectDB() {
  try {
    if (!MONGODB_URI) {
      throw new Error('Missing required environment variable: MONGODB_URI');
    }
    await mongoose.connect(MONGODB_URI);
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    process.exit(1);
  }
}

module.exports = {
  connectDB,
  mongoose,
};
