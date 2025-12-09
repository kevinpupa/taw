const ticketService = require('../services/tickets');

// Get user's tickets
const getUserTickets = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status } = req.query;
        
        const result = await ticketService.getUserTickets(
            req.user._id,
            page,
            limit,
            status
        );
        
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Get ticket by ID or booking reference
const getTicketById = async (req, res, next) => {
    try {
        const ticket = await ticketService.getTicketById(
            req.params.identifier,
            req.user._id
        );
        
        res.json({ ticket });
    } catch (error) {
        if (error.message === 'Ticket not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Purchase ticket
const purchaseTicket = async (req, res, next) => {
    try {
        const result = await ticketService.purchaseTicket(req.user._id, req.body);
        
        // Broadcast seat update to all connected clients
        const seatHandler = req.app.locals.seatHandler;
        if (seatHandler && result.flight) {
            seatHandler.broadcastSeatUpdate(
                result.flight._id,
                result.flight.bookedSeats || [],
                result.flight.aircraft?.totalCapacity || 0
            );
        }
        
        res.status(201).json({
            message: 'Ticket purchased successfully',
            ticket: result.ticket,
            bookingReference: result.bookingReference
        });
    } catch (error) {
        if (error.message === 'Flight not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        if (error.message.includes('This flight has been cancelled') ||
            error.message.includes('Cannot book') ||
            error.message.includes('already booked') ||
            error.message.includes('Invalid seat') ||
            error.message.includes('not bookable')) {
            return res.status(400).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Cancel ticket
const cancelTicket = async (req, res, next) => {
    try {
        const { ticket, flight } = await ticketService.cancelTicket(req.params.id, req.user._id);

        // Broadcast freed seat
        const seatHandler = req.app.locals.seatHandler;
        if (seatHandler && flight) {
            seatHandler.broadcastSeatUpdate(
                flight._id,
                flight.bookedSeats || [],
                flight.aircraft?.totalCapacity || 0
            );
        }

        res.json({ message: 'Ticket cancelled successfully', ticket });
    } catch (error) {
        if (error.message === 'Ticket not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        if (error.message.includes('cannot be cancelled') ||
            error.message.includes('not allowed')) {
            return res.status(400).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Check seat availability
const checkSeatAvailability = async (req, res, next) => {
    try {
        const result = await ticketService.checkSeatAvailability(req.params.flightId);
        res.json(result);
    } catch (error) {
        if (error.message === 'Flight not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

module.exports = {
    getUserTickets,
    getTicketById,
    purchaseTicket,
    cancelTicket,
    checkSeatAvailability
};
