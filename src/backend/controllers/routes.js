const routeService = require('../services/routes');

// Get all routes
const getRoutes = async (req, res, next) => {
    try {
        const { page = 1, limit = 20, active = 'true' } = req.query;
        
        const result = await routeService.getRoutesByAirline(
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

// Get route by ID
const getRouteById = async (req, res, next) => {
    try {
        const route = await routeService.getRouteById(
            req.params.id,
            req.user.airline._id
        );
        
        res.json({ route });
    } catch (error) {
        if (error.message === 'Route not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Create route
const createRoute = async (req, res, next) => {
    try {
        const route = await routeService.createRoute(
            req.user.airline._id,
            req.body
        );
        
        res.status(201).json({
            message: 'Route created successfully',
            route
        });
    } catch (error) {
        if (error.message === 'Departure and arrival airports must be different') {
            return res.status(400).json({ error: { message: error.message } });
        }
        if (error.message === 'This route already exists for your airline') {
            return res.status(409).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Update route
const updateRoute = async (req, res, next) => {
    try {
        const route = await routeService.updateRoute(
            req.params.id,
            req.user.airline._id,
            req.body
        );
        
        res.json({ route });
    } catch (error) {
        if (error.message === 'Route not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Delete/deactivate route
const deleteRoute = async (req, res, next) => {
    try {
        await routeService.deactivateRoute(
            req.params.id,
            req.user.airline._id
        );
        
        res.json({ message: 'Route deactivated successfully' });
    } catch (error) {
        if (error.message === 'Route not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

module.exports = {
    getRoutes,
    getRouteById,
    createRoute,
    updateRoute,
    deleteRoute
};
