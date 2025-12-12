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
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '30d';
const IS_PRODUCTION = process.env.NODE_ENV === 'production';

// Generate JWT token with role and airlineId
const generateToken = (user) => {
    const payload = { 
        userId: user._id, 
        role: user.role,
        airlineId: user.airline ? user.airline._id || user.airline : null
    };
    return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
};

// Get cookie options for httpOnly token storage
const getCookieOptions = () => ({
    httpOnly: true,
    secure: IS_PRODUCTION,
    sameSite: 'Lax',
    maxAge: 30 * 24 * 60 * 60 * 1000
});

const TOKEN_COOKIE_NAME = 'authToken';

// Register a new passenger user
const registerPassenger = async (userData) => {
    const { fullName, email, password, phone } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }
    
    const user = new User({
        fullName,
        email,
        password,
        phone,
        role: 'passenger'
    });
    
    await user.save();
    
    const token = generateToken(user);
    
    return { user, token };
};

// Login user
const loginUser = async (email, password) => {
    const user = await User.findOne({ email }).populate('airline');
    
    if (!user) {
        throw new Error('Invalid email or password');
    }
    
    if (!user.isActive) {
        throw new Error('Account is deactivated');
    }
    
    const isMatch = await user.comparePassword(password);
    
    if (!isMatch) {
        throw new Error('Invalid email or password');
    }
    
    const token = generateToken(user);
    
    return { user, token, mustChangePassword: user.mustChangePassword };
};

// Change password
const changePassword = async (userId, currentPassword, newPassword) => {
    const user = await User.findById(userId);
    
    if (!user) {
        throw new Error('User not found');
    }
    
    const isMatch = await user.comparePassword(currentPassword);
    
    if (!isMatch) {
        throw new Error('Current password is incorrect');
    }
    
    user.password = newPassword;
    user.mustChangePassword = false;
    await user.save();
    
    return user;
};

// Create airline user (admin only) with temporary password
const createAirlineUser = async (userData, adminUser) => {
    if (adminUser.role !== 'admin') {
        throw new Error('Only admin can create airline users');
    }
    
    const { fullName, email, airlineId, temporaryPassword } = userData;
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new Error('User with this email already exists');
    }
    
    const user = new User({
        fullName,
        email,
        password: temporaryPassword,
        role: 'airline',
        airline: airlineId,
        mustChangePassword: true
    });
    
    await user.save();
    
    return user;
};

module.exports = {
    generateToken,
    getCookieOptions,
    TOKEN_COOKIE_NAME,
    registerPassenger,
    loginUser,
    changePassword,
    createAirlineUser
};
