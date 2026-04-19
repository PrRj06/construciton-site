// server.js
require('dotenv').config();

const express  = require('express');
const cors     = require('cors');
const path     = require('path');
const multer   = require('multer'); // For handling file uploads
const { connectDB } = require('./config/db');

const app  = express();
const PORT = Number(process.env.PORT);

if (Number.isNaN(PORT) || PORT <= 0) {
  throw new Error('Missing or invalid environment variable: PORT');
}

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error('Missing required environment variable: ' + name);
  }
  return value;
}

const CREDENTIALS = {
  user: {
    username: requireEnv('USER_USERNAME'),
    password: requireEnv('USER_PASSWORD'),
    role: 'user',
  },
  admin: {
    username: requireEnv('ADMIN_USERNAME'),
    password: requireEnv('ADMIN_PASSWORD'),
    role: 'admin',
  },
};

// ── MULTER SETUP ──
// Multer handles multipart/form-data (file uploads)
// diskStorage lets us control where and how files are saved
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // Save uploaded files to public/uploads/ so they're accessible from browser
    cb(null, path.join(__dirname, 'public/uploads'));
  },
  filename: function (req, file, cb) {
    // Give each file a unique name: timestamp + original name
    // e.g. "1700000000000-site-photo.jpg"
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

// Only allow image files
const fileFilter = function (req, file, cb) {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);  // Accept
  } else {
    cb(new Error('Only image files allowed'), false); // Reject
  }
};

// Export multer instance so routes can use it
// limits: 5MB max file size
const upload = multer({ storage, fileFilter, limits: { fileSize: 5 * 1024 * 1024 } });
app.locals.upload = upload; // Make available to routes via app.locals

// ── MIDDLEWARE ──
app.use(express.json());
app.use(cors());
app.use(express.static(path.join(__dirname, 'public')));

// ── ROOT REDIRECT ──
app.get('/', (req, res) => res.redirect('/login.html'));

// ── LOGIN ROUTE ──
app.post('/login', (req, res) => {
  const { role, username, password } = req.body;
  if (!CREDENTIALS[role]) return res.status(400).json({ message: 'Invalid role.' });
  const expected = CREDENTIALS[role];
  if (username === expected.username && password === expected.password) {
    res.status(200).json({ message: 'Login successful!', role: expected.role });
  } else {
    res.status(401).json({ message: 'Invalid username or password.' });
  }
});

// ── MONGODB ──
connectDB();

// ── API ROUTES ──
const updateRoutes = require('./routes/routes');
app.use('/', updateRoutes);

// ── START ──
app.listen(PORT, () => console.log(`🚀 Running at http://localhost:${PORT}`));
