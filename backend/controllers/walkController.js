const { db } = require('../database');

// Helper function to get user_id and role from username
const getUserDetailsByUsername = (username) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT id, role FROM Users WHERE username = ?", [username], (err, row) => {
            if (err) {
                console.error("Error fetching user by username:", err.message);
                reject(err);
            } else {
                resolve(row); // Resolve with the full user object (id, role)
            }
        });
    });
};

// Helper function to get checkpoint_id from qr_code_identifier
const getCheckpointIdByQRCode = (qrCode) => {
    return new Promise((resolve, reject) => {
        db.get("SELECT id FROM Checkpoints WHERE qr_code_identifier = ?", [qrCode], (err, row) => {
            if (err) {
                console.error(`Error fetching checkpoint by QR code ${qrCode}:`, err.message);
                reject(err);
            } else {
                resolve(row ? row.id : null);
            }
        });
    });
};

exports.startWalk = async (req, res) => {
    const { username } = req.user;
    const { template_id, checkpoints } = req.body;

    try {
        const user = await getUserDetailsByUsername(username);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const userId = user.id;

        const sqlInsertWalk = `INSERT INTO Walks (user_id, template_id, start_time, status) VALUES (?, ?, CURRENT_TIMESTAMP, 'ongoing')`;
        
        const walkInsertResult = await new Promise((resolve, reject) => {
            db.run(sqlInsertWalk, [userId, template_id || null], function (err) {
                if (err) {
                    console.error("Error inserting walk:", err.message);
                    reject(err);
                } else {
                    resolve({ id: this.lastID });
                }
            });
        });
        
        const walkId = walkInsertResult.id;

        if (checkpoints && checkpoints.length > 0) {
            const sqlInsertWalkCheckpoint = `INSERT INTO WalkCheckpoints (walk_id, checkpoint_id, status) VALUES (?, ?, 'pending')`;
            for (const qrCode of checkpoints) {
                const checkpointId = await getCheckpointIdByQRCode(qrCode);
                if (checkpointId) {
                    await new Promise((resolve, reject) => {
                        db.run(sqlInsertWalkCheckpoint, [walkId, checkpointId], function(err) {
                            if (err) {
                                console.error(`Error inserting walk checkpoint for QR ${qrCode}:`, err.message);
                                reject(err); 
                            } else {
                                resolve({ id: this.lastID });
                            }
                        });
                    });
                } else {
                    console.warn(`Checkpoint with QR code ${qrCode} not found. Skipping.`);
                }
            }
        }

        const newWalk = await new Promise((resolve, reject) => {
            db.get("SELECT * FROM Walks WHERE id = ?", [walkId], (err, row) => {
                if (err) reject(err);
                else resolve(row);
            });
        });

        res.status(201).json({
            message: 'Walk started successfully',
            walk_id: walkId,
            status: 'ongoing',
            walk_details: newWalk 
        });

    } catch (error) {
        console.error("Error in startWalk:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to start walk due to a server error." });
        }
    }
};

