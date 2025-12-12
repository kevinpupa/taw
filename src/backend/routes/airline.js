const express = require('express');
const { body, param } = require('express-validator');
const aircraftController = require('../controllers/aircraft');
const routeController = require('../controllers/routes');
const flightController = require('../controllers/flights');
const { authenticate, isAirlineAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// All routes require airline_admin authentication
router.use(authenticate, isAirlineAdmin);

// Validate that user has an airline assignment
router.use((req, res, next) => {
    if (!req.user.airline) {
        return res.status(403).json({ error: { message: 'Airline assignment required for airline admin.' } });
    }
    next();
});

// ===== AIRLINE DETAILS =====
// Get airline details (coming from airlines controller)
router.get('/details', async (req, res) => {
    try {
        const airline = req.user.airline;
        if (!airline) {
            return res.status(404).json({ error: { message: 'Airline not found' } });
        }
        res.json({ airline });
    } catch (error) {
        res.status(500).json({ error: { message: error.message } });
    }
});

// ===== ROUTES =====
router.get('/routes', routeController.getRoutes);
router.post('/routes', [
    body('departureAirport.code').trim().isLength({ min: 3, max: 3 }).withMessage('Departure airport code must be 3 characters'),
    body('departureAirport.city').trim().notEmpty().withMessage('Departure city is required'),
    body('departureAirport.country').trim().notEmpty().withMessage('Departure country is required'),
    body('arrivalAirport.code').trim().isLength({ min: 3, max: 3 }).withMessage('Arrival airport code must be 3 characters'),
    body('arrivalAirport.city').trim().notEmpty().withMessage('Arrival city is required'),
    body('arrivalAirport.country').trim().notEmpty().withMessage('Arrival country is required'),
    body('duration').isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes')
], validate, routeController.createRoute);
router.get('/routes/:id', [
    param('id').isMongoId().withMessage('Invalid route ID')
], validate, routeController.getRouteById);
router.put('/routes/:id', [
    param('id').isMongoId().withMessage('Invalid route ID'),
    body('duration').optional().isInt({ min: 15 }).withMessage('Duration must be at least 15 minutes'),
    body('distance').optional().isInt({ min: 0 }).withMessage('Distance must be positive')
], validate, routeController.updateRoute);
router.delete('/routes/:id', [
    param('id').isMongoId().withMessage('Invalid route ID')
], validate, routeController.deleteRoute);

// ===== AIRCRAFT =====
router.get('/aircraft', aircraftController.getAircraft);
router.post('/aircraft', [
    body('model').trim().notEmpty().withMessage('Aircraft model is required'),
    body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
    body('seatConfiguration').isArray({ min: 1 }).withMessage('Seat configuration is required'),
    body('seatConfiguration.*.class').isIn(['economy', 'business', 'first']).withMessage('Invalid seat class'),
    body('seatConfiguration.*.rows').isInt({ min: 1 }).withMessage('Rows must be at least 1'),
    body('seatConfiguration.*.seatsPerRow').isInt({ min: 1, max: 10 }).withMessage('Seats per row must be 1-10')
], validate, aircraftController.createAircraft);
router.get('/aircraft/:id', [
    param('id').isMongoId().withMessage('Invalid aircraft ID')
], validate, aircraftController.getAircraftById);
router.put('/aircraft/:id', [
    param('id').isMongoId().withMessage('Invalid aircraft ID'),
    body('model').optional().trim().notEmpty().withMessage('Model cannot be empty'),
    body('seatConfiguration').optional().isArray({ min: 1 }).withMessage('Seat configuration must be an array')
], validate, aircraftController.updateAircraft);
router.delete('/aircraft/:id', [
    param('id').isMongoId().withMessage('Invalid aircraft ID')
], validate, aircraftController.deleteAircraft);

// ===== FLIGHTS =====
router.get('/flights', flightController.getFlights);
router.post('/flights', [
    body('flightNumber').trim().notEmpty().withMessage('Flight number is required'),
    body('routeId').isMongoId().withMessage('Valid route ID is required'),
    body('aircraftId').isMongoId().withMessage('Valid aircraft ID is required'),
    body('departureTime').isISO8601().withMessage('Valid departure time is required'),
    body('pricing').isArray({ min: 1 }).withMessage('Pricing is required'),
    body('pricing.*.class').isIn(['economy', 'business', 'first']).withMessage('Invalid ticket class'),
    body('pricing.*.basePrice').isFloat({ min: 0 }).withMessage('Base price must be non-negative'),
    body('extraBaggagePrice').optional().isFloat({ min: 0 }).withMessage('Extra baggage price must be non-negative')
], validate, flightController.createFlight);
router.get('/flights/:id', [
    param('id').isMongoId().withMessage('Invalid flight ID')
], validate, flightController.getFlightById);
router.put('/flights/:id', [
    param('id').isMongoId().withMessage('Invalid flight ID'),
    body('departureTime').optional().isISO8601().withMessage('Valid departure time is required'),
    body('pricing').optional().isArray({ min: 1 }).withMessage('Pricing must be an array'),
    body('status').optional().isIn(['scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed']).withMessage('Invalid status')
], validate, flightController.updateFlight);
router.post('/flights/:id/cancel', [
    param('id').isMongoId().withMessage('Invalid flight ID')
], validate, flightController.cancelFlight);

// ===== DASHBOARD STATS =====
router.get('/dashboard/stats', flightController.getFlightStats);

module.exports = router;
