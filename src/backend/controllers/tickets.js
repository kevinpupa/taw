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

// Purchase ticket(s)
const purchaseTicket = async (req, res, next) => {
    try {
        // Handle both single ticket and array of tickets
        const ticketData = Array.isArray(req.body.ticketRequests) 
            ? req.body.ticketRequests 
            : [req.body];
        
        const result = await ticketService.purchaseTickets(req.user._id, ticketData);
        
        // Broadcast seat updates for each successfully locked seat
        const seatHandler = req.app.locals.seatHandler;
        if (seatHandler && result.createdTickets?.length) {
            for (const ticket of result.createdTickets) {
                try {
                    // Refresh flight to get latest bookedSeats and capacity
                    const flightDoc = await ticket.flight?.populate({ path: 'aircraft', select: 'totalCapacity' })
                        || await ticketService.getFlightById?.(ticket.flight);
                    const bookedSeats = flightDoc?.bookedSeats || [];
                    const totalCap = flightDoc?.aircraft?.totalCapacity || 0;
                    seatHandler.broadcastSeatUpdate(ticket.flight._id || ticket.flight, bookedSeats, totalCap);
                } catch (err) {
                    console.warn('Seat broadcast refresh failed', err?.message || err);
                }
            }
        }
        
        // Return appropriate status code
        const statusCode = result.httpStatus;
        
        if (statusCode === 201) {
            res.status(201).json({
                message: 'All tickets purchased successfully',
                tickets: result.createdTickets,
                bookingReference: result.bookingReference
            });
        } else if (statusCode === 207) {
            res.status(207).json({
                message: 'Partial success: some tickets were purchased',
                tickets: result.createdTickets,
                errors: result.errors,
                bookingReference: result.bookingReference
            });
        } else {
            // Log failure reasons for debugging
            console.error('Ticket purchase failed:', JSON.stringify(result.errors));
            res.status(400).json({
                message: 'All ticket purchases failed',
                errors: result.errors
            });
        }
    } catch (error) {
        if (error.message.includes('Flight not found') || error.message.includes('Invalid seat')) {
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
