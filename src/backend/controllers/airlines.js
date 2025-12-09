const airlineService = require('../services/airlines');

// Get all airlines
const getAllAirlines = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, active = 'true' } = req.query;
        
        const result = await airlineService.getAllAirlines(
            page,
            limit,
            active === 'true'
        );
        
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Get airline by ID
const getAirlineById = async (req, res, next) => {
    try {
        const airline = await airlineService.getAirlineById(req.params.id);
        res.json({ airline });
    } catch (error) {
        if (error.message === 'Airline not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Create airline
const createAirline = async (req, res, next) => {
    try {
        const airline = await airlineService.createAirline(req.body);
        
        res.status(201).json({
            message: 'Airline created successfully',
            airline
        });
    } catch (error) {
        if (error.message === 'Airline with this name or code already exists') {
            return res.status(409).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Update airline
const updateAirline = async (req, res, next) => {
    try {
        const airline = await airlineService.updateAirline(
            req.params.id,
            req.body,
            req.user.role,
            req.user.airline ? req.user.airline._id.toString() : null
        );
        
        res.json({ airline });
    } catch (error) {
        if (error.message === 'Not authorized to update this airline') {
            return res.status(403).json({ error: { message: error.message } });
        }
        if (error.message === 'Airline not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Delete/deactivate airline
const deleteAirline = async (req, res, next) => {
    try {
        await airlineService.deactivateAirline(req.params.id);
        res.json({ message: 'Airline deactivated successfully' });
    } catch (error) {
        if (error.message === 'Airline not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

module.exports = {
    getAllAirlines,
    getAirlineById,
    createAirline,
    updateAirline,
    deleteAirline
};
