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
async function fetchAvailableCheckpoints() {
  const userAuthToken = localStorage.getItem('userAuthToken');
  const loggingUsername = getCurrentUser()?.username || 'unknown_user';

  if (!userAuthToken) {
    console.error('User authentication token not found. Cannot load checkpoints.');
    logEvent(loggingUsername, 'FETCH_CHECKPOINTS_FAIL', 'Auth token not found while fetching checkpoints.');
    return [];
  }

  try {
    const response = await fetch('/api/checkpoints', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${userAuthToken}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const responseData = await response.json().catch(() => ({}));
      const errorMsg = responseData.message || response.statusText || 'Unknown error fetching checkpoints.';
      console.error('Failed to fetch checkpoints from API:', response.status, responseData);
      logEvent(loggingUsername, 'FETCH_CHECKPOINTS_FAIL', errorMsg);
      return [];
    }

    const responseData = await response.json();
    const checkpoints = Array.isArray(responseData.checkpoints) ? responseData.checkpoints : [];
    logEvent(loggingUsername, 'FETCH_CHECKPOINTS_SUCCESS', `Loaded ${checkpoints.length} checkpoints from API.`);
    return checkpoints;
  } catch (error) {
    console.error('Network error fetching checkpoints from API:', error);
    logEvent(loggingUsername, 'FETCH_CHECKPOINTS_FAIL', `Network error: ${error.message}`);
    return [];
  }
}

async function startWalk(userId, walkTemplateId) {
  console.log(`Attempting to start walk for user ${userId} with template ${walkTemplateId} via API.`);
  const userAuthToken = localStorage.getItem('userAuthToken');

  if (!userAuthToken) {
    console.error('User authentication token not found. Cannot start walk.');
    logEvent(userId || 'unknown_user', 'START_WALK_FAIL_API', 'Auth token not found.');
    return null;
  }

  if (!userId || !walkTemplateId) {
    logEvent(userId || 'unknown_user', 'START_WALK_FAIL_API', `User ID or Walk Template ID missing. User: ${userId}, Template: ${walkTemplateId}`);
    console.error('User ID (username) and Walk Template ID are required to start a walk.');
    return null;
  }

  const checkpoints = await fetchAvailableCheckpoints();
  const checkpointQrIdentifiersArray = checkpoints.map(cp => cp.qr_code_identifier).filter(Boolean);

  if (checkpointQrIdentifiersArray.length === 0) {
    const errorMsg = 'No checkpoints available from API to include in the walk.';
    console.error(errorMsg);
    logEvent(userId, 'START_WALK_FAIL_API', errorMsg);
    return null;
  }

  try {
    const response = await fetch('/api/walk/start', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${userAuthToken}`,
      },
      body: JSON.stringify({
        template_id: walkTemplateId,
        checkpoints: checkpointQrIdentifiersArray,
      }),
    });

    const responseData = await response.json();

    if (response.ok) { // response.ok is true if status is 200-299 (e.g. 201 Created)
      console.log(`Walk started successfully via API. Walk ID: ${responseData.walk_id}`, responseData);
      // The backend returns { message, walk_id, status, walk_details }
      // We should return the walk_details part if it exists, or the whole responseData if preferred.
      // Based on controller, responseData contains walk_id and walk_details.
      logEvent(userId, 'WALK_STARTED_API', `Walk ${responseData.walk_id} (Template: ${walkTemplateId}) started via API.`);
      return responseData.walk_details || responseData; // Return the detailed walk object from API
    } else {
      const errorMsg = `API Error: ${responseData.message || response.statusText || response.status}`;
      console.error('Failed to start walk via API:', response.status, responseData);
      logEvent(userId, 'START_WALK_FAIL_API', errorMsg);
      return null;
    }
  } catch (error) {
    const errorMsg = `Network or client-side error: ${error.message}`;
    console.error('Error starting walk via API:', error);
    logEvent(userId, 'START_WALK_FAIL_API', errorMsg);
    return null;
  }
}

/**
 * Retrieves the most recent active (ongoing) walk for a given user.
 * @param {string} userId - The ID of the user (username, primarily for logging).
 * @returns {object | null} The active walk object or null if none found.
 */
async function getActiveWalkForUser(userId) { // userId is username, primarily for logging
    const userAuthToken = localStorage.getItem('userAuthToken');
    const currentUser = getCurrentUser(); // For logging username if userId param is not reliable
    const loggingUsername = userId || (currentUser ? currentUser.username : 'unknown_user');

    if (!userAuthToken) {
        console.error('User authentication token not found. Cannot fetch active walk.');
        logEvent(loggingUsername, 'GET_ACTIVE_WALK_FAIL_API', 'Auth token not found.');
        return null;
    }

    console.log(`Attempting to fetch active walk from API for user ${loggingUsername}.`);

    try {
        const response = await fetch('/api/walk/active', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userAuthToken}`,
                'Content-Type': 'application/json', // Optional for GET, but good practice
            },
        });

        const responseData = await response.json();

        if (response.ok) { // response.ok is true if status is 200-299
            if (responseData.active_walk) {
                console.log(`Active walk data fetched from API for user ${loggingUsername}:`, responseData.active_walk);
                logEvent(loggingUsername, 'GET_ACTIVE_WALK_SUCCESS_API', `Active walk ${responseData.active_walk.id} fetched.`);
            } else {
                console.log(`No active walk found via API for user ${loggingUsername}. Message: ${responseData.message}`);
                logEvent(loggingUsername, 'GET_ACTIVE_WALK_NONE_API', responseData.message || 'No active walk found.');
            }
            return responseData.active_walk; // This will be the walk object or null
        } else {
            const errorDetail = `API Error: ${responseData.message || response.status}`;
            console.error(`Failed to get active walk from API for user ${loggingUsername}:`, response.status, responseData);
            logEvent(loggingUsername, 'GET_ACTIVE_WALK_FAIL_API', errorDetail);
            return null;
        }
    } catch (error) {
        const errorDetail = `Network or client-side error: ${error.message}`;
        console.error(`Error fetching active walk from API for user ${loggingUsername}:`, error);
        logEvent(loggingUsername, 'GET_ACTIVE_WALK_FAIL_API', errorDetail);
        return null;
    }
}


