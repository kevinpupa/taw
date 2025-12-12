const jwt = require('jsonwebtoken');
const User = require('../models/user');

// JWT configuration - throw error if not set in production
const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET must be set in environment');
    }
    return secret;
};

const JWT_SECRET = getJwtSecret();

// Verify JWT token from httpOnly cookie
const authenticate = async (req, res, next) => {
    try {
        const token = req.cookies?.authToken;
        
        if (!token) {
            return res.status(401).json({ error: { message: 'Access denied. No token provided.' } });
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const user = await User.findById(decoded.userId).populate('airline');
        
        if (!user) {
            res.clearCookie('authToken');
            return res.status(401).json({ error: { message: 'User not found.' } });
        }
        
        if (!user.isActive) {
            res.clearCookie('authToken');
            return res.status(401).json({ error: { message: 'User account is deactivated.' } });
        }
        
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            res.clearCookie('authToken');
            return res.status(401).json({ error: { message: 'Invalid token.' } });
        }
        if (error.name === 'TokenExpiredError') {
            res.clearCookie('authToken');
            return res.status(401).json({ error: { message: 'Token expired.' } });
        }
        next(error);
    }
};

// Optional authentication from httpOnly cookie
const optionalAuth = async (req, res, next) => {
    try {
        const token = req.cookies?.authToken;
        
        if (!token) {
            return next();
        }
        
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const user = await User.findById(decoded.userId).populate('airline');
        
        if (user && user.isActive) {
            req.user = user;
        }
        
        next();
    } catch {
        // Invalid token, but continue without user
        next();
    }
};

// Check if user is admin
const isAdmin = (req, res, next) => {
    if (!req.user || req.user.role !== 'admin') {
        return res.status(403).json({ error: { message: 'Admin access required.' } });
    }
    next();
};

// Check if user is airline admin
// Accept both 'airline_admin' and legacy seeded 'airline' role
const isAirlineAdmin = (req, res, next) => {
    const role = req.user?.role;
    if (!role || (role !== 'airline_admin' && role !== 'airline')) {
        return res.status(403).json({ error: { message: 'Airline admin access required.' } });
    }
    next();
};

// Check if user is passenger
const isPassenger = (req, res, next) => {
    if (!req.user || req.user.role !== 'passenger') {
        return res.status(403).json({ error: { message: 'Passenger access required.' } });
    }
    next();
};

module.exports = {
    authenticate,
    optionalAuth,
    isAdmin,
    isAirlineAdmin,
    isPassenger
};