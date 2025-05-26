const express = require('express');
const router = express.Router();
const { loginUser, loginAdmin } = require('../controllers/authController');

// POST /api/login
router.post('/login', loginUser);

// POST /api/admin/login
router.post('/admin/login', loginAdmin);

module.exports = router;
