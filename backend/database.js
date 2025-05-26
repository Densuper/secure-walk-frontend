const sqlite3 = require('sqlite3').verbose();
const DBSOURCE = "securewalkways.db";

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    } else {
        console.log('Connected to the SQLite database.')
    }
});

const initializeDB = () => {
    db.serialize(() => {
        // Create Users table
        db.run(`CREATE TABLE IF NOT EXISTS Users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            role TEXT NOT NULL CHECK(role IN ('admin', 'user'))
        )`, (err) => {
            if (err) {
                console.error("Error creating Users table:", err.message);
            } else {
                console.log("Users table created or already exists.");
            }
        });

        // Create Walks table
        db.run(`CREATE TABLE IF NOT EXISTS Walks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            template_id TEXT,
            start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            end_time DATETIME,
            status TEXT NOT NULL CHECK(status IN ('ongoing', 'completed', 'cancelled')),
            cancellation_reason TEXT,
            FOREIGN KEY (user_id) REFERENCES Users(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating Walks table:", err.message);
            } else {
                console.log("Walks table created or already exists.");
            }
        });

        // Create WalkCheckpoints table
        db.run(`CREATE TABLE IF NOT EXISTS WalkCheckpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            walk_id INTEGER NOT NULL,
            checkpoint_id INTEGER NOT NULL,
            expected_at DATETIME,
            scanned_at DATETIME,
            status TEXT NOT NULL CHECK(status IN ('pending', 'scanned', 'missed', 'unable_to_scan', 'cancelled_walk')),
            FOREIGN KEY (walk_id) REFERENCES Walks(id),
            FOREIGN KEY (checkpoint_id) REFERENCES Checkpoints(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating WalkCheckpoints table:", err.message);
            } else {
                console.log("WalkCheckpoints table created or already exists.");
            }
        });

        // Create Checkpoints table
        db.run(`CREATE TABLE IF NOT EXISTS Checkpoints (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            qr_code_identifier TEXT UNIQUE NOT NULL,
            description TEXT
        )`, (err) => {
            if (err) {
                console.error("Error creating Checkpoints table:", err.message);
            } else {
                console.log("Checkpoints table created or already exists.");
            }
        });

        // Create Scans table
        db.run(`CREATE TABLE IF NOT EXISTS Scans (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            checkpoint_id INTEGER NOT NULL,
            timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (user_id) REFERENCES Users(id),
            FOREIGN KEY (checkpoint_id) REFERENCES Checkpoints(id)
        )`, (err) => {
            if (err) {
                console.error("Error creating Scans table:", err.message);
            } else {
                console.log("Scans table created or already exists.");
            }
        });

        // Call populateInitialData which includes users and checkpoints
        populateInitialData();
    });
};

const bcrypt = require('bcrypt');
const SALT_ROUNDS = 10;

// Function to populate initial users and checkpoints
const populateInitialData = () => {
    db.serialize(() => { // Use db.serialize to ensure order within this function
        // Populate users
        const users = [
            { username: 'testuser', password: 'password123', role: 'user' },
            { username: 'adminuser', password: 'adminpass123', role: 'admin' }
        ];
        const insertUserStmt = db.prepare("INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)");
        users.forEach(user => {
            db.get("SELECT username FROM Users WHERE username = ?", [user.username], (err, row) => {
                if (err) { console.error(`Error checking for user ${user.username}:`, err.message); return; }
                if (!row) {
                    bcrypt.hash(user.password, SALT_ROUNDS, (hashErr, hashedPassword) => {
                        if (hashErr) { console.error(`Error hashing password for ${user.username}:`, hashErr.message); return; }
                        insertUserStmt.run(user.username, hashedPassword, user.role, function(runErr) {
                            if (runErr) { console.error(`Error inserting user ${user.username}:`, runErr.message); }
                            else { console.log(`User ${user.username} created with ID ${this.lastID}.`); }
                        });
                    });
                } else {
                    console.log(`User ${user.username} already exists.`);
                }
            });
        });
        // insertUserStmt.finalize(); // Not finalizing due to async nature

        // Populate checkpoints
        const checkpoints = [
            { name: "Main Gate", qr_code_identifier: "CP001", description: "Main entrance checkpoint" },
            { name: "Corridor A", qr_code_identifier: "CP002", description: "North corridor checkpoint" },
            { name: "Library Entrance", qr_code_identifier: "CP003", description: "Entry to the library" }
        ];
        const insertCheckpointStmt = db.prepare("INSERT INTO Checkpoints (name, qr_code_identifier, description) VALUES (?, ?, ?)");
        checkpoints.forEach(cp => {
            db.get("SELECT qr_code_identifier FROM Checkpoints WHERE qr_code_identifier = ?", [cp.qr_code_identifier], (err, row) => {
                if (err) { console.error(`Error checking for checkpoint ${cp.qr_code_identifier}:`, err.message); return; }
                if (!row) {
                    insertCheckpointStmt.run(cp.name, cp.qr_code_identifier, cp.description, function(runErr) {
                        if (runErr) { console.error(`Error inserting checkpoint ${cp.name}:`, runErr.message); }
                        else { console.log(`Checkpoint ${cp.name} created with ID ${this.lastID}.`); }
                    });
                } else {
                    console.log(`Checkpoint ${cp.name} (${cp.qr_code_identifier}) already exists.`);
                }
            });
        });
        // insertCheckpointStmt.finalize(); // Not finalizing due to async nature
    });
};

module.exports = {
    db,
    initializeDB
};
