const { db } = require('../database');
const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10; // Same as in database.js for consistency

// List all users
const listUsers = (req, res) => {
    const sql = "SELECT id, username, role FROM Users";
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error("Database error listing users:", err.message);
            return res.status(500).json({ message: "Error fetching users." });
        }
        res.json({ users: rows });
    });
};

// Create a new user
const createUser = async (req, res) => {
    const { username, password, role } = req.body;

    if (!username || !password || !role) {
        return res.status(400).json({ message: "Username, password, and role are required." });
    }
    if (role !== 'user' && role !== 'admin') {
        return res.status(400).json({ message: "Role must be 'user' or 'admin'." });
    }

    try {
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
        const sql = "INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)";
        db.run(sql, [username, hashedPassword, role], function(err) {
            if (err) {
                if (err.message.includes("UNIQUE constraint failed: Users.username")) {
                    return res.status(409).json({ message: "Username already exists." });
                }
                console.error("Database error creating user:", err.message);
                return res.status(500).json({ message: "Error creating user." });
            }
            res.status(201).json({ id: this.lastID, username, role });
        });
    } catch (error) {
        console.error("Error hashing password:", error);
        res.status(500).json({ message: "Error processing request." });
    }
};

// Get a single user by ID
const getUserById = (req, res) => {
    const { userId } = req.params;
    const sql = "SELECT id, username, role FROM Users WHERE id = ?";
    db.get(sql, [userId], (err, row) => {
        if (err) {
            console.error("Database error fetching user:", err.message);
            return res.status(500).json({ message: "Error fetching user." });
        }
        if (!row) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json({ user: row });
    });
};

// Update a user
const updateUser = async (req, res) => {
    const { userId } = req.params;
    const { username, role, password } = req.body; // Password is optional

    if (!username && !role && !password) {
        return res.status(400).json({ message: "No fields provided for update." });
    }
    if (role && role !== 'user' && role !== 'admin') {
        return res.status(400).json({ message: "Role must be 'user' or 'admin'." });
    }

    let sql = "UPDATE Users SET ";
    const params = [];
    if (username) {
        sql += "username = ?, ";
        params.push(username);
    }
    if (role) {
        sql += "role = ?, ";
        params.push(role);
    }
    if (password) {
        try {
            const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
            sql += "password_hash = ?, ";
            params.push(hashedPassword);
        } catch (error) {
            console.error("Error hashing new password:", error);
            return res.status(500).json({ message: "Error processing password update." });
        }
    }

    sql = sql.slice(0, -2); // Remove trailing comma and space
    sql += " WHERE id = ?";
    params.push(userId);

    db.run(sql, params, function(err) {
        if (err) {
            if (err.message.includes("UNIQUE constraint failed: Users.username")) {
                return res.status(409).json({ message: "Username already exists." });
            }
            console.error("Database error updating user:", err.message);
            return res.status(500).json({ message: "Error updating user." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "User not found or no changes made." });
        }
        // Fetch and return the updated user (excluding password hash)
        db.get("SELECT id, username, role FROM Users WHERE id = ?", [userId], (getErr, updatedUser) => {
            if (getErr) {
                 return res.status(500).json({ message: "Error fetching updated user details."});
            }
            res.json({ message: "User updated successfully.", user: updatedUser });
        });
    });
};

// Delete a user
const deleteUser = (req, res) => {
    const { userId } = req.params;
    const sql = "DELETE FROM Users WHERE id = ?";
    db.run(sql, [userId], function(err) {
        if (err) {
            console.error("Database error deleting user:", err.message);
            return res.status(500).json({ message: "Error deleting user." });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: "User not found." });
        }
        res.json({ message: "User deleted successfully." });
    });
};


module.exports = {
    listUsers,
    createUser,
    getUserById,
    updateUser,
    deleteUser
};
