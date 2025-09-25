const express = require('express');
const router = express.Router();
const { listCheckpoints } = require('../controllers/checkpointController');
const { verifyToken } = require('../middleware/authMiddleware');

// Allow authenticated users to retrieve checkpoint metadata needed for patrol templates.
router.get('/', verifyToken, listCheckpoints);

module.exports = router;
