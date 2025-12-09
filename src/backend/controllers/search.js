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
    getAvailableAirports
};
