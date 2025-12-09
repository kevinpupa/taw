const Route = require('../models/route');

// Get all routes for an airline
const getRoutesByAirline = async (airlineId, page = 1, limit = 20, active = true) => {
    const query = { airline: airlineId };
    if (active) {
        query.isActive = true;
    }
    
    const routes = await Route.find(query)
        .populate('airline', 'name code')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ 'departureAirport.city': 1 });
    
    const total = await Route.countDocuments(query);
    
    return {
        routes,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// Get route by ID
const getRouteById = async (routeId, airlineId) => {
    const route = await Route.findOne({
        _id: routeId,
        airline: airlineId
    }).populate('airline', 'name code');
    
    if (!route) {
        throw new Error('Route not found');
    }
    
    return route;
};

// Create route
const createRoute = async (airlineId, data) => {
    const { departureAirport, arrivalAirport, duration, distance } = data;
    
    // Ensure departure and arrival are different
    if (departureAirport.code.toUpperCase() === arrivalAirport.code.toUpperCase()) {
        throw new Error('Departure and arrival airports must be different');
    }
    
    const route = new Route({
        airline: airlineId,
        departureAirport: {
            ...departureAirport,
            code: departureAirport.code.toUpperCase()
        },
        arrivalAirport: {
            ...arrivalAirport,
            code: arrivalAirport.code.toUpperCase()
        },
        duration,
        distance
    });
    
    try {
        await route.save();
        return route;
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('This route already exists for your airline');
        }
        throw error;
    }
};

// Update route
const updateRoute = async (routeId, airlineId, data) => {
    const route = await Route.findOne({
        _id: routeId,
        airline: airlineId
    });
    
    if (!route) {
        throw new Error('Route not found');
    }
    
    // Only allow updating duration and distance (not airports)
    const allowedFields = ['duration', 'distance'];
    
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            route[field] = data[field];
        }
    }
    
    await route.save();
    return route;
};

// Deactivate route
const deactivateRoute = async (routeId, airlineId) => {
    const route = await Route.findOne({
        _id: routeId,
        airline: airlineId
    });
    
    if (!route) {
        throw new Error('Route not found');
    }
    
    route.isActive = false;
    await route.save();
    
    return route;
};

module.exports = {
    getRoutesByAirline,
    getRouteById,
    createRoute,
    updateRoute,
    deactivateRoute
};
