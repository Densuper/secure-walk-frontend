const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const bcrypt = require('bcrypt');

// Resolve the database path relative to this file so it lives in the backend folder
const DBSOURCE = path.join(__dirname, 'securewalkways.db');

let db = new sqlite3.Database(DBSOURCE, (err) => {
    if (err) {
      // Cannot open database
      console.error(err.message)
      throw err
    } else {
        console.log('Connected to the SQLite database.')
    }
});

const runAsync = (sql, params = []) => (
    new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) {
                reject(err);
            } else {
                resolve(this);
            }
        });
    })
);

const getAsync = (sql, params = []) => (
    new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
            if (err) {
                reject(err);
            } else {
                resolve(row);
            }
        });
    })
);

const createTables = async () => {
    await runAsync(`CREATE TABLE IF NOT EXISTS Users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        password_hash TEXT NOT NULL,
        role TEXT NOT NULL CHECK(role IN ('admin', 'user'))
    )`);

    console.log("Users table created or already exists.");

    await runAsync(`CREATE TABLE IF NOT EXISTS Walks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        template_id TEXT,
        start_time DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        end_time DATETIME,
        status TEXT NOT NULL CHECK(status IN ('ongoing', 'completed', 'cancelled')),
        cancellation_reason TEXT,
        FOREIGN KEY (user_id) REFERENCES Users(id)
    )`);

    console.log("Walks table created or already exists.");

    await runAsync(`CREATE TABLE IF NOT EXISTS WalkCheckpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        walk_id INTEGER NOT NULL,
        checkpoint_id INTEGER NOT NULL,
        expected_at DATETIME,
        scanned_at DATETIME,
        status TEXT NOT NULL CHECK(status IN ('pending', 'scanned', 'missed', 'unable_to_scan', 'cancelled_walk')),
        FOREIGN KEY (walk_id) REFERENCES Walks(id),
        FOREIGN KEY (checkpoint_id) REFERENCES Checkpoints(id)
    )`);

    console.log("WalkCheckpoints table created or already exists.");

    await runAsync(`CREATE TABLE IF NOT EXISTS Checkpoints (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        qr_code_identifier TEXT UNIQUE NOT NULL,
        description TEXT
    )`);

    console.log("Checkpoints table created or already exists.");

    await runAsync(`CREATE TABLE IF NOT EXISTS Scans (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        checkpoint_id INTEGER NOT NULL,
        timestamp DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (user_id) REFERENCES Users(id),
        FOREIGN KEY (checkpoint_id) REFERENCES Checkpoints(id)
    )`);

    console.log("Scans table created or already exists.");
};

const SALT_ROUNDS = 10;

// Function to populate initial users and checkpoints
const populateInitialData = async () => {
    const users = [
        { username: 'testuser', password: 'password123', role: 'user' },
        { username: 'adminuser', password: 'adminpass123', role: 'admin' }
    ];

    for (const user of users) {
        const existing = await getAsync("SELECT username FROM Users WHERE username = ?", [user.username]);
        if (!existing) {
            const hashedPassword = bcrypt.hashSync(user.password, SALT_ROUNDS);
            const result = await runAsync("INSERT INTO Users (username, password_hash, role) VALUES (?, ?, ?)", [user.username, hashedPassword, user.role]);
            console.log(`User ${user.username} created with ID ${result.lastID}.`);
        } else {
            console.log(`User ${user.username} already exists.`);
        }
    }

    const checkpoints = [
        { name: "Main Gate", qr_code_identifier: "CP001", description: "Main entrance checkpoint" },
        { name: "Corridor A", qr_code_identifier: "CP002", description: "North corridor checkpoint" },
        { name: "Library Entrance", qr_code_identifier: "CP003", description: "Entry to the library" }
    ];

    for (const checkpoint of checkpoints) {
        const existing = await getAsync("SELECT qr_code_identifier FROM Checkpoints WHERE qr_code_identifier = ?", [checkpoint.qr_code_identifier]);
        if (!existing) {
            const result = await runAsync("INSERT INTO Checkpoints (name, qr_code_identifier, description) VALUES (?, ?, ?)", [checkpoint.name, checkpoint.qr_code_identifier, checkpoint.description]);
            console.log(`Checkpoint ${checkpoint.name} created with ID ${result.lastID}.`);
        } else {
            console.log(`Checkpoint ${checkpoint.name} (${checkpoint.qr_code_identifier}) already exists.`);
        }
    }
};

let initializationPromise;

const initializeDB = () => {
    if (!initializationPromise) {
        initializationPromise = (async () => {
            await createTables();
            await populateInitialData();
        })();
    }

    return initializationPromise;
};

const dbReady = initializeDB();

module.exports = {
    db,
    initializeDB,
    dbReady
};
