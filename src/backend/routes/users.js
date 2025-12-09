const express = require('express');
const { body, param } = require('express-validator');
const userController = require('../controllers/users');
const { authenticate, isAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all users (admin only)
router.get('/', authenticate, isAdmin, userController.getAllUsers);

// Get user by ID (admin only)
router.get('/:id', authenticate, isAdmin, [
    param('id').isMongoId().withMessage('Invalid user ID')
], validate, userController.getUserById);

// Create airline user by invitation (admin only)
router.post('/invite-airline', authenticate, isAdmin, [
    body('fullName').trim().notEmpty().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('airlineId').isMongoId().withMessage('Valid airline ID is required'),
    body('temporaryPassword').isLength({ min: 6 }).withMessage('Temporary password must be at least 6 characters')
], validate, userController.createAirlineUser);

// Update user (admin or self)
router.put('/:id', authenticate, [
    param('id').isMongoId().withMessage('Invalid user ID'),
    body('fullName').optional().trim().notEmpty().withMessage('Full name cannot be empty'),
    body('phone').optional().trim()
], validate, userController.updateUser);

// Delete user (admin only)
router.delete('/:id', authenticate, isAdmin, [
    param('id').isMongoId().withMessage('Invalid user ID')
], validate, userController.deleteUser);

module.exports = router;
