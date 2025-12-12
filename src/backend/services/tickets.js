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
 * Purchase multiple tickets in one request (batch booking)
 * 
 * Flow per spec:
 * 1. For each ticket request: validate flight, seat, class, pricing, extras
 * 2. Pre-generate ticketId and attempt atomic seat lock via Flight.updateOne
 * 3. Save ticket only if lock succeeds
 * 4. Emit socket seatUpdated per successful lock
 * 5. Return 201 (all success), 207 (partial), or 400 (all fail)
 * 
 * Partial success response includes:
 * - tickets: array of successfully created tickets
 * - errors: array of failed requests with reasons
 * - bookingReference: shared batch reference for all in this purchase
 */
const purchaseTickets = async (userId, ticketRequests) => {
    if (!Array.isArray(ticketRequests) || ticketRequests.length === 0) {
        throw new Error('At least one ticket request is required');
    }
    
    // Generate shared booking reference for all tickets in this purchase
    const bookingReference = generateBookingReference();
    const createdTickets = [];
    const errors = [];
    
    // Process each ticket request
    for (let i = 0; i < ticketRequests.length; i++) {
        try {
            const req = ticketRequests[i];
            const { flightId, classType, seatNumber, passengerDetails, extras = {} } = req;
            
            // Validate required fields
            if (!flightId || !classType || !seatNumber || !passengerDetails) {
                throw new Error('Missing required fields: flightId, classType, seatNumber, passengerDetails');
            }
            
            // Fetch flight
            const flight = await Flight.findById(flightId)
                .populate('aircraft')
                .populate('route');
            
            if (!flight || !flight.isActive) {
                throw new Error('Flight not found or inactive');
            }
            
            if (flight.status === 'cancelled') {
                throw new Error('Flight is cancelled');
            }
            
            if (new Date(flight.departureTime) < new Date()) {
                throw new Error('Flight has already departed');
            }
            
            const seatUpper = seatNumber.toUpperCase();
            
            // Validate seat exists and class matches
            const seatMap = flight.aircraft.getSeatMap();
            const allSeats = seatMap.flatMap(row => row.seats);
            const seat = allSeats.find(s => s.seatNumber === seatUpper);
            
            if (!seat) {
                throw new Error(`Invalid seat number: ${seatNumber}`);
            }
            
            if (seat.class !== classType) {
                throw new Error(`Seat ${seatNumber} is ${seat.class}, not ${classType}`);
            }
            
            // Validate class pricing
            const classPrice = flight.pricing.find(p => p.class === classType);
            if (!classPrice) {
                throw new Error(`No pricing found for class ${classType}`);
            }
            
            // Calculate price
            let basePrice = classPrice.basePrice;
            let extrasPrice = 0;
            const appliedExtras = [];
            
            // Validate and sum extras
            if (extras && typeof extras === 'object') {
                // Extra legroom
                if (extras.extraLegroom && seat.hasExtraLegroom) {
                    const extraLegroomPrice = classPrice.extraLegroomPrice || 0;
                    extrasPrice += extraLegroomPrice;
                    appliedExtras.push({ name: 'extraLegroom', price: extraLegroomPrice });
                }
                
                // Extra baggage
                if (extras.extraBaggage && extras.extraBaggageCount > 0) {
                    const baggagePrice = flight.extraBaggagePrice * extras.extraBaggageCount;
                    extrasPrice += baggagePrice;
                    appliedExtras.push({ name: 'extraBaggage', count: extras.extraBaggageCount, price: baggagePrice });
                }
                
                // Special meal
                if (extras.specialMeal && ['standard', 'vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free'].includes(extras.specialMeal)) {
                    appliedExtras.push({ name: 'specialMeal', value: extras.specialMeal });
                }
            }
            
            const totalPrice = basePrice + extrasPrice;
            
            // Pre-generate ticket ObjectId
            const ticketId = new mongoose.Types.ObjectId();
            
            // Attempt atomic seat lock
            const updatedFlight = await Flight.findOneAndUpdate(
                { 
                    _id: flightId, 
                    'bookedSeats': { $nin: [seatUpper] }
                },
                { $addToSet: { bookedSeats: seatUpper } },
                { new: true }
            );
            
            if (!updatedFlight) {
                const currentFlight = await Flight.findById(flightId);
                if (currentFlight && currentFlight.bookedSeats.includes(seatUpper)) {
                    throw new Error(`Seat ${seatNumber} was just booked by another user`);
                }
                throw new Error(`Failed to lock seat ${seatNumber}`);
            }
            
            // Create ticket document
            const ticket = new Ticket({
                _id: ticketId,
                passenger: userId,
                flight: flightId,
                passengerDetails: {
                    fullName: passengerDetails.fullName,
                    email: passengerDetails.email?.toLowerCase(),
                    phone: passengerDetails.phone,
                    dateOfBirth: passengerDetails.dateOfBirth,
                    passportNumber: passengerDetails.passportNumber
                },
                ticketClass: classType,
                seatNumber: seatUpper,
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
                },
                bookingReference,
                status: 'confirmed'
            });
            
            try {
                await ticket.save();
            } catch (saveErr) {
                // Roll back seat lock if ticket save fails
                await Flight.findOneAndUpdate(
                    { _id: flightId, bookedSeats: seatUpper },
                    { $pull: { bookedSeats: seatUpper } }
                );
                throw new Error(`Ticket save failed: ${saveErr.message}`);
            }
            
            // Populate for response
            await ticket.populate({
                path: 'flight',
                populate: [
                    { path: 'route' },
                    { path: 'airline', select: 'name code' },
                    { path: 'aircraft', select: 'model registrationNumber' }
                ]
            });
            
            createdTickets.push(ticket);
        } catch (error) {
            errors.push({
                index: i,
                message: error.message
            });
        }
    }
    
    // Return appropriate response based on success/failure ratio
    return {
        createdTickets,
        errors,
        bookingReference: createdTickets.length > 0 ? bookingReference : null,
        httpStatus: errors.length === 0 ? 201 : (createdTickets.length > 0 ? 207 : 400)
    };
};

