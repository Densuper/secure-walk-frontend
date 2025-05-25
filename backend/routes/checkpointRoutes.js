const express = require('express');
const router = express.Router();
const { 
    listCheckpoints, 
    createCheckpoint, 
    getCheckpointById, 
    updateCheckpoint, 
    deleteCheckpoint 
} = require('../controllers/checkpointController');
const { verifyToken } = require('../middleware/authMiddleware');
const { isAdmin } = require('../middleware/adminMiddleware');

// Prefix for these routes will be /api/admin/checkpoints (defined in server.js)

// GET / - List all checkpoints
router.get('/', verifyToken, isAdmin, listCheckpoints);

// POST / - Create a new checkpoint
router.post('/', verifyToken, isAdmin, createCheckpoint);

// GET /:checkpointId - Get a single checkpoint by ID
router.get('/:checkpointId', verifyToken, isAdmin, getCheckpointById);

// PUT /:checkpointId - Update a checkpoint by ID
router.put('/:checkpointId', verifyToken, isAdmin, updateCheckpoint);

// DELETE /:checkpointId - Delete a checkpoint by ID
router.delete('/:checkpointId', verifyToken, isAdmin, deleteCheckpoint);

module.exports = router;
