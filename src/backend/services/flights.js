const Flight = require('../models/flight');
const Route = require('../models/route');
const Aircraft = require('../models/aircraft');
const Ticket = require('../models/ticket');

/**
 * Get flights for a specific airline
 * 
 * Non-default functions:
 * - .populate('field'): Load referenced documents from other collections
 *   Example: flight.route is just an ID, .populate('route') loads full route data
 */
const getFlightsByAirline = async (airlineId, page = 1, limit = 20, filters = {}) => {
    // Build MongoDB query with multiple conditions
    const query = { 
        airline: airlineId,
        isActive: true
    };
    
    // Add optional filters if provided
    if (filters.status) {
        query.status = filters.status;
    }
    
    // Handle date range filtering
    if (filters.from) {
        query.departureTime = { $gte: new Date(filters.from) };  // >= from date
    }
    
    if (filters.to) {
        query.departureTime = { 
            ...query.departureTime,  // Keep existing condition
            $lte: new Date(filters.to)  // <= to date
        };
    }
    
    const flights = await Flight.find(query)
        .populate('route')  // Load full route data
        .populate('aircraft', 'model registrationNumber totalCapacity')  // Only load specific fields
        .populate('airline', 'name code')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ departureTime: 1 });
    
    const total = await Flight.countDocuments(query);
    
    return {
        flights,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};
/**
 * Get flight by ID (public endpoint)
 * Shows seat map with real-time availability
 */
const getFlightById = async (flightId) => {
    const flight = await Flight.findById(flightId)
        .populate('route')
        .populate('aircraft')
        .populate('airline', 'name code');
    
    if (!flight || !flight.isActive) {
        throw new Error('Flight not found');
    }
    
    // Get seat map with availability info
    // This processes the aircraft seat configuration
    const seatMap = flight.aircraft.getSeatMap().map(row => ({
        ...row,  // Spread existing row data (class, seats array)
        seats: row.seats.map(seat => ({
            ...seat,  // Spread existing seat data
            isAvailable: flight.isSeatAvailable(seat.seatNumber)  // Check if seat is booked
        }))
    }));
    
    return {
        flight,
        seatMap,
        availableSeats: flight.aircraft.totalCapacity - flight.bookedSeats.length
    };
};

/**
 * Get seat map, pricing, and capacity for a flight (public)
 */
const getSeatMap = async (flightId) => {
    const flight = await Flight.findById(flightId)
        .populate('aircraft');

    if (!flight || !flight.isActive) {
        throw new Error('Flight not found');
    }

    const seatMap = flight.aircraft.getSeatMap().map(row => ({
        ...row,
        seats: row.seats.map(seat => ({
            ...seat,
            isAvailable: flight.isSeatAvailable(seat.seatNumber)
        }))
    }));

    return {
        flightId: flight._id,
        seatMap,
        pricing: {
            classes: flight.pricing,
            extraBaggagePrice: flight.extraBaggagePrice || 0
        },
        capacity: flight.aircraft.totalCapacity,
        bookedSeats: flight.bookedSeats || []
    };
};

/**
 * Create new flight
 * 
 * Business logic:
 * 1. Verify route belongs to the airline
 * 2. Verify aircraft belongs to the airline
 * 3. Calculate arrival time based on route duration
 * 4. Create flight record
 */
const createFlight = async (airlineId, data) => {
    const { flightNumber, routeId, aircraftId, departureTime, pricing, extraBaggagePrice } = data;
    
    // Verify route ownership
    const route = await Route.findOne({
        _id: routeId,
        airline: airlineId,
        isActive: true
    });
    
    if (!route) {
        throw new Error('Route not found or not owned by your airline');
    }
    
    // Verify aircraft ownership
    const aircraft = await Aircraft.findOne({
        _id: aircraftId,
        airline: airlineId,
        isActive: true
    });
    
    if (!aircraft) {
        throw new Error('Aircraft not found or not owned by your airline');
    }
    
    // Calculate arrival time
    // route.duration is in minutes, multiply by 60000 to convert to milliseconds
    const departure = new Date(departureTime);
    const arrival = new Date(departure.getTime() + route.duration * 60000);
    
    const flight = new Flight({
        flightNumber: flightNumber.toUpperCase(),
        route: route._id,
        aircraft: aircraft._id,
        airline: airlineId,
        departureTime: departure,
        arrivalTime: arrival,
        pricing,
        extraBaggagePrice: extraBaggagePrice || 30
    });
    
    try {
        await flight.save();
        
        // Populate for response
        await flight.populate('route');
        await flight.populate('aircraft', 'model registrationNumber totalCapacity');
        await flight.populate('airline', 'name code');
        
        return flight;
    } catch (error) {
        if (error.code === 11000) {
            throw new Error('A flight with this number already exists at this time');
        }
        throw error;
    }
};
/**
 * Update flight
 * Can update: departure time, pricing, status
 * Recalculates arrival time if departure changes
 */
