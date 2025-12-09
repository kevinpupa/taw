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

// Verify JWT token
const authenticate = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return res.status(401).json({ error: { message: 'Access denied. No token provided.' } });
        }
        
        const token = authHeader.split(' ')[1];
        const decoded = jwt.verify(token, JWT_SECRET);
        
        const user = await User.findById(decoded.userId).populate('airline');
        
        if (!user) {
            return res.status(401).json({ error: { message: 'User not found.' } });
        }
        
        if (!user.isActive) {
            return res.status(401).json({ error: { message: 'User account is deactivated.' } });
        }
        
        req.user = user;
        next();
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ error: { message: 'Invalid token.' } });
        }
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ error: { message: 'Token expired.' } });
        }
        next(error);
    }
};

// Optional authentication - sets user if token is valid, but doesn't require it
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers.authorization;
        
        if (!authHeader || !authHeader.startsWith('Bearer ')) {
            return next();
        }
        
        const token = authHeader.split(' ')[1];
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

// Check if user is airline
const isAirline = (req, res, next) => {
    if (!req.user || req.user.role !== 'airline') {
        return res.status(403).json({ error: { message: 'Airline access required.' } });
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

// Check if user is admin or airline
module.exports = {
    authenticate,
    optionalAuth,
    isAdmin,
    isAirline,
    isPassenger
};