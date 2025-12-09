const Flight = require('../models/flight');
const Route = require('../models/route');

// Minimum layover time in milliseconds (2 hours)
const MIN_LAYOVER_MS = 2 * 60 * 60 * 1000;
// Maximum layover time in milliseconds (8 hours)
const MAX_LAYOVER_MS = 8 * 60 * 60 * 1000;

// Search flights
const searchFlights = async (searchParams) => {
    const {
        from,
        to,
        date,
        passengers = 1,
        ticketClass = 'economy',
        sort = 'price',
        order = 'asc',
        maxStops = 1
    } = searchParams;
    
    const searchDate = new Date(date);
    const startOfDay = new Date(searchDate.getTime());
    startOfDay.setHours(0, 0, 0, 0);
    const endOfDay = new Date(searchDate.getTime());
    endOfDay.setHours(23, 59, 59, 999);
    
    // Find all routes that match origin and destination
    const fromUpper = from.toUpperCase();
    const toUpper = to.toUpperCase();
    
    // Direct flights
    const directRoutes = await Route.find({
        isActive: true,
        $or: [
            { 'departureAirport.code': fromUpper, 'arrivalAirport.code': toUpper },
            { 'departureAirport.city': { $regex: new RegExp(from, 'i') }, 'arrivalAirport.city': { $regex: new RegExp(to, 'i') } }
        ]
    });
    
    const directRouteIds = directRoutes.map(r => r._id);
    
    // Helper function to format trips
    const formatTrips = (directFlights, connectingFlights) => {
        const directTrips = directFlights.map(flight => {
            const price = flight.pricing.find(p => p.class === ticketClass);
            return {
                type: 'direct',
                stops: 0,
                totalDuration: flight.route.duration,
                totalPrice: price ? price.basePrice * passengers : null,
                pricePerPerson: price ? price.basePrice : null,
                flights: [{
                    flightId: flight._id,
                    flightNumber: flight.flightNumber,
                    airline: {
                        name: flight.airline.name,
                        code: flight.airline.code
                    },
                    departure: {
                        airport: flight.route.departureAirport,
                        time: flight.departureTime
                    },
                    arrival: {
                        airport: flight.route.arrivalAirport,
                        time: flight.arrivalTime
                    },
                    duration: flight.route.duration,
                    aircraft: flight.aircraft.model,
                    availableSeats: flight.aircraft.totalCapacity - flight.bookedSeats.length,
                    pricing: flight.pricing
                }]
            };
        });

        return [...directTrips, ...connectingFlights];
    };

    // Find direct flights
    const directFlights = await Flight.find({
        route: { $in: directRouteIds },
        departureTime: { $gte: startOfDay, $lte: endOfDay },
        status: { $in: ['scheduled', 'delayed'] },
        isActive: true
    })
    .populate('route')
    .populate('aircraft', 'model totalCapacity')
    .populate('airline', 'name code');
    
    // Filter by available seats
    const availableDirectFlights = directFlights.filter(flight => {
        const availableSeats = flight.aircraft.totalCapacity - flight.bookedSeats.length;
        return availableSeats >= passengers;
    });
    
    // Connecting flights (1 stop)
    let connectingTrips = [];
    
    if (maxStops >= 1) {
        // Find routes departing from origin
        const departingRoutes = await Route.find({
            isActive: true,
            $or: [
                { 'departureAirport.code': fromUpper },
                { 'departureAirport.city': { $regex: new RegExp(from, 'i') } }
            ]
        });
        
        // Find routes arriving at destination
        const arrivingRoutes = await Route.find({
            isActive: true,
            $or: [
                { 'arrivalAirport.code': toUpper },
                { 'arrivalAirport.city': { $regex: new RegExp(to, 'i') } }
            ]
        });
        
        // Find potential connection points
        for (const firstRoute of departingRoutes) {
            const connectionAirport = firstRoute.arrivalAirport.code;
            
            // Find second leg routes from connection airport
            const secondLegRoutes = arrivingRoutes.filter(r => 
                r.departureAirport.code === connectionAirport
            );
            
            if (secondLegRoutes.length === 0) continue;
            
            // Find first leg flights
            const firstLegFlights = await Flight.find({
                route: firstRoute._id,
                departureTime: { $gte: startOfDay, $lte: endOfDay },
                status: { $in: ['scheduled', 'delayed'] },
                isActive: true
            })
            .populate('route')
            .populate('aircraft', 'model totalCapacity')
            .populate('airline', 'name code');
            
            for (const firstFlight of firstLegFlights) {
                // Check availability
                const firstAvailable = firstFlight.aircraft.totalCapacity - firstFlight.bookedSeats.length;
                if (firstAvailable < passengers) continue;
                
                // Find second leg flights with appropriate layover
                const minSecondDeparture = new Date(firstFlight.arrivalTime.getTime() + MIN_LAYOVER_MS);
                const maxSecondDeparture = new Date(firstFlight.arrivalTime.getTime() + MAX_LAYOVER_MS);
                
                const secondLegFlights = await Flight.find({
                    route: { $in: secondLegRoutes.map(r => r._id) },
                    departureTime: { $gte: minSecondDeparture, $lte: maxSecondDeparture },
                    status: { $in: ['scheduled', 'delayed'] },
                    isActive: true
                })
                .populate('route')
                .populate('aircraft', 'model totalCapacity')
                .populate('airline', 'name code');
                
                for (const secondFlight of secondLegFlights) {
                    // Check availability
                    const secondAvailable = secondFlight.aircraft.totalCapacity - secondFlight.bookedSeats.length;
                    if (secondAvailable < passengers) continue;
                    
                    const firstPrice = firstFlight.pricing.find(p => p.class === ticketClass);
                    const secondPrice = secondFlight.pricing.find(p => p.class === ticketClass);
                    
                    if (!firstPrice || !secondPrice) continue;
                    
                    const layoverTime = (secondFlight.departureTime - firstFlight.arrivalTime) / 60000; // in minutes
                    const totalDuration = firstFlight.route.duration + layoverTime + secondFlight.route.duration;
                    const totalPricePerPerson = firstPrice.basePrice + secondPrice.basePrice;
                    
                    connectingTrips.push({
                        type: 'connecting',
                        stops: 1,
                        connectionAirport: firstRoute.arrivalAirport,
                        layoverDuration: layoverTime,
                        totalDuration,
                        totalPrice: totalPricePerPerson * passengers,
                        pricePerPerson: totalPricePerPerson,
                        flights: [
                            {
                                flightId: firstFlight._id,
                                flightNumber: firstFlight.flightNumber,
                                airline: {
                                    name: firstFlight.airline.name,
                                    code: firstFlight.airline.code
                                },
                                departure: {
                                    airport: firstFlight.route.departureAirport,
                                    time: firstFlight.departureTime
                                },
                                arrival: {
                                    airport: firstFlight.route.arrivalAirport,
                                    time: firstFlight.arrivalTime
                                },
                                duration: firstFlight.route.duration,
                                aircraft: firstFlight.aircraft.model,
                                availableSeats: firstAvailable,
                                pricing: firstFlight.pricing
                            },
                            {
                                flightId: secondFlight._id,
                                flightNumber: secondFlight.flightNumber,
                                airline: {
                                    name: secondFlight.airline.name,
                                    code: secondFlight.airline.code
                                },
                                departure: {
                                    airport: secondFlight.route.departureAirport,
                                    time: secondFlight.departureTime
                                },
                                arrival: {
                                    airport: secondFlight.route.arrivalAirport,
                                    time: secondFlight.arrivalTime
                                },
                                duration: secondFlight.route.duration,
                                aircraft: secondFlight.aircraft.model,
                                availableSeats: secondAvailable,
                                pricing: secondFlight.pricing
                            }
                        ]
                    });
                }
            }
        }
    }
    
    // Combine all trips
    let allTrips = formatTrips(availableDirectFlights, connectingTrips);
    
    // Filter out trips without prices
    allTrips = allTrips.filter(trip => trip.totalPrice !== null);
    
    // If no flights found for requested date, search nearby dates (±3 days)
    let alternativeDates = [];
    if (allTrips.length === 0) {
        for (let i = -3; i <= 3; i++) {
            if (i === 0) continue; // Skip the original date
            
            const altDate = new Date(searchDate.getTime());
            altDate.setDate(altDate.getDate() + i);
            
            const altStartOfDay = new Date(altDate.getTime());
            altStartOfDay.setHours(0, 0, 0, 0);
            const altEndOfDay = new Date(altDate.getTime());
            altEndOfDay.setHours(23, 59, 59, 999);
            
            const altDirectFlights = await Flight.find({
                route: { $in: directRouteIds },
                departureTime: { $gte: altStartOfDay, $lte: altEndOfDay },
                status: { $in: ['scheduled', 'delayed'] },
                isActive: true
            })
            .populate('route')
            .populate('aircraft', 'model totalCapacity')
            .populate('airline', 'name code');
            
            const availableAltFlights = altDirectFlights.filter(flight => {
                const availableSeats = flight.aircraft.totalCapacity - flight.bookedSeats.length;
                return availableSeats >= passengers;
            });
            
            if (availableAltFlights.length > 0) {
                alternativeDates.push({
                    date: altDate.toISOString().split('T')[0],
                    flights: availableAltFlights.length
                });
            }
        }
    }
    
    // Sort trips
    const sortOrder = order === 'desc' ? -1 : 1;
    
    switch (sort) {
        case 'price':
            allTrips.sort((a, b) => (a.totalPrice - b.totalPrice) * sortOrder);
            break;
        case 'duration':
            allTrips.sort((a, b) => (a.totalDuration - b.totalDuration) * sortOrder);
            break;
        case 'departure':
            allTrips.sort((a, b) => 
                (new Date(a.flights[0].departure.time) - new Date(b.flights[0].departure.time)) * sortOrder
            );
            break;
        case 'stops':
            allTrips.sort((a, b) => (a.stops - b.stops) * sortOrder);
            break;
    }
    
    return {
        searchParams: {
            from,
            to,
            date,
            passengers: parseInt(passengers),
            class: ticketClass
        },
        totalResults: allTrips.length,
        alternativeDates,
        trips: allTrips
    };
};

