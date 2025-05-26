// scripts/app.js

/**
 * Handles user logout by clearing current user from localStorage and redirecting.
 */
function logoutUser() {
  const currentUser = getCurrentUser(); // Get user before clearing
  if (currentUser) {
    // Log the logout event *before* clearing the user and redirecting
    logEvent(currentUser.username, 'LOGOUT', 'User logged out successfully.');
    localStorage.removeItem('currentUser');
    console.log(`User ${currentUser.username} logged out, 'currentUser' removed from localStorage.`);
  } else {
    console.log('No user currently logged in to logout.');
  }
  // Redirect to index.html, assuming it's at the root relative to 'pages' directory
  window.location.href = '../index.html';
}

/**
 * Retrieves the current logged-in user's details from localStorage.
 * @returns {object | null} The current user object (e.g., { username: 'name', role: 'role' }) or null if not logged in.
 */
function getCurrentUser() {
  const userJson = localStorage.getItem('currentUser');
  if (userJson) {
    try {
      return JSON.parse(userJson);
    } catch (e) {
      console.error("Error parsing currentUser from localStorage:", e);
      localStorage.removeItem('currentUser'); // Clear corrupted data
      return null;
    }
  }
  return null;
}

/**
 * Starts a new walk instance based on a template.
 * (Placeholder - full implementation in a later step)
 * @param {string} userId - The ID of the user starting the walk.
 * @param {string} walkTemplateId - The ID of the walk template to use.
 * @returns {object | null} The newly created walk object or null if failed.
 */
function startWalk(userId, walkTemplateId) {
  console.log(`Attempting to start walk for user ${userId} with template ${walkTemplateId}.`);

  if (!userId || !walkTemplateId) {
    logEvent(userId || 'unknown_user', 'START_WALK_FAIL', `User ID or Walk Template ID missing. Template: ${walkTemplateId}`);
    console.error('User ID and Walk Template ID are required to start a walk.');
    return null;
  }

  const users = getUsers();
  const userExists = users.some(u => u.username === userId);
  if (!userExists) {
    logEvent(userId, 'START_WALK_FAIL', `User ${userId} not found.`);
    console.error(`User ${userId} not found.`);
    return null;
  }

  const templates = getWalkTemplates();
  const template = templates.find(t => t.id === walkTemplateId);
  if (!template) {
    logEvent(userId, 'START_WALK_FAIL', `Walk template ${walkTemplateId} not found.`);
    console.error(`Walk template ${walkTemplateId} not found.`);
    return null;
  }

  const newWalk = {
    id: `walk_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`, // Unique walk ID
    templateId: walkTemplateId,
    userId: userId,
    startTime: new Date().toISOString(),
    endTime: null,
    status: 'ongoing', // 'ongoing', 'completed', 'cancelled'
    progress: 0, // Initial progress
    checkpointScans: template.checkpoints.map(cpId => ({
      checkpointId: cpId,
      scannedAt: null,
      status: 'pending', // 'pending', 'scanned', 'missed', 'unable_to_scan'
      reason: null,     // Reason if missed or unable to scan
    })),
    cancellationReason: null, // For when the walk is cancelled
  };

  addWalk(newWalk); // From data.js
  logEvent(userId, 'WALK_STARTED', `Walk ${newWalk.id} (Template: ${walkTemplateId}) started.`);
  console.log(`Walk ${newWalk.id} started for user ${userId}.`);
  return newWalk; // Return the full walk object
}

/**
 * Retrieves the most recent active (ongoing) walk for a given user.
 * @param {string} userId - The ID of the user.
 * @returns {object | null} The active walk object or null if none found.
 */
function getActiveWalkForUser(userId) {
  if (!userId) {
    console.error("User ID is required to get active walk.");
    return null;
  }
  const allWalks = getWalks();
  const userActiveWalks = allWalks.filter(
    walk => walk.userId === userId && walk.status === 'ongoing'
  );

  if (userActiveWalks.length === 0) {
    return null;
  }

  // Sort by startTime descending to get the most recent one
  userActiveWalks.sort((a, b) => new Date(b.startTime) - new Date(a.startTime));
  console.log(`Active walk found for user ${userId}: ${userActiveWalks[0].id}`);
  return userActiveWalks[0];
}


/**
 * Fetches the details of a specific walk by its ID.
 * @param {string} walkId - The ID of the walk to retrieve.
 * @returns {object | null} The walk object or null if not found.
 */
