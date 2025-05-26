// scripts/data.js

/**
 * Initializes local storage with sample data if no existing data is found.
 */
function initializeData() {
  // Check for existing users data
  if (!localStorage.getItem('users')) {
    const sampleUsers = [
      {
        username: 'admin',
        role: 'admin',
        password: 'hashed_password_placeholder', // In a real app, use a strong hashing algorithm
      },
      {
        username: 'user1',
        role: 'user',
        password: 'hashed_password_placeholder',
      },
    ];
    localStorage.setItem('users', JSON.stringify(sampleUsers));
  }

  // Check for existing QR codes data
  if (!localStorage.getItem('qrCodes')) {
    const sampleQrCodes = [
      { id: 'CP001', name: 'Main Entrance', location: 'Building A, 1st Floor' },
      { id: 'CP002', name: 'Server Room', location: 'Building A, 2nd Floor' },
      { id: 'CP003', name: 'Exit B', location: 'Building B, Ground Floor' },
    ];
    localStorage.setItem('qrCodes', JSON.stringify(sampleQrCodes));
  }

  // Check for existing walk templates data
  if (!localStorage.getItem('walkTemplates')) {
    const sampleWalkTemplates = [
      {
        id: 'WT01',
        name: 'Morning Patrol',
        description: 'Standard morning patrol route',
        checkpoints: ['CP001', 'CP002', 'CP003'],
      },
      {
        id: 'WT02',
        name: 'Evening Security Check',
        description: 'Perimeter check and door lock verification',
        checkpoints: ['CP003', 'CP001'],
      },
    ];
    localStorage.setItem('walkTemplates', JSON.stringify(sampleWalkTemplates));
  }

  // Check for existing walks data
  if (!localStorage.getItem('walks')) {
    const sampleWalks = []; // Initialize with an empty array, walks will be created by the app
    localStorage.setItem('walks', JSON.stringify(sampleWalks));
  }

  // Check for existing logs data
  if (!localStorage.getItem('logs')) {
    const sampleLogs = [
      {
        timestamp: new Date().toISOString(),
        userId: 'system',
        action: 'INITIALIZE_DATA',
        details: 'Sample data initialized in localStorage.',
      },
    ];
    localStorage.setItem('logs', JSON.stringify(sampleLogs));
  }
}

// --- User Data ---

/**
 * Retrieves users from localStorage.
 * @returns {Array} Array of user objects.
 */
function getUsers() {
  const users = localStorage.getItem('users');
  return users ? JSON.parse(users) : [];
}

/**
 * Saves users to localStorage.
 * @param {Array} usersArray - Array of user objects to save.
 */
function setUsers(usersArray) {
  localStorage.setItem('users', JSON.stringify(usersArray));
}

/**
 * Adds a new user to localStorage if the username doesn't already exist.
 * @param {object} userObject - The user object to add (e.g., {username, password, role}).
 * @returns {object} An object like { success: true } or { success: false, message: 'Error message' }.
 */
function addUser(userObject) {
  if (!userObject || !userObject.username || !userObject.password || !userObject.role) {
    return { success: false, message: 'User object must include username, password, and role.' };
  }
  const users = getUsers();
  const existingUser = users.find(u => u.username === userObject.username);
  if (existingUser) {
    return { success: false, message: `Username '${userObject.username}' already exists.` };
  }
  users.push(userObject);
  setUsers(users);
  return { success: true, user: userObject };
}

/**
 * Updates an existing user's data in localStorage.
 * @param {string} username - The username of the user to update.
 * @param {object} updatedUserData - An object containing the fields to update (e.g., { role, password }).
 *                                   Password should be pre-hashed if using hashing.
 * @returns {object} An object like { success: true } or { success: false, message: 'Error message' }.
 */
function updateUser(username, updatedUserData) {
  if (!username || !updatedUserData) {
    return { success: false, message: 'Username and updatedUserData are required.' };
  }
  let users = getUsers();
  const userIndex = users.findIndex(u => u.username === username);

  if (userIndex === -1) {
    return { success: false, message: `User '${username}' not found.` };
  }

  // Update only provided fields. Username itself cannot be changed via this function.
  if (updatedUserData.hasOwnProperty('role')) {
    users[userIndex].role = updatedUserData.role;
  }
  if (updatedUserData.hasOwnProperty('password') && updatedUserData.password) { // Ensure password is not empty if provided
    users[userIndex].password = updatedUserData.password; // Store as is, hashing should be done before calling
  }
  // Add other updatable fields here if necessary

  setUsers(users);
  return { success: true, user: users[userIndex] };
}

/**
 * Deletes a user from localStorage by username.
 * @param {string} username - The username of the user to delete.
 * @returns {object} An object like { success: true } or { success: false, message: 'Error message' }.
 */
function deleteUser(username) {
  if (!username) {
    return { success: false, message: 'Username is required.' };
  }
  let users = getUsers();
  const initialLength = users.length;
  users = users.filter(u => u.username !== username);

  if (users.length === initialLength) {
    return { success: false, message: `User '${username}' not found.` };
  }

  setUsers(users);
  return { success: true };
}

// --- QR Code Data ---

/**
 * Retrieves QR codes/checkpoints from localStorage.
 * @returns {Array} Array of QR code objects.
 */
function getQrCodes() {
  const qrCodes = localStorage.getItem('qrCodes');
  return qrCodes ? JSON.parse(qrCodes) : [];
}

/**
 * Saves QR codes/checkpoints to localStorage.
 * @param {Array} qrCodesArray - Array of QR code objects to save.
 */
function setQrCodes(qrCodesArray) {
  localStorage.setItem('qrCodes', JSON.stringify(qrCodesArray));
}

