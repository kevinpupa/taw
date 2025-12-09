const express = require('express');
const { body } = require('express-validator');
const authService = require('../services/auth');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Register new passenger
router.post('/register', [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('phone').optional().trim()
], validate, async (req, res, next) => {
    try {
        const { user, token } = await authService.registerPassenger(req.body);
        res.status(201).json({
            message: 'Registration successful',
            user,
            token
        });
    } catch (error) {
        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: { message: error.message } });
        }
        next(error);
    }
});

// Login
router.post('/login', [
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password').notEmpty().withMessage('Password is required')
], validate, async (req, res, next) => {
    try {
        const { email, password } = req.body;
        const { user, token, mustChangePassword } = await authService.loginUser(email, password);
        
        res.json({
            message: 'Login successful',
            user,
            token,
            mustChangePassword
        });
    } catch (error) {
        if (error.message.includes('Invalid') || error.message.includes('deactivated')) {
            return res.status(401).json({ error: { message: error.message } });
        }
        next(error);
    }
});

// Get current user profile
router.get('/me', authenticate, async (req, res) => {
    res.json({ user: req.user });
});

// Change password
router.post('/change-password', authenticate, [
    body('currentPassword').notEmpty().withMessage('Current password is required'),
    body('newPassword').isLength({ min: 6 }).withMessage('New password must be at least 6 characters')
], validate, async (req, res, next) => {
    try {
        const { currentPassword, newPassword } = req.body;
        await authService.changePassword(req.user._id, currentPassword, newPassword);
        res.json({ message: 'Password changed successfully' });
    } catch (error) {
        if (error.message.includes('incorrect')) {
            return res.status(400).json({ error: { message: error.message } });
        }
        next(error);
    }
});

module.exports = router;
