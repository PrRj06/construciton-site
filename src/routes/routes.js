// routes/updates.js
const express = require('express');
const router  = express.Router();
const updatesController = require('../controllers/updatesController');

// ── ROUTE 1: POST /add-update (with optional image) ──
// upload.single('photo') tells multer to handle one file with field name 'photo'
router.post('/add-update', updatesController.addUpdate);

// ── ROUTE 2: GET /updates ──
router.get('/updates', updatesController.getUpdates);

// ── ROUTE 3: DELETE /update/:id ──
router.delete('/update/:id', updatesController.deleteUpdate);

// ── ROUTE 4: PUT /update/:id (with optional new image) ──
router.put('/update/:id', updatesController.updateUpdate);

// ── ROUTE 5: GET /site-progress ──
// Returns latest progress for each unique site name
// Used by the Site-wise Progress Tracker section
router.get('/site-progress', updatesController.getSiteProgress);

module.exports = router;
