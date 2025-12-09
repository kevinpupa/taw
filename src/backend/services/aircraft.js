const Aircraft = require('../models/aircraft');

// Get all aircraft for an airline with pagination
const getAircraftByAirline = async (airlineId, page = 1, limit = 20, active = true) => {
    const query = { airline: airlineId };
    if (active) {
        query.isActive = true;
    }
    
    const aircraft = await Aircraft.find(query)
        .populate('airline', 'name code')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ model: 1 });
    
    const total = await Aircraft.countDocuments(query);
    
    return {
        aircraft,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// Get aircraft by ID and verify it belongs to the airline
const getAircraftById = async (aircraftId, airlineId) => {
    const aircraft = await Aircraft.findOne({
        _id: aircraftId,
        airline: airlineId
    }).populate('airline', 'name code');
    
    if (!aircraft) {
        throw new Error('Aircraft not found');
    }
    
    return aircraft;
};

// Create a new aircraft for an airline
const createAircraft = async (airlineId, data) => {
    const { model, registrationNumber, seatConfiguration } = data;
    
    const aircraft = new Aircraft({
        airline: airlineId,
        model,
        registrationNumber: registrationNumber.toUpperCase(),
        seatConfiguration
    });
    
    try {
        await aircraft.save();
        return aircraft;
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('Aircraft with this registration number already exists');
        }
        throw error;
    }
};

// Update aircraft
const updateAircraft = async (aircraftId, airlineId, data) => {
    const aircraft = await Aircraft.findOne({
        _id: aircraftId,
        airline: airlineId
    });
    
    if (!aircraft) {
        throw new Error('Aircraft not found');
    }
    
    const allowedFields = ['model', 'seatConfiguration'];
    
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            aircraft[field] = data[field];
        }
    }
    
    await aircraft.save();
    return aircraft;
};

// Deactivate aircraft
const deactivateAircraft = async (aircraftId, airlineId) => {
    const aircraft = await Aircraft.findOne({
        _id: aircraftId,
        airline: airlineId
    });
    
    if (!aircraft) {
        throw new Error('Aircraft not found');
    }
    
    aircraft.isActive = false;
    await aircraft.save();
    
    return aircraft;
};

module.exports = {
    getAircraftByAirline,
    getAircraftById,
    createAircraft,
    updateAircraft,
    deactivateAircraft
};
