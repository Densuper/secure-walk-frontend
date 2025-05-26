const express = require('express');
const router = express.Router();
const { getUserDashboardData } = require('../controllers/userController');
const { verifyToken } = require('../middleware/authMiddleware');

// GET /api/user/dashboard-data
// This route is protected and requires a valid token
router.get('/dashboard-data', verifyToken, getUserDashboardData);

module.exports = router;