const updateFlight = async (flightId, airlineId, data) => {
    const flight = await Flight.findOne({
        _id: flightId,
        airline: airlineId
    }).populate('route');
    
    if (!flight) {
        throw new Error('Flight not found');
    }
    
    const allowedFields = ['departureTime', 'pricing', 'status', 'extraBaggagePrice'];
    
    // Update only allowed fields
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            flight[field] = data[field];
        }
    }
    
    // If departure time changed, recalculate arrival
    if (data.departureTime) {
        const departure = new Date(data.departureTime);
        flight.arrivalTime = new Date(departure.getTime() + flight.route.duration * 60000);
    }
    
    await flight.save();
    
    await flight.populate('aircraft', 'model registrationNumber totalCapacity');
    await flight.populate('airline', 'name code');
    
    return flight;
};

/**
 * Cancel flight
 * Also cancels all tickets for this flight
 */
const cancelFlight = async (flightId, airlineId) => {
    const flight = await Flight.findOne({
        _id: flightId,
        airline: airlineId
    });
    
    if (!flight) {
        throw new Error('Flight not found');
    }
    
    flight.status = 'cancelled';
    await flight.save();
    
    // Non-default function:
    // .updateMany(): Update multiple documents matching a query
    await Ticket.updateMany(
        { flight: flight._id, status: 'confirmed' },
        { status: 'cancelled' }
    );
    
    return flight;
};

/**
 * Get flight statistics
 * Used by airlines to view:
 * - Total passengers
 * - Revenue
 * - Most popular routes
 * 
 * Non-default function:
 * .aggregate(): Perform complex MongoDB queries (like SQL GROUP BY)
 * Pipeline stages:
 * - $match: Filter documents (WHERE clause)
 * - $group: Group by field and aggregate (GROUP BY)
 * - $lookup: Join with another collection (SQL JOIN)
 * - $unwind: Flatten array field
 * - $sort: Sort results
 * - $limit: Limit number of results
 */
const getFlightStats = async (airlineId, filters = {}) => {
    const dateFilter = {};
    if (filters.from) dateFilter.$gte = new Date(filters.from);
    if (filters.to) dateFilter.$lte = new Date(filters.to);
    
    const flightQuery = { airline: airlineId };
    if (Object.keys(dateFilter).length > 0) {
        flightQuery.departureTime = dateFilter;
    }
    
    // Get total number of flights
    const totalFlights = await Flight.countDocuments(flightQuery);
    
    // Get all flight IDs matching the query
    const flights = await Flight.find(flightQuery).select('_id');
    const flightIds = flights.map(f => f._id);
    
    // Aggregate ticket statistics
    // Groups tickets by airline and calculates totals
    const ticketStats = await Ticket.aggregate([
        { $match: { flight: { $in: flightIds }, status: { $ne: 'cancelled' } } },
        {
            $group: {
                _id: null,
                totalPassengers: { $sum: 1 },  // Count all tickets
                totalRevenue: { $sum: '$pricing.totalPrice' },  // Sum all prices
                avgTicketPrice: { $avg: '$pricing.totalPrice' }  // Calculate average
            }
        }
    ]);
    
    // Find most popular routes
    const popularRoutes = await Ticket.aggregate([
        { $match: { flight: { $in: flightIds }, status: { $ne: 'cancelled' } } },
        {
            // Join tickets with flights to get route info
            $lookup: {
                from: 'flights',
                localField: 'flight',
                foreignField: '_id',
                as: 'flightData'
            }
        },
        { $unwind: '$flightData' },  // Convert array to single document
        {
            // Group by route and count passengers
            $group: {
                _id: '$flightData.route',
                passengerCount: { $sum: 1 },
                totalRevenue: { $sum: '$pricing.totalPrice' }
            }
        },
        { $sort: { passengerCount: -1 } },  // Sort by passenger count descending
        { $limit: 10 },  // Top 10 routes
        {
            // Get full route details
            $lookup: {
                from: 'routes',
                localField: '_id',
                foreignField: '_id',
                as: 'routeData'
            }
        },
        { $unwind: '$routeData' }
    ]);
    
    // Get ticket class distribution (economy, business, first)
    const classDistribution = await Ticket.aggregate([
        { $match: { flight: { $in: flightIds }, status: { $ne: 'cancelled' } } },
        {
            $group: {
                _id: '$ticketClass',
                count: { $sum: 1 },
                revenue: { $sum: '$pricing.totalPrice' }
            }
        }
    ]);
    
    return {
        totalFlights,
        totalPassengers: ticketStats[0]?.totalPassengers || 0,
        totalRevenue: ticketStats[0]?.totalRevenue || 0,
        averageTicketPrice: ticketStats[0]?.avgTicketPrice || 0,
        popularRoutes: popularRoutes.map(r => ({
            route: {
                departure: r.routeData.departureAirport,
                arrival: r.routeData.arrivalAirport
            },
            passengerCount: r.passengerCount,
            revenue: r.totalRevenue
        })),
        classDistribution: classDistribution.map(c => ({
            class: c._id,
            count: c.count,
            revenue: c.revenue
        }))
    };
};

module.exports = {
    getFlightsByAirline,
    getFlightById,
    getSeatMap,
    createFlight,
    updateFlight,
    cancelFlight,
    getFlightStats
};