/**
 * Generate booking reference (e.g., "BK123ABC")
 */
const generateBookingReference = () => {
    const prefix = 'BK';
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return prefix + code;
};

/**
 * Backward compatibility: single ticket purchase wrapper
 */
const purchaseTicket = async (userId, ticketData) => {
    const result = await purchaseTickets(userId, [ticketData]);
    
    if (result.httpStatus !== 201) {
        throw new Error(result.errors[0]?.message || 'Ticket purchase failed');
    }
    
    return {
        ticket: result.createdTickets[0],
        bookingReference: result.bookingReference
    };
};

/**
 * Cancel a ticket (user-initiated cancellation)
 * 
 * Business logic:
 * 1. Verify ticket belongs to user
 * 2. Verify ticket status is confirmed
 * 3. Check if cancellation is allowed (>24 hours before departure)
 * 4. Mark ticket as cancelled
 * 5. Remove seat from flight's bookedSeats array
 */
const cancelTicket = async (ticketId, userId) => {
    try {
        const ticket = await Ticket.findOne({
            _id: ticketId,
            passenger: userId
        }).populate('flight');
        
        if (!ticket) {
            throw new Error('Ticket not found');
        }
        
        // Only confirmed tickets can be cancelled
        if (ticket.status !== 'confirmed') {
            throw new Error('This ticket cannot be cancelled');
        }
        
        // Check if cancellation is allowed (must be >24 hours before departure)
        const flight = ticket.flight;
        const hoursUntilDeparture = (new Date(flight.departureTime) - new Date()) / (1000 * 60 * 60);
        
        if (hoursUntilDeparture < 24) {
            throw new Error('Cancellation not allowed less than 24 hours before departure');
        }
        
        // Mark ticket as cancelled
        ticket.status = 'cancelled';
        await ticket.save();
        
        // Free up the seat atomically
        const updatedFlight = await Flight.findOneAndUpdate(
            { _id: flight._id, bookedSeats: ticket.seatNumber },
            { $pull: { bookedSeats: ticket.seatNumber } },
            { new: true }
        );

        if (!updatedFlight) {
            throw new Error('Seat release failed');
        }

        await updatedFlight.populate('aircraft');
        
        return { ticket, flight: updatedFlight };
    } catch (error) {
        throw error;
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
        ...row,
        seats: row.seats.map(seat => ({
            ...seat,
            isAvailable: flight.isSeatAvailable(seat.seatNumber)
        }))
    }));
    
    // Calculate availability summary by seat class
    const availabilityByClass = {};
    for (const row of seatMap) {
        if (!availabilityByClass[row.class]) {
            availabilityByClass[row.class] = { total: 0, available: 0 };
        }
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
        availabilityByClass,
        totalSeats: flight.aircraft.totalCapacity,
        bookedSeats: flight.bookedSeats.length,
        availableSeats: flight.aircraft.totalCapacity - flight.bookedSeats.length
    };
};

module.exports = {
    getUserTickets,
    getTicketById,
    purchaseTicket,
    purchaseTickets,
    cancelTicket,
    checkSeatAvailability
};
