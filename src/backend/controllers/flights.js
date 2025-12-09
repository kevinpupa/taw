const flightService = require('../services/flights');

// Get flights for airline
const getFlights = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, status, from, to } = req.query;
        
        const result = await flightService.getFlightsByAirline(
            req.user.airline._id,
            page,
            limit,
            { status, from, to }
        );
        
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Get flight by ID
const getFlightById = async (req, res, next) => {
    try {
        const result = await flightService.getFlightById(req.params.id);
        res.json(result);
    } catch (error) {
        if (error.message === 'Flight not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Create flight
const createFlight = async (req, res, next) => {
    try {
        const flight = await flightService.createFlight(
            req.user.airline._id,
            req.body
        );
        
        res.status(201).json({
            message: 'Flight created successfully',
            flight
        });
    } catch (error) {
        if (error.message.includes('Route not found') || error.message.includes('Aircraft not found')) {
            return res.status(404).json({ error: { message: error.message } });
        }
        if (error.message === 'A flight with this number already exists at this time') {
            return res.status(409).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Update flight
const updateFlight = async (req, res, next) => {
    try {
        const flight = await flightService.updateFlight(
            req.params.id,
            req.user.airline._id,
            req.body
        );
        
        res.json({ flight });
    } catch (error) {
        if (error.message === 'Flight not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Cancel flight
const cancelFlight = async (req, res, next) => {
    try {
        const flight = await flightService.cancelFlight(
            req.params.id,
            req.user.airline._id
        );
        
        res.json({ message: 'Flight cancelled successfully', flight });
    } catch (error) {
        if (error.message === 'Flight not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Get flight statistics
const getFlightStats = async (req, res, next) => {
    try {
        const { from, to } = req.query;
        
        const stats = await flightService.getFlightStats(
            req.user.airline._id,
            { from, to }
        );
        
        res.json(stats);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getFlights,
    getFlightById,
    createFlight,
    updateFlight,
    cancelFlight,
    getFlightStats
};
