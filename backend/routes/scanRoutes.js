const express = require('express');
const router = express.Router();
const { recordScan } = require('../controllers/scanController');
const { verifyToken } = require('../middleware/authMiddleware');

// POST /api/scan
// This route is protected and requires a valid token
router.post('/scan', verifyToken, recordScan);

module.exports = router;
