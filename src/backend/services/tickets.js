const mongoose = require('mongoose');
const Ticket = require('../models/ticket');
const Flight = require('../models/flight');

/**
 * Get user's tickets with pagination
 * 
 * Libraries:
 * - mongoose: MongoDB ODM library
 * - .populate() with nested path: Load referenced documents recursively
 *   Example: flight is just an ID, but we also want the route, airline, aircraft
 */
const getUserTickets = async (userId, page = 1, limit = 20, status = null) => {
    const query = { passenger: userId };  // Only tickets for this user
    if (status) {
        query.status = status;  // Optional: filter by status (confirmed, cancelled, etc)
    }
    
    const tickets = await Ticket.find(query)
        .populate({
            path: 'flight',  // Load flight reference
            populate: [  // Also load nested references
                { path: 'route' },
                { path: 'airline', select: 'name code' },
                { path: 'aircraft', select: 'model' }
            ]
        })
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });  // Newest first
    
    const total = await Ticket.countDocuments(query);
    
    return {
        tickets,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

/**
 * Get ticket by ID or booking reference code
 * Users can lookup tickets by:
 * 1. MongoDB _id (internal database ID)
 * 2. bookingReference (user-friendly code like "BK123ABC")
 * 
 * Non-default function:
 * - mongoose.Types.ObjectId.isValid(): Check if string is valid MongoDB ID
 */
const getTicketById = async (identifier, userId) => {
    let ticket;
    
    // Check if identifier is a valid MongoDB ObjectId
    if (mongoose.Types.ObjectId.isValid(identifier)) {
        // Search by MongoDB ID
        ticket = await Ticket.findOne({
            _id: identifier,
            passenger: userId  // Security: only return if user owns it
        });
    } else {
        // Search by booking reference (e.g., "AB1234CD")
        ticket = await Ticket.findOne({
            bookingReference: identifier.toUpperCase(),
            passenger: userId
        });
    }
    
    if (!ticket) {
        throw new Error('Ticket not found');
    }
    
    // Load full flight and related data
    await ticket.populate({
        path: 'flight',
        populate: [
            { path: 'route' },
            { path: 'airline', select: 'name code' },
            { path: 'aircraft', select: 'model' }
        ]
    });
    
    return ticket;
};

/**
 * Purchase a ticket (book a seat on a flight)
 * 
 * IMPORTANT: Uses MongoDB transactions for data consistency
 * 
 * Libraries:
 * - mongoose.startSession(): Creates a database session for transactions
 * - session.startTransaction(): Begin atomic operation
 * - session.commitTransaction(): Save all changes
 * - session.abortTransaction(): Rollback all changes if error occurs
 * 
 * Non-default functions:
 * - .session(session): Execute query within transaction context
 * - .flatMap(): Flatten array and map (convert 2D array to 1D)
 * 
 * Business logic:
 * 1. Verify flight exists and is bookable
 * 2. Validate seat is available and matches ticket class
 * 3. Calculate ticket price including extras
 * 4. Create ticket record
 * 5. Add seat to flight's bookedSeats array
 * 6. Commit transaction (atomic - all or nothing)
 */
const purchaseTicket = async (userId, data) => {
    // Start transaction session
    // Transaction = multiple operations that succeed together or fail together
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const { flightId, ticketClass, seatNumber, passengerDetails, extras = {} } = data;
        
        // Get flight data (lock it during transaction)
        const flight = await Flight.findById(flightId)
            .populate('aircraft')
            .populate('route')
            .session(session);  // Use transaction session
        
        // Validate flight exists
        if (!flight || !flight.isActive) {
            await session.abortTransaction();  // Cancel all changes
            throw new Error('Flight not found');
        }
        
        // Validate flight is still bookable
        if (flight.status === 'cancelled') {
            await session.abortTransaction();
            throw new Error('This flight has been cancelled');
        }
        
        // Validate flight hasn't already departed
        if (new Date(flight.departureTime) < new Date()) {
            await session.abortTransaction();
            throw new Error('Cannot book a flight that has already departed');
        }
        
        // Check if seat is available
        if (!flight.isSeatAvailable(seatNumber.toUpperCase())) {
            await session.abortTransaction();
            throw new Error('This seat is already booked');
        }
        
        // Get all available seats from aircraft configuration
        const seatMap = flight.aircraft.getSeatMap();
        const allSeats = seatMap.flatMap(row => row.seats);  // Flatten 2D array to 1D
        const seat = allSeats.find(s => s.seatNumber === seatNumber.toUpperCase());
        
        // Validate seat exists on this aircraft
        if (!seat) {
            await session.abortTransaction();
            throw new Error('Invalid seat number for this aircraft');
        }
        
        // Validate seat class matches requested ticket class
        // (user can't book a first class ticket for an economy seat)
        if (seat.class !== ticketClass) {
            await session.abortTransaction();
            throw new Error(`Seat ${seatNumber} is in ${seat.class} class, not ${ticketClass}`);
        }
        
        // Get pricing for selected class
        const classPrice = flight.pricing.find(p => p.class === ticketClass);
        if (!classPrice) {
            await session.abortTransaction();
            throw new Error('Invalid ticket class for this flight');
        }
        
        // Calculate final price
        let basePrice = classPrice.basePrice;
        let extrasPrice = 0;
        
        // Add extra legroom cost if available and selected
        if (extras.extraLegroom && seat.hasExtraLegroom) {
            extrasPrice += classPrice.extraLegroomPrice || 0;
        }
        
        // Add extra baggage cost (multiply by number of baggage items)
        if (extras.extraBaggage && extras.extraBaggageCount > 0) {
            extrasPrice += flight.extraBaggagePrice * extras.extraBaggageCount;
        }
        
        const totalPrice = basePrice + extrasPrice;
        
        // Create new ticket document
        const ticket = new Ticket({
            passenger: userId,
            flight: flight._id,
            passengerDetails: {
                fullName: passengerDetails.fullName,
                email: passengerDetails.email.toLowerCase(),
                phone: passengerDetails.phone,
                dateOfBirth: passengerDetails.dateOfBirth,
                passportNumber: passengerDetails.passportNumber
            },
            ticketClass,
            seatNumber: seatNumber.toUpperCase(),
            extras: {
                extraLegroom: extras.extraLegroom || false,
                extraBaggage: extras.extraBaggage || false,
                extraBaggageCount: extras.extraBaggageCount || 0,
                specialMeal: extras.specialMeal || 'standard'
            },
            pricing: {
                basePrice,
                extrasPrice,
                totalPrice
            }
        });
        
        // Save ticket within transaction
        await ticket.save({ session });
        
        // Add seat atomically to avoid race conditions
        const seatToBook = seatNumber.toUpperCase();
        let updatedFlight = await Flight.findOneAndUpdate(
            { _id: flightId, bookedSeats: { $nin: [seatToBook] } },
            { $addToSet: { bookedSeats: seatToBook } },
            { session, new: true }
        );

        if (!updatedFlight) {
            await session.abortTransaction();
            throw new Error('This seat is already booked');
        }

        await updatedFlight.populate('aircraft');
        
        // Commit transaction - all changes are permanent
        await session.commitTransaction();
        
        // Populate related data for response
        await ticket.populate({
            path: 'flight',
            populate: [
                { path: 'route' },
                { path: 'airline', select: 'name code' },
                { path: 'aircraft', select: 'model' }
            ]
        });
        
        return {
            ticket,
            bookingReference: ticket.bookingReference,
            flight: updatedFlight
        };
    } catch (error) {
        // If any error occurs, rollback entire transaction
        await session.abortTransaction();
        throw error;
    } finally {
        // Always end session (cleanup)
        session.endSession();
    }
};