// Get available airports
const getAvailableAirports = async (searchQuery = null) => {
    // Aggregate unique airports from routes
    const departureAirports = await Route.aggregate([
        { $match: { isActive: true } },
        { $group: { 
            _id: '$departureAirport.code',
            code: { $first: '$departureAirport.code' },
            city: { $first: '$departureAirport.city' },
            country: { $first: '$departureAirport.country' },
            name: { $first: '$departureAirport.name' }
        }}
    ]);
    
    const arrivalAirports = await Route.aggregate([
        { $match: { isActive: true } },
        { $group: { 
            _id: '$arrivalAirport.code',
            code: { $first: '$arrivalAirport.code' },
            city: { $first: '$arrivalAirport.city' },
            country: { $first: '$arrivalAirport.country' },
            name: { $first: '$arrivalAirport.name' }
        }}
    ]);
    
    // Merge and deduplicate
    const airportMap = new Map();
    [...departureAirports, ...arrivalAirports].forEach(airport => {
        airportMap.set(airport.code, airport);
    });
    
    let airports = Array.from(airportMap.values());
    
    // Filter by search query
    if (searchQuery) {
        const searchTerm = searchQuery.toLowerCase();
        airports = airports.filter(airport => 
            airport.code.toLowerCase().includes(searchTerm) ||
            airport.city.toLowerCase().includes(searchTerm) ||
            (airport.name && airport.name.toLowerCase().includes(searchTerm))
        );
    }
    
    // Sort alphabetically by city
    airports.sort((a, b) => a.city.localeCompare(b.city));
    
    return airports;
};

module.exports = {
    searchFlights,
    getAvailableAirports
};
