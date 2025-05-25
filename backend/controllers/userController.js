const { db } = require('../database');

const getUserDashboardData = async (req, res) => {
    const userId = req.user.userId; // Extracted from token by verifyToken middleware

    if (!userId) {
        return res.status(400).json({ message: 'User ID not found in token.' });
    }

    const sql = `
        SELECT 
            S.id as scan_id,
            S.timestamp as scan_timestamp,
            C.id as checkpoint_id,
            C.name as checkpoint_name,
            C.qr_code_identifier,
            C.description as checkpoint_description
        FROM Scans S
        JOIN Checkpoints C ON S.checkpoint_id = C.id
        WHERE S.user_id = ?
        ORDER BY S.timestamp DESC
        LIMIT 5
    `;

    db.all(sql, [userId], (err, rows) => {
        if (err) {
            console.error("Database error fetching user dashboard data:", err.message);
            return res.status(500).json({ message: 'Error fetching dashboard data. Please try again later.' });
        }
        if (!rows || rows.length === 0) {
            return res.status(200).json({ scans: [], message: 'No scans found for this user.' });
        }
        res.status(200).json({ scans: rows });
    });
};

module.exports = {
    getUserDashboardData
};
