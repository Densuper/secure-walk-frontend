# Secure Walkways Application

Secure Walkways is a web application designed for managing and tracking security officer patrols using QR codes. It features separate interfaces for administrators and security officers (users).

## Overview

*   **Frontend:** HTML, CSS, and vanilla JavaScript. Located primarily in `index.html` and the `pages/` directory.
*   **Backend:** Node.js with Express.js and SQLite. Located in the `backend/` directory.

## Running the Application

To run the Secure Walkways application, you need to have both the backend server running and the frontend accessible in a browser.

### 1. Running the Backend

Follow the instructions in the [backend/README.md](backend/README.md) to set up and start the backend server. By default, it runs on `http://localhost:3000`.

### 2. Accessing the Frontend

Once the backend server is running:

*   Simply open the `index.html` file in your web browser.
*   Alternatively, you can serve the root directory using a simple HTTP server (e.g., using Python's `http.server` or a VS Code Live Server extension).

The application will then be accessible, typically starting from the main login selection page.

## Frontend Structure

*   `index.html`: The main entry point of the application, offering choices for User or Admin login.
*   `pages/`: Contains all other HTML pages for the application:
    *   `user-login.html`, `admin-login.html`: Login pages.
    *   `user-dashboard.html`: Dashboard for security officers to view scan history and initiate QR scanning.
    *   `admin-dashboard.html`: Dashboard for administrators to access user management, walk histories, QR code management, and logs.
    *   `qr-scan.html`: Page for scanning QR codes (uses device camera).
    *   Other pages for displaying walk histories, details, user/QR management, and logs.

**Note:** The frontend pages make API calls to the backend server. Ensure the backend is running and accessible for the application to function correctly.

## Default Users (for testing)

The backend is pre-populated with the following users when it initializes the database:

*   **Admin:**
    *   Username: `adminuser`
    *   Password: `adminpass123`
*   **User (Security Officer):**
    *   Username: `testuser`
    *   Password: `password123`

These can be used to log in and test the application features.