/**
 * Cancel a ticket
 * 
 * Business logic:
 * 1. Verify ticket belongs to user
 * 2. Verify ticket status is confirmed
 * 3. Check if cancellation is allowed (>24 hours before departure)
 * 4. Mark ticket as cancelled
 * 5. Remove seat from flight's bookedSeats array
 * 6. Commit transaction
 */
const cancelTicket = async (ticketId, userId) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    
    try {
        const ticket = await Ticket.findOne({
            _id: ticketId,
            passenger: userId
        }).populate('flight').session(session);
        
        if (!ticket) {
            await session.abortTransaction();
            throw new Error('Ticket not found');
        }
        
        // Only confirmed tickets can be cancelled
        if (ticket.status !== 'confirmed') {
            await session.abortTransaction();
            throw new Error('This ticket cannot be cancelled');
        }
        
        // Check if cancellation is allowed (must be >24 hours before departure)
        const flight = ticket.flight;
        const hoursUntilDeparture = (new Date(flight.departureTime) - new Date()) / (1000 * 60 * 60);
        
        if (hoursUntilDeparture < 24) {
            await session.abortTransaction();
            throw new Error('Cancellation not allowed less than 24 hours before departure');
        }
        
        // Mark ticket as cancelled
        ticket.status = 'cancelled';
        await ticket.save({ session });
        
        // Free up the seat atomically
        let updatedFlight = await Flight.findOneAndUpdate(
            { _id: flight._id, bookedSeats: ticket.seatNumber },
            { $pull: { bookedSeats: ticket.seatNumber } },
            { session, new: true }
        );

        if (!updatedFlight) {
            await session.abortTransaction();
            throw new Error('Seat release failed');
        }

        await updatedFlight.populate('aircraft');
        
        // Commit transaction
        await session.commitTransaction();
        
        return { ticket, flight: updatedFlight };
    } catch (error) {
        // Rollback on any error
        await session.abortTransaction();
        throw error;
    } finally {
        session.endSession();
    }
};

/**
 * Check real-time seat availability for a flight
 * Returns:
 * - Seat map with individual seat availability
 * - Availability summary by class (economy, business, first)
 * - Total available seats
 */
const checkSeatAvailability = async (flightId) => {
    const flight = await Flight.findById(flightId)
        .populate('aircraft');
    
    if (!flight || !flight.isActive) {
        throw new Error('Flight not found');
    }
    
    // Get seat map with real-time availability status
    const seatMap = flight.aircraft.getSeatMap().map(row => ({
        ...row,  // Keep row class and other properties
        seats: row.seats.map(seat => ({
            ...seat,  // Keep seat number and other properties
            isAvailable: flight.isSeatAvailable(seat.seatNumber)  // Check if booked
        }))
    }));
    
    // Calculate availability summary by seat class
    const availabilityByClass = {};
    for (const row of seatMap) {
        // Initialize counter for this class if not exists
        if (!availabilityByClass[row.class]) {
            availabilityByClass[row.class] = { total: 0, available: 0 };
        }
        // Count total and available seats in this class
        for (const seat of row.seats) {
            availabilityByClass[row.class].total++;
            if (seat.isAvailable) {
                availabilityByClass[row.class].available++;
            }
        }
    }
    
    return {
        flightId: flight._id,
        seatMap,
        availabilityByClass,  // { economy: { total: 100, available: 45 }, ... }
        totalSeats: flight.aircraft.totalCapacity,
        bookedSeats: flight.bookedSeats.length,
        availableSeats: flight.aircraft.totalCapacity - flight.bookedSeats.length
    };
};

module.exports = {
    getUserTickets,
    getTicketById,
    purchaseTicket,
    cancelTicket,
    checkSeatAvailability
};
