const express = require('express');
const { initializeDB } = require('./database'); // Import initializeDB
const authRoutes = require('./routes/authRoutes'); // Import auth routes
const scanRoutes = require('./routes/scanRoutes'); // Import scan routes
const userRoutes = require('./routes/userRoutes'); // Import user routes
const adminUserRoutes = require('./routes/adminUserRoutes'); // Import admin user routes
const checkpointRoutes = require('./routes/checkpointRoutes'); // Import checkpoint routes
const walkRoutes = require('./routes/walkRoutes'); // Import walk routes
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
// Mount admin user routes
app.use('/api/admin/users', adminUserRoutes);
// Mount checkpoint management routes
app.use('/api/admin/checkpoints', checkpointRoutes);
// Mount walk routes
app.use('/api', walkRoutes);


app.get('/api/status', (req, res) => {
  res.json({ status: 'Backend is running' });
});

const server = app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});

module.exports = { app, server };