exports.getActiveWalk = async (req, res) => {
    const { username } = req.user;

    try {
        const user = await getUserDetailsByUsername(username);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const userId = user.id;

        const sqlGetActiveWalk = `
            SELECT * FROM Walks 
            WHERE user_id = ? AND status = 'ongoing' 
            ORDER BY start_time DESC 
            LIMIT 1`;
        
        const activeWalk = await new Promise((resolve, reject) => {
            db.get(sqlGetActiveWalk, [userId], (err, row) => {
                if (err) {
                    console.error("Error fetching active walk:", err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (activeWalk) {
            const sqlGetWalkCheckpoints = `
                SELECT wc.*, c.qr_code_identifier, c.name 
                FROM WalkCheckpoints wc
                JOIN Checkpoints c ON wc.checkpoint_id = c.id
                WHERE wc.walk_id = ?
                ORDER BY wc.id ASC`;

            const walkCheckpoints = await new Promise((resolve, reject) => {
                db.all(sqlGetWalkCheckpoints, [activeWalk.id], (err, rows) => {
                    if (err) {
                        console.error("Error fetching walk checkpoints for active walk:", err.message);
                        reject(err);
                    } else {
                        resolve(rows);
                    }
                });
            });
            
            res.status(200).json({ active_walk: { ...activeWalk, checkpoints: walkCheckpoints } });
        } else {
            res.status(200).json({ active_walk: null, message: 'No active walk found.' });
        }

    } catch (error) {
        console.error("Error in getActiveWalk:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to get active walk due to a server error." });
        }
    }
};

exports.getWalkDetails = async (req, res) => {
    const { username } = req.user;
    const { id: walkIdParam } = req.params;
    const walkId = parseInt(walkIdParam, 10);

    if (isNaN(walkId)) {
        return res.status(400).json({ message: "Invalid Walk ID format." });
    }

    try {
        const user = await getUserDetailsByUsername(username);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const userId = user.id;
        const userRole = user.role;

        const sqlGetWalk = `SELECT * FROM Walks WHERE id = ?`;
        const walk = await new Promise((resolve, reject) => {
            db.get(sqlGetWalk, [walkId], (err, row) => {
                if (err) {
                    console.error("Error fetching walk details:", err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (!walk) {
            return res.status(404).json({ message: "Walk not found." });
        }

        if (walk.user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ message: "Forbidden. You are not authorized to view this walk." });
        }

        const sqlGetWalkCheckpoints = `
            SELECT wc.*, c.qr_code_identifier, c.name 
            FROM WalkCheckpoints wc
            JOIN Checkpoints c ON wc.checkpoint_id = c.id
            WHERE wc.walk_id = ?
            ORDER BY wc.id ASC`;

        const walkCheckpoints = await new Promise((resolve, reject) => {
            db.all(sqlGetWalkCheckpoints, [walkId], (err, rows) => {
                if (err) {
                    console.error("Error fetching walk checkpoints for walk details:", err.message);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });

        res.status(200).json({ walk_details: { ...walk, checkpoints: walkCheckpoints } });

    } catch (error) {
        console.error("Error in getWalkDetails:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to get walk details due to a server error." });
        }
    }
};

exports.cancelWalk = async (req, res) => {
    const { username } = req.user;
    const { id: walkIdParam } = req.params;
    const { cancellationReason } = req.body;
    const walkId = parseInt(walkIdParam, 10);

    if (isNaN(walkId)) {
        return res.status(400).json({ message: "Invalid Walk ID format." });
    }

    const reason = cancellationReason || "Cancelled by user";

    try {
        const user = await getUserDetailsByUsername(username);
        if (!user) {
            return res.status(404).json({ message: "User not found." });
        }
        const userId = user.id;
        const userRole = user.role;

        const sqlGetWalk = `SELECT * FROM Walks WHERE id = ?`;
        const walk = await new Promise((resolve, reject) => {
            db.get(sqlGetWalk, [walkId], (err, row) => {
                if (err) {
                    console.error("Error fetching walk for cancellation:", err.message);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        });

        if (!walk) {
            return res.status(404).json({ message: "Walk not found." });
        }

        if (walk.user_id !== userId && userRole !== 'admin') {
            return res.status(403).json({ message: "Forbidden. You are not authorized to cancel this walk." });
        }

        if (walk.status === 'completed' || walk.status === 'cancelled') {
            return res.status(400).json({ message: `Walk is already ${walk.status} and cannot be cancelled.` });
        }

        const sqlUpdateWalk = `
            UPDATE Walks 
            SET status = 'cancelled', end_time = CURRENT_TIMESTAMP, cancellation_reason = ?
            WHERE id = ?`;
        
        await new Promise((resolve, reject) => {
            db.run(sqlUpdateWalk, [reason, walkId], function(err) {
                if (err) {
                    console.error("Error updating walk status to cancelled:", err.message);
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });

        const sqlUpdateWalkCheckpoints = `
            UPDATE WalkCheckpoints 
            SET status = 'cancelled_walk' 
            WHERE walk_id = ? AND status = 'pending'`;

        await new Promise((resolve, reject) => {
            db.run(sqlUpdateWalkCheckpoints, [walkId], function(err) {
                if (err) {
                    console.error("Error updating walk checkpoints to cancelled_walk:", err.message);
                    reject(err);
                } else {
                    resolve({ changes: this.changes });
                }
            });
        });
        
        const updatedWalk = await new Promise((resolve, reject) => {
            db.get(sqlGetWalk, [walkId], (err, row) => { // Re-fetch the walk to get updated details
                if (err) reject(err);
                else resolve(row);
            });
        });
        
        // Fetch updated checkpoints as well
        const sqlGetWalkCheckpoints = `
            SELECT wc.*, c.qr_code_identifier, c.name 
            FROM WalkCheckpoints wc
            JOIN Checkpoints c ON wc.checkpoint_id = c.id
            WHERE wc.walk_id = ?
            ORDER BY wc.id ASC`;

        const walkCheckpoints = await new Promise((resolve, reject) => {
            db.all(sqlGetWalkCheckpoints, [walkId], (err, rows) => {
                if (err) reject(err);
                else resolve(rows);
            });
        });

        res.status(200).json({ 
            message: 'Walk cancelled successfully', 
            walk_details: { ...updatedWalk, checkpoints: walkCheckpoints }
        });

    } catch (error) {
        console.error("Error in cancelWalk:", error.message);
        if (!res.headersSent) {
            res.status(500).json({ message: "Failed to cancel walk due to a server error." });
        }
    }
};
