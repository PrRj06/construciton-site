require('dotenv').config();

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
const multer = require('multer');
const updateRoutes = require('./routes/routes');

const PUBLIC_DIR = path.join(__dirname, 'public');
const IS_VERCEL = process.env.VERCEL === '1';
const UPLOADS_DIR = IS_VERCEL
  ? path.join('/tmp', 'uploads')
  : path.join(PUBLIC_DIR, 'uploads');
// Vercel request payload limits are lower than local Express usage.
const MAX_UPLOAD_SIZE_BYTES = IS_VERCEL
  ? 4 * 1024 * 1024
  : 5 * 1024 * 1024;

function requireEnv(name) {
  const value = process.env[name];
  if (!value) {
    throw new Error('Missing required environment variable: ' + name);
  }
  return value;
}

function requireEnvAny(names) {
  for (const name of names) {
    const value = process.env[name];
    if (value) {
      return value;
    }
  }
  throw new Error('Missing required environment variable. Expected one of: ' + names.join(', '));
}

const CREDENTIALS = {
  constructor: {
    username: requireEnvAny(['CONSTRUCTOR_USERNAME', 'USER_USERNAME']),
    password: requireEnvAny(['CONSTRUCTOR_PASSWORD', 'USER_PASSWORD']),
    role: 'constructor',
  },
  contractor: {
    username: requireEnvAny(['CONTRACTOR_USERNAME', 'ADMIN_USERNAME']),
    password: requireEnvAny(['CONTRACTOR_PASSWORD', 'ADMIN_PASSWORD']),
    role: 'contractor',
  },
};

function ensureUploadsDir() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function createUploadMiddleware() {
  ensureUploadsDir();

  const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, UPLOADS_DIR);
    },
    filename: function (req, file, cb) {
      cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
    },
  });

  const fileFilter = function (req, file, cb) {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
      return;
    }
    cb(new Error('Only image files allowed'), false);
  };

  return multer({
    storage,
    fileFilter,
    limits: { fileSize: MAX_UPLOAD_SIZE_BYTES },
  });
}

function createLoginHandler(credentials) {
  return function loginHandler(req, res) {
    const { role, username, password } = req.body;
    const normalizedRole = role === 'user' ? 'constructor' : (role === 'admin' ? 'contractor' : role);

    if (!credentials[normalizedRole]) {
      res.status(400).json({ message: 'Invalid role.' });
      return;
    }

    const expected = credentials[normalizedRole];
    if (username === expected.username && password === expected.password) {
      res.status(200).json({ message: 'Login successful!', role: expected.role });
      return;
    }

    res.status(401).json({ message: 'Invalid username or password.' });
  };
}

function createApp() {
  const app = express();

  app.locals.upload = createUploadMiddleware();

  app.use(express.json());
  app.use(cors());
  app.use(express.static(PUBLIC_DIR));

  if (IS_VERCEL) {
    app.use('/uploads', express.static(UPLOADS_DIR));
  }

  app.get('/', (req, res) => res.redirect('/login.html'));
  app.post('/login', createLoginHandler(CREDENTIALS));
  app.use('/', updateRoutes);

  return app;
}

module.exports = {
  createApp,
};
