require('dotenv').config();

const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;
let connectionPromise = null;

async function connectDB() {
  if (!MONGODB_URI) {
    throw new Error('Missing required environment variable: MONGODB_URI');
  }

  if (mongoose.connection.readyState === 1) {
    return mongoose.connection;
  }

  if (!connectionPromise) {
    connectionPromise = mongoose.connect(MONGODB_URI)
      .then((conn) => {
        console.log('MongoDB connected');
        return conn.connection;
      })
      .catch((err) => {
        connectionPromise = null;
        throw err;
      });
  }

  return connectionPromise;
}

module.exports = {
  connectDB,
  mongoose,
};
