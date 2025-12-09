const aircraftService = require('../services/aircraft');

// Get all aircraft for the authenticated airline user
const getAircraft = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, active = 'true' } = req.query;
        
        const result = await aircraftService.getAircraftByAirline(
            req.user.airline._id,
            page,
            limit,
            active === 'true'
        );
        
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Get aircraft by ID
const getAircraftById = async (req, res, next) => {
    try {
        const aircraft = await aircraftService.getAircraftById(
            req.params.id,
            req.user.airline._id
        );
        
        res.json({
            aircraft,
            seatMap: aircraft.getSeatMap()
        });
    } catch (error) {
        if (error.message === 'Aircraft not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Create aircraft
const createAircraft = async (req, res, next) => {
    try {
        const aircraft = await aircraftService.createAircraft(
            req.user.airline._id,
            req.body
        );
        
        res.status(201).json({
            message: 'Aircraft created successfully',
            aircraft,
            seatMap: aircraft.getSeatMap()
        });
    } catch (error) {
        if (error.message === 'Aircraft with this registration number already exists') {
            return res.status(409).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Update aircraft
const updateAircraft = async (req, res, next) => {
    try {
        const aircraft = await aircraftService.updateAircraft(
            req.params.id,
            req.user.airline._id,
            req.body
        );
        
        res.json({
            aircraft,
            seatMap: aircraft.getSeatMap()
        });
    } catch (error) {
        if (error.message === 'Aircraft not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Delete/deactivate aircraft
const deleteAircraft = async (req, res, next) => {
    try {
        await aircraftService.deactivateAircraft(
            req.params.id,
            req.user.airline._id
        );
        
        res.json({ message: 'Aircraft deactivated successfully' });
    } catch (error) {
        if (error.message === 'Aircraft not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

module.exports = {
    getAircraft,
    getAircraftById,
    createAircraft,
    updateAircraft,
    deleteAircraft
};
