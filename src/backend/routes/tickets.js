const express = require('express');
const { body, param } = require('express-validator');
const ticketController = require('../controllers/tickets');
const { authenticate } = require('../middleware/auth');
const { validate } = require('../middleware/validation');

const router = express.Router();

// Get user's bookings (my-bookings route for clarity in frontend)
router.get('/my-bookings', authenticate, ticketController.getUserTickets);

// Get user's tickets (pagination support)
router.get('/', authenticate, ticketController.getUserTickets);

// Purchase ticket(s) - supports single ticket or batch ticketRequests array
router.post('/', authenticate, [
    body('ticketRequests').optional().isArray({ min: 1 }).withMessage('ticketRequests must be an array'),
    body('ticketRequests.*.flightId').optional().isMongoId().withMessage('Valid flight ID is required'),
    body('ticketRequests.*.classType').optional().isIn(['economy', 'business', 'first']).withMessage('Invalid ticket class'),
    body('ticketRequests.*.seatNumber').optional().trim().notEmpty().withMessage('Seat number is required'),
    body('ticketRequests.*.passengerDetails.fullName').optional().trim().notEmpty().withMessage('Passenger full name is required'),
    body('ticketRequests.*.passengerDetails.email').optional().isEmail().withMessage('Valid passenger email is required'),
    body('flightId').optional().isMongoId().withMessage('Valid flight ID is required'),
    body('classType').optional().isIn(['economy', 'business', 'first']).withMessage('Invalid ticket class'),
    body('seatNumber').optional().trim().notEmpty().withMessage('Seat number is required'),
    body('passengerDetails.fullName').optional().trim().notEmpty().withMessage('Passenger full name is required'),
    body('passengerDetails.email').optional().isEmail().withMessage('Valid passenger email is required')
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
