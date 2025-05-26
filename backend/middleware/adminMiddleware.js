const isAdmin = (req, res, next) => {
    // This middleware should run AFTER verifyToken, so req.user should be populated.
    if (req.user && req.user.role === 'admin') {
        next(); // User is an admin, proceed to the next handler
    } else {
        // If req.user is not populated or role is not 'admin'
        res.status(403).json({ message: 'Access denied. Admin privileges required.' });
    }
};

module.exports = {
    isAdmin
};
