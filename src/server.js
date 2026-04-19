require('dotenv').config();

const { connectDB } = require('./config/db');
const { createApp } = require('./app');

function getPort() {
  const port = Number(process.env.PORT);
  if (Number.isNaN(port) || port <= 0) {
    throw new Error('Missing or invalid environment variable: PORT');
  }
  return port;
}

const PORT = getPort();

async function startServer() {
  const app = createApp();

  await connectDB();

  app.listen(PORT, () => {
    console.log(`Running at http://localhost:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Server startup error:', err.message);
  process.exit(1);
});
