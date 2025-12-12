const express = require('express');
const { body, param } = require('express-validator');
const { authenticate, isAdmin } = require('../middleware/auth');
const { validate } = require('../middleware/validation');
const User = require('../models/user');
const Airline = require('../models/airline');
const Flight = require('../models/flight');
const Ticket = require('../models/ticket');

const router = express.Router();

// All routes require admin authentication
router.use(authenticate, isAdmin);

// ===== AIRLINE MANAGEMENT =====

// Create airline with initial airline_admin user
router.post('/airlines', [
    body('name').trim().notEmpty().withMessage('Airline name is required'),
    body('code').trim().isLength({ min: 2, max: 3 }).withMessage('Airline code must be 2-3 characters'),
    body('adminFullName').trim().notEmpty().withMessage('Admin full name is required'),
    body('adminEmail').isEmail().normalizeEmail().withMessage('Valid admin email is required'),
    body('adminPassword').isLength({ min: 6 }).withMessage('Admin password must be at least 6 characters'),
    body('taxCode').optional().trim(),
    body('hqAddress').optional().trim()
], validate, async (req, res, next) => {
    try {
        const { name, code, adminFullName, adminEmail, adminPassword, taxCode, hqAddress } = req.body;
        
        // Check if airline code already exists
        const existingAirline = await Airline.findOne({ code });
        if (existingAirline) {
            return res.status(409).json({ error: { message: 'Airline with this code already exists' } });
        }
        
        // Check if admin email already exists
        const existingUser = await User.findOne({ email: adminEmail });
        if (existingUser) {
            return res.status(409).json({ error: { message: 'User with this email already exists' } });
        }
        
        // Create airline
        const airline = new Airline({
            name,
            code,
            taxCode,
            hqAddress,
            createdBy: req.user._id
        });
        await airline.save();
        
        // Create airline_admin user
        const adminUser = new User({
            fullName: adminFullName,
            email: adminEmail,
            password: adminPassword,
            role: 'airline_admin',
            airline: airline._id
        });
        await adminUser.save();
        
        res.status(201).json({
            message: 'Airline and admin user created successfully',
            airline,
            adminUser: adminUser.toJSON()
        });
    } catch (error) {
        next(error);
    }
});

// List all airlines
router.get('/airlines', async (req, res, next) => {
    try {
        const airlines = await Airline.find({ isActive: true })
            .select('name code taxCode hqAddress createdAt');
        res.json({ airlines });
    } catch (error) {
        next(error);
    }
});

// Get airline by ID
router.get('/airlines/:id', [
    param('id').isMongoId().withMessage('Invalid airline ID')
], validate, async (req, res, next) => {
    try {
        const airline = await Airline.findById(req.params.id);
        if (!airline) {
            return res.status(404).json({ error: { message: 'Airline not found' } });
        }
        res.json({ airline });
    } catch (error) {
        next(error);
    }
});

// Soft-delete airline (cascades: cancel flights, cancel tickets, free seats, broadcast notifications)
router.delete('/airlines/:id', [
    param('id').isMongoId().withMessage('Invalid airline ID')
], validate, async (req, res, next) => {
    try {
        const airline = await Airline.findById(req.params.id);
        if (!airline) {
            return res.status(404).json({ error: { message: 'Airline not found' } });
        }
        
        // Soft-delete airline
        airline.isActive = false;
        await airline.save();
        
        // Find all flights for this airline and cancel them
        const flights = await Flight.find({ airline: airline._id, status: { $ne: 'cancelled' } });
        
        for (const flight of flights) {
            // Cancel flight
            flight.status = 'cancelled';
            await flight.save();
            
            // Find all tickets for this flight and cancel them
            const tickets = await Ticket.find({ 
                flight: flight._id, 
                status: 'confirmed' 
            });
            
            for (const ticket of tickets) {
                ticket.status = 'cancelled';
                await ticket.save();
            }
            
            // Broadcast flight cancellation via socket (if available)
            const seatHandler = req.app.locals.seatHandler;
            if (seatHandler) {
                seatHandler.broadcastFlightUpdate(flight._id, {
                    status: 'cancelled',
                    message: 'Flight cancelled due to airline deactivation'
                });
            }
        }
        
        res.json({ 
            message: 'Airline deactivated and cascading cancellations processed',
            airline,
            cancelledFlights: flights.length
        });
    } catch (error) {
        next(error);
    }
});

// ===== USER MANAGEMENT =====

// List all users
router.get('/users', async (req, res, next) => {
    try {
        const { role, active = true } = req.query;
        const query = {};
        
        if (role) {
            query.role = role;
        }
        if (active !== undefined) {
            query.isActive = active === 'true';
        }
        
        const users = await User.find(query)
            .populate('airline', 'name code')
            .select('-password')
            .sort({ createdAt: -1 });
        
        res.json({ users });
    } catch (error) {
        next(error);
    }
});

// Get user by ID
router.get('/users/:id', [
    param('id').isMongoId().withMessage('Invalid user ID')
], validate, async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id)
            .populate('airline', 'name code')
            .select('-password');
        
        if (!user) {
            return res.status(404).json({ error: { message: 'User not found' } });
        }
        
        res.json({ user });
    } catch (error) {
        next(error);
    }
});

// Soft-delete user (cascades: if passenger, cancel tickets and free seats; if airline_admin, mark airline as deleted)
router.delete('/users/:id', [
    param('id').isMongoId().withMessage('Invalid user ID')
], validate, async (req, res, next) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: { message: 'User not found' } });
        }
        
        // Soft-delete user
        user.isActive = false;
        await user.save();
        
        // Handle cascading for passengers
        if (user.role === 'passenger') {
            const tickets = await Ticket.find({ 
                passenger: user._id, 
                status: 'confirmed' 
            }).populate('flight');
            
            for (const ticket of tickets) {
                ticket.status = 'cancelled';
                await ticket.save();
                
                // Free the seat
                const flight = ticket.flight;
                if (flight) {
                    await Flight.findByIdAndUpdate(
                        flight._id,
                        { $pull: { bookedSeats: ticket.seatNumber } }
                    );
                    
                    // Broadcast seat update
                    const seatHandler = req.app.locals.seatHandler;
                    if (seatHandler) {
                        seatHandler.broadcastSeatUpdate(flight._id, flight.bookedSeats || [], 0);
                    }
                }
            }
        }
        
        // Handle cascading for airline_admin
        if (user.role === 'airline_admin' && user.airline) {
            const airline = await Airline.findById(user.airline);
            if (airline) {
                airline.isActive = false;
                await airline.save();
                
                // Cancel all flights and tickets (same as airline deletion)
                const flights = await Flight.find({ airline: airline._id, status: { $ne: 'cancelled' } });
                
                for (const flight of flights) {
                    flight.status = 'cancelled';
                    await flight.save();
                    
                    const tickets = await Ticket.find({ flight: flight._id, status: 'confirmed' });
                    for (const ticket of tickets) {
                        ticket.status = 'cancelled';
                        await ticket.save();
                    }
                    
                    const seatHandler = req.app.locals.seatHandler;
                    if (seatHandler) {
                        seatHandler.broadcastFlightUpdate(flight._id, { status: 'cancelled' });
                    }
                }
            }
        }
        
        res.json({ message: 'User deactivated', user });
    } catch (error) {
        next(error);
    }
});

module.exports = router;
