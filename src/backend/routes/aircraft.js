const express = require('express');
const { body, param } = require('express-validator');
const aircraftController = require('../controllers/aircraft');
const { authenticate, isAirline } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get all aircraft for the authenticated airline user
router.get('/', authenticate, isAirline, aircraftController.getAircraft);

// Get aircraft by ID
router.get('/:id', authenticate, isAirline, [
    param('id').isMongoId().withMessage('Invalid aircraft ID')
], validate, aircraftController.getAircraftById);

// Create aircraft (airline only)
router.post('/', authenticate, isAirline, [
    body('model').trim().notEmpty().withMessage('Aircraft model is required'),
    body('registrationNumber').trim().notEmpty().withMessage('Registration number is required'),
    body('seatConfiguration').isArray({ min: 1 }).withMessage('Seat configuration is required'),
    body('seatConfiguration.*.class').isIn(['economy', 'business', 'first']).withMessage('Invalid seat class'),
    body('seatConfiguration.*.rows').isInt({ min: 1 }).withMessage('Rows must be at least 1'),
    body('seatConfiguration.*.seatsPerRow').isInt({ min: 1, max: 10 }).withMessage('Seats per row must be 1-10')
], validate, aircraftController.createAircraft);

// Update aircraft (airline only)
router.put('/:id', authenticate, isAirline, [
    param('id').isMongoId().withMessage('Invalid aircraft ID'),
    body('model').optional().trim().notEmpty().withMessage('Model cannot be empty'),
    body('seatConfiguration').optional().isArray({ min: 1 }).withMessage('Seat configuration must be an array')
], validate, aircraftController.updateAircraft);

// Delete/deactivate aircraft (airline only)
router.delete('/:id', authenticate, isAirline, [
    param('id').isMongoId().withMessage('Invalid aircraft ID')
], validate, aircraftController.deleteAircraft);

module.exports = router;