function getWalkDetails(walkId) {
  if (!walkId) {
    console.error("Walk ID is required to get walk details.");
    return null;
  }
  const walks = getWalks(); // From data.js
  const walk = walks.find(w => w.id === walkId);

  if (!walk) {
    console.warn(`Walk with ID ${walkId} not found.`);
    return null;
  }
  return walk;
}

/**
 * Cancels a user's ongoing walk.
 * @param {string} walkId - The ID of the walk to cancel.
 * @param {string} reason - The reason for cancellation.
 * @returns {object | null} The updated walk object or null if failed.
 */
function cancelUserWalk(walkId, reason) {
  if (!walkId || !reason) {
    console.error("Walk ID and reason are required to cancel a walk.");
    return null;
  }

  let walks = getWalks();
  const walkIndex = walks.findIndex(w => w.id === walkId);

  if (walkIndex === -1) {
    logEvent('system', 'CANCEL_WALK_FAIL', `Walk ${walkId} not found for cancellation.`);
    console.error(`Walk ${walkId} not found for cancellation.`);
    return null;
  }

  const walkToUpdate = walks[walkIndex];

  if (walkToUpdate.status !== 'ongoing') {
    logEvent(walkToUpdate.userId, 'CANCEL_WALK_FAIL', `Walk ${walkId} is not ongoing, cannot cancel. Status: ${walkToUpdate.status}`);
    console.warn(`Walk ${walkId} is not ongoing, cannot cancel. Status: ${walkToUpdate.status}`);
    return null; // Or return the walk as is, indicating no change
  }

  walkToUpdate.status = 'cancelled';
  walkToUpdate.endTime = new Date().toISOString();
  walkToUpdate.cancellationReason = reason;
  // Optionally, mark all pending checkpoints as 'missed' or 'cancelled'
  walkToUpdate.checkpointScans.forEach(cs => {
    if (cs.status === 'pending') {
      cs.status = 'cancelled_walk'; // Or 'missed_due_to_cancellation'
    }
  });
  walkToUpdate.progress = calculateWalkProgress(walkId, walks); // Recalculate progress (likely 0 or low)

  walks[walkIndex] = walkToUpdate;
  setWalks(walks); // Save all walks back to localStorage via data.js

  logEvent(walkToUpdate.userId, 'WALK_CANCELLED', `Walk ${walkId} cancelled. Reason: ${reason}`);
  console.log(`Walk ${walkId} for user ${walkToUpdate.userId} cancelled. Reason: ${reason}`);
  return walkToUpdate;
}

/**
 * Updates the status of a checkpoint within a walk, typically when scanned.
 * @param {string} walkId - The ID of the walk.
 * @param {string} checkpointId - The ID of the checkpoint scanned.
 * @param {string} scannedAtTimestamp - ISO string of when it was scanned.
 * @returns {object} Result object e.g. `{ success: true, message: 'Checkpoint updated.', walkCompleted: false }`
 *                   or `{ success: false, message: 'Error details' }`
 */
