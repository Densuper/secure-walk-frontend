const { db } = require('../database');

const recordScan = async (req, res) => {
    const { qr_code_identifier } = req.body;
    const userId = req.user.userId; // Extracted from token by verifyToken middleware

    if (!qr_code_identifier) {
        return res.status(400).json({ message: 'QR code identifier is required.' });
    }

    // Find the checkpoint
    const checkpointSql = "SELECT id, name, description FROM Checkpoints WHERE qr_code_identifier = ?";
    db.get(checkpointSql, [qr_code_identifier], (err, checkpoint) => {
        if (err) {
            console.error("Database error finding checkpoint:", err.message);
            return res.status(500).json({ message: 'Error processing scan. Please try again later.' });
        }
        if (!checkpoint) {
            return res.status(404).json({ message: 'Invalid QR Code. Checkpoint not found.' });
        }

        // Record the scan
        const insertScanSql = "INSERT INTO Scans (user_id, checkpoint_id, timestamp) VALUES (?, ?, datetime('now'))";
        db.run(insertScanSql, [userId, checkpoint.id], function(err) { // Use function to get this.lastID
            if (err) {
                console.error("Database error recording scan:", err.message);
                return res.status(500).json({ message: 'Error saving scan data. Please try again later.' });
            }
            res.status(201).json({ 
                message: 'Checkpoint scanned successfully', 
                scanId: this.lastID,
                checkpoint: {
                    id: checkpoint.id,
                    name: checkpoint.name,
                    qr_code_identifier: qr_code_identifier,
                    description: checkpoint.description
                },
                userId: userId,
                timestamp: new Date().toISOString() // Provide a consistent timestamp format
            });
        });
    });
};

module.exports = {
    recordScan
};