/**
 * Fetches the details of a specific walk by its ID.
 * @param {string} walkId - The ID of the walk to retrieve.
 * @returns {object | null} The walk object or null if not found.
 */
async function getWalkDetails(walkId) {
    const userAuthToken = localStorage.getItem('userAuthToken');
    const loggingUsername = getCurrentUser()?.username || 'unknown_user';

    if (!userAuthToken) {
        console.error('User authentication token not found. Cannot fetch walk details.');
        logEvent(loggingUsername, 'GET_WALK_DETAILS_FAIL_API', `Auth token not found for walk ${walkId}.`);
        return null;
    }

    if (!walkId) {
        console.error("Walk ID is required to get walk details from API.");
        logEvent(loggingUsername, 'GET_WALK_DETAILS_FAIL_API', 'Walk ID not provided.');
        return null;
    }

    console.log(`Attempting to fetch walk details from API for walk ID ${walkId}.`);

    try {
        const response = await fetch(`/api/walk/${walkId}`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${userAuthToken}`,
                'Content-Type': 'application/json',
            },
        });

        const responseData = await response.json();

        if (response.ok) { // response.ok is true if status is 200-299
            console.log(`Walk details fetched from API for walk ID ${walkId}:`, responseData.walk_details);
            logEvent(loggingUsername, 'GET_WALK_DETAILS_SUCCESS_API', `Details for walk ${walkId} fetched successfully.`);
            return responseData.walk_details;
        } else {
            const errorDetail = `API Error for walk ${walkId}: ${responseData.message || response.status}`;
            console.error(`Failed to get walk details from API for walk ID ${walkId}:`, response.status, responseData);
            logEvent(loggingUsername, 'GET_WALK_DETAILS_FAIL_API', errorDetail);
            return null;
        }
    } catch (error) {
        const errorDetail = `Network error fetching details for walk ${walkId}: ${error.message}`;
        console.error(`Error fetching walk details from API for walk ID ${walkId}:`, error);
        logEvent(loggingUsername, 'GET_WALK_DETAILS_FAIL_API', errorDetail);
        return null;
    }
}

/**
 * Cancels a user's ongoing walk.
 * @param {string} walkId - The ID of the walk to cancel.
 * @param {string} reason - The reason for cancellation.
 * @returns {object | null} The updated walk object or null if failed.
 */
async function cancelUserWalk(walkId, reason) {
    const userAuthToken = localStorage.getItem('userAuthToken');
    const username = getCurrentUser()?.username || 'unknown_user';

    if (!userAuthToken) {
        console.error('User authentication token not found. Cannot cancel walk.');
        logEvent(username, 'CANCEL_WALK_FAIL_API', `Auth token not found for cancelling walk ${walkId}.`);
        return null;
    }

    if (!walkId || !reason) {
        console.error("Walk ID and reason are required to cancel a walk.");
        logEvent(username, 'CANCEL_WALK_FAIL_API', `Walk ID or reason missing for cancelling walk ${walkId}. Walk ID: ${walkId}, Reason: ${reason}`);
        return null;
    }

    console.log(`Attempting to cancel walk ${walkId} via API. Reason: ${reason}`);

    try {
        const response = await fetch(`/api/walk/${walkId}/cancel`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${userAuthToken}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ cancellationReason: reason }),
        });

        const responseData = await response.json();

        if (response.ok) { // response.ok is true if status is 200-299
            console.log(`Walk ${walkId} cancelled successfully via API. Reason: ${reason}`, responseData.walk_details);
            logEvent(username, 'WALK_CANCELLED_API', `Walk ${walkId} cancelled via API. Reason: ${reason}`);
            return responseData.walk_details; // API returns { message: '...', walk_details: {...} }
        } else {
            const errorMsg = `API Error cancelling walk ${walkId}: ${responseData.message || response.status}`;
            console.error(`Failed to cancel walk ${walkId} via API:`, response.status, responseData);
            logEvent(username, 'CANCEL_WALK_FAIL_API', errorMsg);
            return null;
        }
    } catch (error) {
        const errorMsg = `Network error cancelling walk ${walkId}: ${error.message}`;
        console.error(`Error cancelling walk ${walkId} via API:`, error);
        logEvent(username, 'CANCEL_WALK_FAIL_API', errorMsg);
        return null;
    }
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
function calculateWalkProgress(walkOrWalkId, walksArray = null) {
  let checkpoints = [];

  if (Array.isArray(walkOrWalkId)) {
    checkpoints = walkOrWalkId;
  } else if (walkOrWalkId && typeof walkOrWalkId === 'object') {
    if (Array.isArray(walkOrWalkId.checkpoints)) {
      checkpoints = walkOrWalkId.checkpoints;
    } else if (Array.isArray(walkOrWalkId.checkpointScans)) {
      checkpoints = walkOrWalkId.checkpointScans;
    }
  } else {
    const currentWalks = walksArray || getWalks();
    const walk = currentWalks.find(w => w.id === walkOrWalkId);
    if (walk) {
      checkpoints = walk.checkpoints || walk.checkpointScans || [];
    } else {
      console.warn(`calculateWalkProgress: Walk with ID ${walkOrWalkId} not found.`);
      return 0;
    }
  }

  if (!Array.isArray(checkpoints) || checkpoints.length === 0) {
    return 0;
  }

  const scannedCheckpoints = checkpoints.filter(cp => {
    const status = cp.status || cp.checkpointStatus;
    return typeof status === 'string' && status.toLowerCase() === 'scanned';
  }).length;

  return Math.round((scannedCheckpoints / checkpoints.length) * 100);
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
