const { db } = require('../database');

// List all checkpoints
const listCheckpoints = (req, res) => {
    const sql = "SELECT id, name, qr_code_identifier, description FROM Checkpoints";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Database error listing checkpoints:", err.message);
            return res.status(500).json({ message: "Error fetching checkpoints." });
        }
        res.json({ checkpoints: rows });
    });
};

// Create a new checkpoint
const createCheckpoint = (req, res) => {
    const { name, qr_code_identifier, description } = req.body;

    if (!name || !qr_code_identifier) {
        return res.status(400).json({ message: "Name and QR Code Identifier are required." });
    }

    const sql = "INSERT INTO Checkpoints (name, qr_code_identifier, description) VALUES (?, ?, ?)";
    db.run(sql, [name, qr_code_identifier, description || null], function(err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed: Checkpoints.qr_code_identifier")) {
                return res.status(409).json({ message: "QR Code Identifier already exists." });
            }
            console.error("Database error creating checkpoint:", err.message);
            return res.status(500).json({ message: "Error creating checkpoint." });
        }
        res.status(201).json({ id: this.lastID, name, qr_code_identifier, description });
    });
};

// Get a single checkpoint by ID
const getCheckpointById = (req, res) => {
    const { checkpointId } = req.params;
    const sql = "SELECT id, name, qr_code_identifier, description FROM Checkpoints WHERE id = ?";
    db.get(sql, [checkpointId], (err, row) => {
        if (err) {
            console.error("Database error fetching checkpoint:", err.message);
            return res.status(500).json({ message: "Error fetching checkpoint." });
        }
        if (!row) {
            return res.status(404).json({ message: "Checkpoint not found." });
        }
        res.json({ checkpoint: row });
    });
};

// Update a checkpoint
const updateCheckpoint = (req, res) => {
    const { checkpointId } = req.params;
    const { name, qr_code_identifier, description } = req.body;

    if (!name && !qr_code_identifier && description === undefined) { // description can be null, so check for undefined
        return res.status(400).json({ message: "No fields provided for update." });
    }

    let sql = "UPDATE Checkpoints SET ";
    const params = [];
    if (name) {
        sql += "name = ?, ";
        params.push(name);
    }
    if (qr_code_identifier) {
        sql += "qr_code_identifier = ?, ";
        params.push(qr_code_identifier);
    }
    if (description !== undefined) {
        sql += "description = ?, ";
        params.push(description);
    }

    sql = sql.slice(0, -2); // Remove trailing comma and space
    sql += " WHERE id = ?";
    params.push(checkpointId);

    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed: Checkpoints.qr_code_identifier")) {
                return res.status(409).json({ message: "QR Code Identifier already exists." });
            }
            console.error("Database error updating checkpoint:", err.message);
            return res.status(500).json({ message: "Error updating checkpoint." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Checkpoint not found or no changes made." });
        }
        // Fetch and return the updated checkpoint
        db.get("SELECT id, name, qr_code_identifier, description FROM Checkpoints WHERE id = ?", [checkpointId], (getErr, updatedCheckpoint) => {
            if (getErr) {
                 return res.status(500).json({ message: "Error fetching updated checkpoint details."});
            }
            res.json({ message: "Checkpoint updated successfully.", checkpoint: updatedCheckpoint });
        });
    });
};

// Delete a checkpoint
const deleteCheckpoint = (req, res) => {
    const { checkpointId } = req.params;
    // Before deleting a checkpoint, consider handling related scans (e.g., set checkpoint_id to NULL, or prevent deletion if scans exist)
    // For this example, we'll directly delete. Add cascading delete or checks as needed.
    const sql = "DELETE FROM Checkpoints WHERE id = ?";
    db.run(sql, [checkpointId], function(err) {
        if (err) {
            console.error("Database error deleting checkpoint:", err.message);
            return res.status(500).json({ message: "Error deleting checkpoint." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "Checkpoint not found." });
        }
        res.json({ message: "Checkpoint deleted successfully." });
    });
};

module.exports = {
    listCheckpoints,
    createCheckpoint,
    getCheckpointById,
    updateCheckpoint,
    deleteCheckpoint
};