/**
 * Retrieves a specific QR code/checkpoint by its ID from localStorage.
 * @param {string} qrCodeId - The ID of the QR code to retrieve.
 * @returns {object | undefined} The QR code object if found, otherwise undefined.
 */
function getQrCodeById(qrCodeId) {
  const qrCodes = getQrCodes();
  return qrCodes.find(qr => qr.id === qrCodeId);
}

/**
 * Adds a new QR code/checkpoint to localStorage if the ID doesn't already exist.
 * @param {object} qrCodeObject - The QR code object to add (e.g., {id, name, location}).
 * @returns {object} An object like { success: true } or { success: false, message: 'Error message' }.
 */
function addQrCode(qrCodeObject) {
  if (!qrCodeObject || !qrCodeObject.id || !qrCodeObject.name) { // Location can be optional initially
    return { success: false, message: 'QR Code object must include at least id and name.' };
  }
  const qrCodes = getQrCodes();
  const existingQrCode = qrCodes.find(qr => qr.id === qrCodeObject.id);
  if (existingQrCode) {
    return { success: false, message: `QR Code ID '${qrCodeObject.id}' already exists.` };
  }
  qrCodes.push(qrCodeObject);
  setQrCodes(qrCodes);
  return { success: true, qrCode: qrCodeObject };
}

/**
 * Updates an existing QR code's data in localStorage.
 * @param {string} qrCodeId - The ID of the QR code to update.
 * @param {object} updatedQrCodeData - An object containing the fields to update (e.g., { name, location }).
 * @returns {object} An object like { success: true } or { success: false, message: 'Error message' }.
 */
function updateQrCode(qrCodeId, updatedQrCodeData) {
  if (!qrCodeId || !updatedQrCodeData) {
    return { success: false, message: 'QR Code ID and updatedQrCodeData are required.' };
  }
  let qrCodes = getQrCodes();
  const qrCodeIndex = qrCodes.findIndex(qr => qr.id === qrCodeId);

  if (qrCodeIndex === -1) {
    return { success: false, message: `QR Code with ID '${qrCodeId}' not found.` };
  }

  // Update only provided fields. ID itself cannot be changed via this function.
  if (updatedQrCodeData.hasOwnProperty('name')) {
    qrCodes[qrCodeIndex].name = updatedQrCodeData.name;
  }
  if (updatedQrCodeData.hasOwnProperty('location')) {
    qrCodes[qrCodeIndex].location = updatedQrCodeData.location;
  }
  // Add other updatable fields here if necessary

  setQrCodes(qrCodes);
  return { success: true, qrCode: qrCodes[qrCodeIndex] };
}

/**
 * Deletes a QR code from localStorage by its ID.
 * @param {string} qrCodeId - The ID of the QR code to delete.
 * @returns {object} An object like { success: true } or { success: false, message: 'Error message' }.
 */
function deleteQrCode(qrCodeId) {
  if (!qrCodeId) {
    return { success: false, message: 'QR Code ID is required.' };
  }
  let qrCodes = getQrCodes();
  const initialLength = qrCodes.length;
  qrCodes = qrCodes.filter(qr => qr.id !== qrCodeId);

  if (qrCodes.length === initialLength) {
    return { success: false, message: `QR Code with ID '${qrCodeId}' not found.` };
  }

  setQrCodes(qrCodes);
  return { success: true };
}

// --- Walk Template Data ---

/**
 * Retrieves walk templates from localStorage.
 * @returns {Array} Array of walk template objects.
 */
function getWalkTemplates() {
  const walkTemplates = localStorage.getItem('walkTemplates');
  return walkTemplates ? JSON.parse(walkTemplates) : [];
}

/**
 * Saves walk templates to localStorage.
 * @param {Array} walkTemplatesArray - Array of walk template objects to save.
 */
function setWalkTemplates(walkTemplatesArray) {
  localStorage.setItem('walkTemplates', JSON.stringify(walkTemplatesArray));
}

// --- Walk Data ---

/**
 * Retrieves walks from localStorage.
 * @returns {Array} Array of walk objects.
 */
function getWalks() {
  const walks = localStorage.getItem('walks');
  return walks ? JSON.parse(walks) : [];
}

/**
 * Saves all walks to localStorage.
 * @param {Array} walksArray - Array of walk objects to save.
 */
function setWalks(walksArray) {
  localStorage.setItem('walks', JSON.stringify(walksArray));
}

/**
 * Adds a new walk to localStorage.
 * @param {Object} walkObject - The walk object to add.
 */
function addWalk(walkObject) {
  const walks = getWalks();
  walks.push(walkObject);
  setWalks(walks);
}

// --- Log Data ---

/**
 * Retrieves logs from localStorage.
 * @returns {Array} Array of log objects.
 */
function getLogs() {
  const logs = localStorage.getItem('logs');
  return logs ? JSON.parse(logs) : [];
}

/**
 * Saves all logs to localStorage.
 * @param {Array} logsArray - Array of log objects to save.
 */
function setLogs(logsArray) {
  localStorage.setItem('logs', JSON.stringify(logsArray));
}

/**
 * Adds a new log entry to localStorage.
 * @param {Object} logObject - The log object to add.
 */
function addLog(logObject) {
  const logs = getLogs();
  logs.push(logObject);
  setLogs(logs);
}

// Initialize data on script load
initializeData();

// Export functions (optional, depending on how you structure your project,
// for now, these will be global or you might use a module system later)
// Example for a module system (e.g., ES6 modules):
/*
export {
  initializeData,
  getUsers,
  setUsers,
  getQrCodes,
  setQrCodes,
  getWalkTemplates,
  setWalkTemplates,
  getWalks,
  setWalks,
  addWalk,
  getLogs,
  setLogs,
  addLog,
};
*/
