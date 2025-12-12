const express = require('express');
const { body, param } = require('express-validator');
const routeController = require('../controllers/routes');
const { authenticate, isAirlineAdmin } = require('../middleware/auth');
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

// Get all routes for the authenticated airline_admin user
router.get('/', authenticate, isAirlineAdmin, routeController.getRoutes);

// Get route by ID
router.get('/:id', authenticate, isAirlineAdmin, [
    param('id').isMongoId().withMessage('Invalid route ID')
], validate, routeController.getRouteById);

// Create route (airline_admin only)
router.post('/', authenticate, isAirlineAdmin, airportValidation, validate, routeController.createRoute);

// Update route (airline_admin only)
router.put('/:id', authenticate, isAirlineAdmin, [
    param('id').isMongoId().withMessage('Invalid route ID'),
    body('duration').optional().isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
    body('distance').optional().isInt({ min: 0 }).withMessage('Distance must be positive')
], validate, routeController.updateRoute);

// Delete/deactivate route (airline_admin only)
router.delete('/:id', authenticate, isAirlineAdmin, [
    param('id').isMongoId().withMessage('Invalid route ID')
], validate, routeController.deleteRoute);

module.exports = router;
