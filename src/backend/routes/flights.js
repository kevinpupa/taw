const express = require('express');
const { body, param, query } = require('express-validator');
const flightController = require('../controllers/flights');
const { authenticate, isAirline, optionalAuth } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all flights for the authenticated airline user
router.get('/', authenticate, isAirline, flightController.getFlights);

// Get flight statistics (airline only)
router.get('/stats/overview', authenticate, isAirline, flightController.getFlightStats);

// Get flight by ID (public - for viewing flight details)
router.get('/:id', optionalAuth, [
    param('id').isMongoId().withMessage('Invalid flight ID')
], validate, flightController.getFlightById);

// Seat map for a flight (public)
router.get('/:id/seat-map', [
    param('id').isMongoId().withMessage('Invalid flight ID')
], validate, flightController.getSeatMap);

// Create flight (airline only)
router.post('/', authenticate, isAirline, [
    body('flightNumber').trim().notEmpty().withMessage('Flight number is required'),
    body('routeId').isMongoId().withMessage('Valid route ID is required'),
    body('aircraftId').isMongoId().withMessage('Valid aircraft ID is required'),
    body('departureTime').isISO8601().withMessage('Valid departure time is required'),
    body('pricing').isArray({ min: 1 }).withMessage('Pricing is required'),
    body('pricing.*.class').isIn(['economy', 'business', 'first']).withMessage('Invalid ticket class'),
    body('pricing.*.basePrice').isFloat({ min: 0 }).withMessage('Base price must be non-negative'),
    body('extraBaggagePrice').optional().isFloat({ min: 0 }).withMessage('Extra baggage price must be non-negative')
], validate, flightController.createFlight);

// Update flight (airline only)
router.put('/:id', authenticate, isAirline, [
    param('id').isMongoId().withMessage('Invalid flight ID'),
    body('departureTime').optional().isISO8601().withMessage('Valid departure time is required'),
    body('pricing').optional().isArray({ min: 1 }).withMessage('Pricing must be an array'),
    body('status').optional().isIn(['scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed']).withMessage('Invalid status')
], validate, flightController.updateFlight);

// Cancel flight (airline only)
router.post('/:id/cancel', authenticate, isAirline, [
    param('id').isMongoId().withMessage('Invalid flight ID')
], validate, flightController.cancelFlight);

module.exports = router;
