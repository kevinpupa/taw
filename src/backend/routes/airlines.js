const express = require('express');
const { body, param } = require('express-validator');
const airlineController = require('../controllers/airlines');
const { authenticate, isAdmin, isAirline } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all airlines (public)
router.get('/', airlineController.getAllAirlines);

// Get airline by ID (public)
router.get('/:id', [
    param('id').isMongoId().withMessage('Invalid airline ID')
], validate, airlineController.getAirlineById);

// Create airline (admin only)
router.post('/', authenticate, isAdmin, [
    body('name').trim().notEmpty().withMessage('Airline name is required'),
    body('code').trim().isLength({ min: 2, max: 3 }).withMessage('Airline code must be 2-3 characters'),
    body('country').trim().notEmpty().withMessage('Country is required'),
    body('description').optional().trim()
], validate, airlineController.createAirline);

// Update airline (admin or airline user of that airline)
router.put('/:id', authenticate, [
    param('id').isMongoId().withMessage('Invalid airline ID'),
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('description').optional().trim(),
    body('logo').optional()
], validate, airlineController.updateAirline);

// Delete/deactivate airline (admin only)
router.delete('/:id', authenticate, isAdmin, [
    param('id').isMongoId().withMessage('Invalid airline ID')
], validate, airlineController.deleteAirline);

module.exports = router;

