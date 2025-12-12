const express = require('express');
const { query } = require('express-validator');
const searchController = require('../controllers/search');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Search flights (public)
router.get('/flights', [
    query('from').trim().notEmpty().withMessage('Departure city or airport code is required'),
    query('to').trim().notEmpty().withMessage('Arrival city or airport code is required'),
    query('date').isISO8601().withMessage('Valid date is required'),
    query('passengers').optional().isInt({ min: 1, max: 9 }).withMessage('Passengers must be 1-9'),
    query('class').optional().isIn(['economy', 'business', 'first']).withMessage('Invalid class'),
    query('sort').optional().isIn(['price', 'duration', 'departure', 'stops']).withMessage('Invalid sort option'),
    query('order').optional().isIn(['asc', 'desc']).withMessage('Invalid order'),
    query('maxStops').optional().isInt({ min: 0, max: 1 }).withMessage('Max stops must be 0 or 1')
], validate, searchController.searchFlights);

// Get available airports (public)
router.get('/airports', searchController.getAvailableAirports);

// Get arrivals for a departure airport (public)
router.get('/airports/arrivals', [
    query('from').trim().notEmpty().withMessage('from (departure code) is required')
], validate, searchController.getArrivalsForDeparture);

// Get departures for an arrival airport (public)
router.get('/airports/departures', [
    query('to').trim().notEmpty().withMessage('to (arrival code) is required')
], validate, searchController.getDeparturesForArrival);

module.exports = router;
