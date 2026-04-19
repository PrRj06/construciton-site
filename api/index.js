require('dotenv').config();

const { createApp } = require('../src/app');
const { connectDB } = require('../src/config/db');

const app = createApp();
const dbReady = connectDB();

module.exports = async (req, res) => {
  try {
    await dbReady;
    return app(req, res);
  } catch (err) {
    console.error('MongoDB connection error:', err.message);
    return res.status(500).json({ message: 'Database connection failed.' });
  }
};
