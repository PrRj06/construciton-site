require('dotenv').config();

const { createApp } = require('../src/app');
const { connectDB } = require('../src/config/db');

connectDB().catch((err) => {
  console.error('MongoDB connection error:', err.message);
});

module.exports = createApp();
