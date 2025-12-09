const express = require('express');
const { body, param } = require('express-validator');
const ticketController = require('../controllers/tickets');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get user's tickets
router.get('/', authenticate, ticketController.getUserTickets);

// Purchase ticket (create booking)
router.post('/', authenticate, [
    body('flightId').isMongoId().withMessage('Valid flight ID is required'),
    body('ticketClass').isIn(['economy', 'business', 'first']).withMessage('Invalid ticket class'),
    body('seatNumber').trim().notEmpty().withMessage('Seat number is required'),
    body('passengerDetails.fullName').trim().notEmpty().withMessage('Passenger full name is required'),
    body('passengerDetails.email').isEmail().withMessage('Valid passenger email is required'),
    body('extras.extraBaggage').optional().isBoolean(),
    body('extras.extraBaggageCount').optional().isInt({ min: 0, max: 5 }),
    body('extras.extraLegroom').optional().isBoolean(),
    body('extras.specialMeal').optional().isIn(['standard', 'vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free'])
], validate, ticketController.purchaseTicket);

// Cancel ticket
router.post('/:id/cancel', authenticate, [
    param('id').isMongoId().withMessage('Invalid ticket ID')
], validate, ticketController.cancelTicket);

// Check seat availability (real-time)
router.get('/availability/:flightId', [
    param('flightId').isMongoId().withMessage('Invalid flight ID')
], validate, ticketController.checkSeatAvailability);

// Get ticket by ID or booking reference
router.get('/:identifier', authenticate, ticketController.getTicketById);

module.exports = router;
