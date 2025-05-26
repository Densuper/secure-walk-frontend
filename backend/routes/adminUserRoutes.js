const express = require('express');
const router = express.Router();
const { listUsers, createUser, getUserById, updateUser, deleteUser } = require('../controllers/adminController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// Prefix for these routes will be /api/admin/users (defined in server.js)

// GET /api/admin/users/
router.get('/', verifyToken, isAdmin, listUsers);

// POST /api/admin/users/
router.post('/', verifyToken, isAdmin, createUser);

// GET /api/admin/users/:userId
router.get('/:userId', verifyToken, isAdmin, getUserById);

// PUT /api/admin/users/:userId
router.put('/:userId', verifyToken, isAdmin, updateUser);

// DELETE /api/admin/users/:userId
router.delete('/:userId', verifyToken, isAdmin, deleteUser);

module.exports = router;
