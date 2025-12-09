const express = require('express');
const { body, param } = require('express-validator');
const routeController = require('../controllers/routes');
const { authenticate, isAirline } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Airport validation schema
const airportValidation = [
    body('departureAirport.code').trim().isLength({ min: 3, max: 3 }).withMessage('Departure airport code must be 3 characters'),
    body('departureAirport.city').trim().notEmpty().withMessage('Departure city is required'),
    body('departureAirport.country').trim().notEmpty().withMessage('Departure country is required'),
    body('arrivalAirport.code').trim().isLength({ min: 3, max: 3 }).withMessage('Arrival airport code must be 3 characters'),
    body('arrivalAirport.city').trim().notEmpty().withMessage('Arrival city is required'),
    body('arrivalAirport.country').trim().notEmpty().withMessage('Arrival country is required'),
    body('duration').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes')
];

// Get all routes for the authenticated airline user
router.get('/', authenticate, isAirline, routeController.getRoutes);

// Get route by ID
router.get('/:id', authenticate, isAirline, [
    param('id').isMongoId().withMessage('Invalid route ID')
], validate, routeController.getRouteById);

// Create route (airline only)
router.post('/', authenticate, isAirline, airportValidation, validate, routeController.createRoute);

// Update route (airline only)
router.put('/:id', authenticate, isAirline, [
    param('id').isMongoId().withMessage('Invalid route ID'),
    body('duration').optional().isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
    body('distance').optional().isInt({ min: 0 }).withMessage('Distance must be positive')
], validate, routeController.updateRoute);

// Delete/deactivate route (airline only)
router.delete('/:id', authenticate, isAirline, [
    param('id').isMongoId().withMessage('Invalid route ID')
], validate, routeController.deleteRoute);

module.exports = router;
