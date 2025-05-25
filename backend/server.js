const express = require('express');
const { initializeDB } = require('./database'); // Import initializeDB
const authRoutes = require('./routes/authRoutes'); // Import auth routes
const scanRoutes = require('./routes/scanRoutes'); // Import scan routes
const userRoutes = require('./routes/userRoutes'); // Import user routes
const app = express();
const port = process.env.PORT || 3000;

// Initialize the database and tables
initializeDB();

app.use(express.json()); // Middleware to parse JSON bodies

// Mount auth routes
app.use('/api', authRoutes);
// Mount scan routes
app.use('/api', scanRoutes);
// Mount user routes
app.use('/api/user', userRoutes);


app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running' });
});

const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

module.exports = { app, server };
