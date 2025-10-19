# Secure Walkways - Backend

This directory contains the backend server code for the Secure Walkways application. It's built using Node.js and Express.js, with an SQLite database.

## Setup and Installation

1.  **Navigate to the backend directory:**
    ```bash
    cd backend
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Configure environment variables:**
    Create a `.env` file in this directory (or set environment variables another way) with at least the following values:
    ```bash
    JWT_SECRET=replace_with_a_secure_secret
    # Optional: seed predictable demo users and checkpoints for local development
    SEED_DEMO_DATA=true
    ```
    The server will refuse to start if `JWT_SECRET` is not defined.

## Running the Server

To start the backend server, run the following command from the `backend` directory:
```bash
node server.js
```
By default, the server will start on `http://localhost:3000`.

## API Endpoints

The backend provides the following main API endpoints under the `/api` prefix (e.g., `http://localhost:3000/api`):

*   **Authentication:**
    *   `POST /login`: User login. Expects `username` and `password`. Returns a JWT.
    *   `POST /admin/login`: Admin login. Expects `username` and `password`. Returns a JWT.
*   **QR Code Scanning:**
    *   `POST /scan`: Records a QR code scan. Expects `qr_code_identifier`. Requires JWT authentication.
*   **Checkpoint Catalog:**
    *   `GET /checkpoints`: Returns the list of checkpoints available for patrols. Requires JWT authentication.
*   **User Data:**
    *   `GET /user/dashboard-data`: Retrieves data for the user dashboard, including recent scans. Requires JWT authentication.

*(For detailed request/response formats, please refer to the controller implementations in `backend/controllers/`)*

## Database

*   **Type:** SQLite
*   **Database File:** `securewalkways.db` (created automatically in the `backend` directory when the server starts for the first time).
*   **Schema:** Defined in `backend/database.js`. Includes tables for `Users`, `Checkpoints`, and `Scans`.

## Testing

Tests are written using Jest and Supertest.

1.  **Run tests:**
    ```bash
    npm test
    ```
    *(Note: Test execution might face module resolution issues in some sandbox environments, as previously encountered.)*

## Project Structure

*   `server.js`: Main application file, sets up Express and starts the server.
*   `database.js`: Handles SQLite database connection and schema initialization.
*   `controllers/`: Contains logic for handling API requests (auth, scan, user).
*   `routes/`: Defines the API routes and links them to controller functions.
*   `middleware/`: Contains custom middleware (e.g., `authMiddleware.js` for JWT verification).
*   `tests/`: Contains integration tests for the API.
