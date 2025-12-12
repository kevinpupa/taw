const searchService = require('../services/search');

// Search flights
const searchFlights = async (req, res, next) => {
    try {
        const {
            from,
            to,
            date,
            passengers = 1,
            class: ticketClass = 'economy',
            sort = 'price',
            order = 'asc',
            maxStops = 1
        } = req.query;
        
        const result = await searchService.searchFlights({
            from,
            to,
            date,
            passengers,
            ticketClass,
            sort,
            order,
            maxStops
        });
        
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Get available airports
const getAvailableAirports = async (req, res, next) => {
    try {
        const { q } = req.query;
        const result = await searchService.getAvailableAirports(q);
        res.json(result);
    } catch (error) {
        next(error);
    }
};

module.exports = {
    searchFlights,
    getAvailableAirports,
    getArrivalsForDeparture: async (req, res, next) => {
        try {
            const { from } = req.query;
            if (!from) return res.status(400).json({ error: { message: 'from is required' } });
            const result = await searchService.getArrivalsForDeparture(from);
            res.json(result);
        } catch (error) {
            next(error);
        }
    },
    getDeparturesForArrival: async (req, res, next) => {
        try {
            const { to } = req.query;
            if (!to) return res.status(400).json({ error: { message: 'to is required' } });
            const result = await searchService.getDeparturesForArrival(to);
            res.json(result);
        } catch (error) {
            next(error);
        }
    }
};
