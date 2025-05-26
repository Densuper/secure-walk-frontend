const express = require('express');
const router = express.Router();
const walkController = require('../controllers/walkController');
const { verifyToken } = require('../middleware/authMiddleware');

// Route to start a new walk
router.post('/walk/start', verifyToken, walkController.startWalk);

// Route to get the current active walk for a user
router.get('/walk/active', verifyToken, walkController.getActiveWalk);

// Route to get details of a specific walk
router.get('/walk/:id', verifyToken, walkController.getWalkDetails);

// Route to cancel a walk
router.post('/walk/:id/cancel', verifyToken, walkController.cancelWalk);

module.exports = router;