async function updateCheckpointStatus(walkId, checkpointId, scannedAtTimestamp) {
  console.log(`Attempting to update checkpoint ${checkpointId} for walk ${walkId} via API at ${scannedAtTimestamp}.`);
  const userAuthToken = localStorage.getItem('userAuthToken');
  const currentUser = getCurrentUser(); // To get username for logging
  const username = currentUser ? currentUser.username : 'unknown_user';

  if (!userAuthToken) {
    const errorMsg = 'User authentication token not found. Cannot scan checkpoint.';
    console.error(errorMsg);
    logEvent(username, 'UPDATE_CHECKPOINT_FAIL', `${errorMsg} Walk ID: ${walkId}, Checkpoint: ${checkpointId}`);
    return { success: false, message: errorMsg };
  }

  if (!checkpointId) {
    const errorMsg = 'Checkpoint ID (QR Code Identifier) is required.';
    console.error(errorMsg);
    logEvent(username, 'UPDATE_CHECKPOINT_FAIL', `${errorMsg} Walk ID: ${walkId}`);
    return { success: false, message: errorMsg };
  }

  try {
    const response = await fetch('/api/scan', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAuthToken}`,
      },
      body: JSON.stringify({ qr_code_identifier: checkpointId }),
    });

    const responseData = await response.json();

    if (response.ok) { // Typically 200 or 201 for successful POST
      logEvent(
        username,
        'CHECKPOINT_SCANNED_API_SUCCESS',
        `Checkpoint ${checkpointId} scanned successfully for walk ${walkId} via API. Message: ${responseData.message}. Walk completed: ${responseData.walk_completed}`
      );
      console.log(`Checkpoint ${checkpointId} for walk ${walkId} updated via API. Response:`, responseData);
      
      // As per instructions, minimize local storage manipulation.
      // The backend now handles walk state. The frontend should ideally refetch walk data.
      // For now, we return success and the walkCompleted status from the API.
      // If the API confirms the scan and implies walk completion, the calling UI can use this.
      // No direct setWalks() or modification of local 'allWalks' here.

      return {
        success: true,
        message: responseData.message || `Checkpoint ${checkpointId} scanned successfully via API.`,
        walkCompleted: responseData.walk_completed || false, // Assuming API returns this field
        scanDetails: responseData.scan // Include scan details from response
      };
    } else {
      const errorMsg = `API error: ${responseData.message || response.statusText}`;
      console.error(`Failed to update checkpoint ${checkpointId} for walk ${walkId} via API. Status: ${response.status}. Message: ${responseData.message}`);
      logEvent(
        username,
        'UPDATE_CHECKPOINT_FAIL_API',
        `Failed to scan checkpoint ${checkpointId} for walk ${walkId} via API. Status: ${response.status}. Error: ${responseData.message || 'Unknown API error'}`
      );
      return { success: false, message: errorMsg };
    }
  } catch (error) {
    console.error(`Network or other error when scanning checkpoint ${checkpointId} for walk ${walkId} via API:`, error);
    logEvent(
      username,
      'UPDATE_CHECKPOINT_FAIL_NETWORK',
      `Network error or client-side issue scanning checkpoint ${checkpointId} for walk ${walkId}. Error: ${error.message}`
    );
    return { success: false, message: `Network error or client-side issue: ${error.message}` };
  }
}

/**
 * Calculates the progress of a walk.
 * (Placeholder - full implementation in a later step)
 * @param {string} walkId - The ID of the walk.
 * @param {Array} [walksArray] - Optional: pass array of walks to avoid re-fetching (e.g., if called internally).
 * @returns {number} The walk progress percentage (0-100).
 */
function calculateWalkProgress(walkId, walksArray = null) {
  const currentWalks = walksArray || getWalks(); // Use provided array or fetch from data.js
  const walk = currentWalks.find(w => w.id === walkId);

  if (!walk) {
    console.warn(`calculateWalkProgress: Walk with ID ${walkId} not found.`);
    return 0;
  }

  if (!walk.checkpointScans || walk.checkpointScans.length === 0) {
    console.log(`calculateWalkProgress: Walk ${walkId} has no checkpoints.`);
    return 0; // No checkpoints, so 0% progress
  }

  const totalCheckpoints = walk.checkpointScans.length;
  const scannedCheckpoints = walk.checkpointScans.filter(
    cs => cs.status === 'scanned'
  ).length;

  if (totalCheckpoints === 0) { // Should be caught by the above, but good for safety
    return 0;
  }

  const progress = (scannedCheckpoints / totalCheckpoints) * 100;
  // console.log(`Progress for walk ${walkId}: ${scannedCheckpoints}/${totalCheckpoints} = ${progress}%`);
  return Math.round(progress);
}

/**
 * Logs an event using addLog from data.js.
 * @param {string} userId - The username or ID of the user associated with the event.
 * @param {string} action - The type of action (e.g., 'USER_LOGIN_SUCCESS', 'ADMIN_LOGIN_FAIL', 'LOGOUT').
 * @param {string} details - Specific details about the event.
 */
function logEvent(userId, action, details) {
  const logEntry = {
    timestamp: new Date().toISOString(),
    userId: userId, // This should be the username
    action: action,
    details: details,
  };

  if (typeof addLog === 'function') {
    addLog(logEntry); // addLog is from data.js
    console.log('Event logged:', logEntry);
  } else {
    console.error('addLog function not found. Make sure data.js is loaded before app.js and initialized.');
    // Fallback logging if critical, perhaps to a temporary localStorage item
    let tempLogs = JSON.parse(localStorage.getItem('temp_event_logs') || '[]');
    tempLogs.push(logEntry);
    localStorage.setItem('temp_event_logs', JSON.stringify(tempLogs));
  }
}

// No example calls or DOMContentLoaded listener here, this script provides functions to be used by HTML pages.

// Export functions (optional, for potential use with module bundlers or ES6 modules if not relying on global scope)
// Example for a module system (e.g., ES6 modules):
/*
export {
  loginUser,
  logoutUser,
  getCurrentUser,
  startWalk,
  getWalkDetails,
  updateCheckpointStatus,
  calculateWalkProgress,
  logEvent,
};
*/
