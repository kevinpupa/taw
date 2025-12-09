const User = require('../models/user');
const Airline = require('../models/airline');
const Aircraft = require('../models/aircraft');
const Route = require('../models/route');
const Flight = require('../models/flight');

// Create admin user if not exists
const createAdminIfNotExists = async () => {
    try {
        const adminEmail = process.env.ADMIN_EMAIL || 'admin@flightbooking.com';
        const existingAdmin = await User.findOne({ email: adminEmail });
        
        if (!existingAdmin) {
            // In production, require strong password via environment variable
            const adminPassword = process.env.ADMIN_PASSWORD;
            if (!adminPassword && process.env.NODE_ENV === 'production') {
                console.error('ADMIN_PASSWORD must be set in production environment');
                return;
            }
            
            const admin = new User({
                fullName: process.env.ADMIN_FULLNAME || 'System Administrator',
                email: adminEmail,
                password: adminPassword || 'admin123_dev',
                role: 'admin',
                isActive: true,
                // Force password change if using default
                mustChangePassword: !adminPassword
            });
            
            await admin.save();
            console.log('Admin user created successfully');
            if (!adminPassword) {
                console.warn('Warning: Admin using default password. Change immediately!');
            }
        } else {
            console.log('Admin user already exists');
        }
    } catch (error) {
        console.error('Error creating admin user:', error);
    }
};

// Seed test data
const seedTestData = async () => {
    try {
        // Check if data already exists
        const airlineCount = await Airline.countDocuments();
        if (airlineCount > 0) {
            console.log('Test data already exists, skipping seed');
            return;
        }
        
        console.log('Seeding test data...');
        
        // Create airlines
        const airlines = await Airline.insertMany([
            {
                name: 'SkyWay Airlines',
                code: 'SW',
                country: 'United States',
                description: 'Your journey begins with SkyWay'
            },
            {
                name: 'EuroJet',
                code: 'EJ',
                country: 'Germany',
                description: 'Connecting Europe, one flight at a time'
            },
            {
                name: 'Pacific Air',
                code: 'PA',
                country: 'Australia',
                description: 'Fly across the Pacific with comfort'
            }
        ]);
        
        console.log(`Created ${airlines.length} airlines`);
        
        // Create airline users
        const airlineUsers = [];
        for (const airline of airlines) {
            const user = new User({
                fullName: `${airline.name} Admin`,
                email: `admin@${airline.code.toLowerCase()}.com`,
                password: 'airline123',
                role: 'airline',
                airline: airline._id,
                mustChangePassword: false
            });
            await user.save();
            airlineUsers.push(user);
        }
        
        console.log(`Created ${airlineUsers.length} airline users`);
        
        // Create test passenger
        const passenger = new User({
            fullName: 'Test Passenger',
            email: 'passenger@test.com',
            password: 'passenger123',
            role: 'passenger'
        });
        await passenger.save();
        
        console.log('Created test passenger');
        
        // Create aircraft for each airline
        const aircraftData = [
            // SkyWay Airlines aircraft
            {
                airline: airlines[0]._id,
                model: 'Boeing 737-800',
                registrationNumber: 'N12345',
                seatConfiguration: [
                    { class: 'first', rows: 2, seatsPerRow: 4, extraLegroomRows: [1] },
                    { class: 'business', rows: 4, seatsPerRow: 6, extraLegroomRows: [1] },
                    { class: 'economy', rows: 20, seatsPerRow: 6, extraLegroomRows: [1, 10] }
                ]
            },
            {
                airline: airlines[0]._id,
                model: 'Airbus A320',
                registrationNumber: 'N67890',
                seatConfiguration: [
                    { class: 'business', rows: 3, seatsPerRow: 4 },
                    { class: 'economy', rows: 25, seatsPerRow: 6, extraLegroomRows: [1, 12] }
                ]
            },
            // EuroJet aircraft
            {
                airline: airlines[1]._id,
                model: 'Airbus A380',
                registrationNumber: 'D-ABCD',
                seatConfiguration: [
                    { class: 'first', rows: 4, seatsPerRow: 4, extraLegroomRows: [1, 2] },
                    { class: 'business', rows: 8, seatsPerRow: 6, extraLegroomRows: [1] },
                    { class: 'economy', rows: 40, seatsPerRow: 10, extraLegroomRows: [1, 20] }
                ]
            },
            // Pacific Air aircraft
            {
                airline: airlines[2]._id,
                model: 'Boeing 787 Dreamliner',
                registrationNumber: 'VH-PAA',
                seatConfiguration: [
                    { class: 'first', rows: 2, seatsPerRow: 4 },
                    { class: 'business', rows: 6, seatsPerRow: 6, extraLegroomRows: [1] },
                    { class: 'economy', rows: 30, seatsPerRow: 8, extraLegroomRows: [1, 15] }
                ]
            }
        ];
        
        const aircraft = [];
        for (const data of aircraftData) {
            const ac = new Aircraft(data);
            await ac.save();
            aircraft.push(ac);
        }
        
        console.log(`Created ${aircraft.length} aircraft`);
        
        // Create routes
        const routesData = [
            // SkyWay routes
            {
                airline: airlines[0]._id,
                departureAirport: { code: 'JFK', city: 'New York', country: 'USA', name: 'John F. Kennedy International' },
                arrivalAirport: { code: 'LAX', city: 'Los Angeles', country: 'USA', name: 'Los Angeles International' },
                duration: 330, // 5h 30m
                distance: 3983
            },
            {
                airline: airlines[0]._id,
                departureAirport: { code: 'LAX', city: 'Los Angeles', country: 'USA', name: 'Los Angeles International' },
                arrivalAirport: { code: 'JFK', city: 'New York', country: 'USA', name: 'John F. Kennedy International' },
                duration: 300, // 5h
                distance: 3983
            },
            {
                airline: airlines[0]._id,
                departureAirport: { code: 'JFK', city: 'New York', country: 'USA', name: 'John F. Kennedy International' },
                arrivalAirport: { code: 'ORD', city: 'Chicago', country: 'USA', name: "O'Hare International" },
                duration: 150, // 2h 30m
                distance: 1188
            },
            {
                airline: airlines[0]._id,
                departureAirport: { code: 'ORD', city: 'Chicago', country: 'USA', name: "O'Hare International" },
                arrivalAirport: { code: 'LAX', city: 'Los Angeles', country: 'USA', name: 'Los Angeles International' },
                duration: 240, // 4h
                distance: 2802
            },
            // EuroJet routes
            {
                airline: airlines[1]._id,
                departureAirport: { code: 'FRA', city: 'Frankfurt', country: 'Germany', name: 'Frankfurt Airport' },
                arrivalAirport: { code: 'LHR', city: 'London', country: 'UK', name: 'Heathrow Airport' },
                duration: 90, // 1h 30m
                distance: 656
            },
            {
                airline: airlines[1]._id,
                departureAirport: { code: 'LHR', city: 'London', country: 'UK', name: 'Heathrow Airport' },
                arrivalAirport: { code: 'CDG', city: 'Paris', country: 'France', name: 'Charles de Gaulle' },
                duration: 75, // 1h 15m
                distance: 344
            },
            {
                airline: airlines[1]._id,
                departureAirport: { code: 'FRA', city: 'Frankfurt', country: 'Germany', name: 'Frankfurt Airport' },
                arrivalAirport: { code: 'CDG', city: 'Paris', country: 'France', name: 'Charles de Gaulle' },
                duration: 80, // 1h 20m
                distance: 479
            },
            // Pacific Air routes
            {
                airline: airlines[2]._id,
                departureAirport: { code: 'SYD', city: 'Sydney', country: 'Australia', name: 'Sydney Airport' },
                arrivalAirport: { code: 'MEL', city: 'Melbourne', country: 'Australia', name: 'Melbourne Airport' },
                duration: 85, // 1h 25m
                distance: 705
            },
            {
                airline: airlines[2]._id,
                departureAirport: { code: 'SYD', city: 'Sydney', country: 'Australia', name: 'Sydney Airport' },
                arrivalAirport: { code: 'LAX', city: 'Los Angeles', country: 'USA', name: 'Los Angeles International' },
                duration: 840, // 14h
                distance: 12074
            }
        ];
        
        const routes = await Route.insertMany(routesData);
        console.log(`Created ${routes.length} routes`);
        
        // Create flights for the next 30 days
        const flightsData = [];
        const now = new Date();
        
        // Helper to create flight data
        const createFlightData = (route, aircraftId, airlineId, baseDate, hour, flightPrefix, pricing) => {
            const departure = new Date(baseDate);
            departure.setHours(hour, 0, 0, 0);
            const arrival = new Date(departure.getTime() + route.duration * 60000);
            
            return {
                flightNumber: `${flightPrefix}${Math.floor(100 + Math.random() * 900)}`,
                route: route._id,
                aircraft: aircraftId,
                airline: airlineId,
                departureTime: departure,
                arrivalTime: arrival,
                pricing,
                extraBaggagePrice: 35
            };
        };
        
        // Standard pricing
        const standardPricing = [
            { class: 'economy', basePrice: 199, extraLegroomPrice: 45 },
            { class: 'business', basePrice: 599, extraLegroomPrice: 75 },
            { class: 'first', basePrice: 1299, extraLegroomPrice: 100 }
        ];
        
        const premiumPricing = [
            { class: 'economy', basePrice: 299, extraLegroomPrice: 55 },
            { class: 'business', basePrice: 899, extraLegroomPrice: 95 },
            { class: 'first', basePrice: 1899, extraLegroomPrice: 150 }
        ];
        
        const longHaulPricing = [
            { class: 'economy', basePrice: 799, extraLegroomPrice: 85 },
            { class: 'business', basePrice: 2499, extraLegroomPrice: 150 },
            { class: 'first', basePrice: 5999, extraLegroomPrice: 250 }
        ];
        
        // Generate flights for the next 30 days
        for (let day = 0; day < 30; day++) {
            const date = new Date(now);
            date.setDate(date.getDate() + day);
            
            // SkyWay flights
            // JFK -> LAX (morning and evening)
            flightsData.push(createFlightData(routes[0], aircraft[0]._id, airlines[0]._id, date, 8, 'SW', standardPricing));
            flightsData.push(createFlightData(routes[0], aircraft[1]._id, airlines[0]._id, date, 18, 'SW', premiumPricing));
            
            // LAX -> JFK (morning and evening)
            flightsData.push(createFlightData(routes[1], aircraft[0]._id, airlines[0]._id, date, 7, 'SW', standardPricing));
            flightsData.push(createFlightData(routes[1], aircraft[1]._id, airlines[0]._id, date, 17, 'SW', premiumPricing));
            
            // JFK -> ORD
            flightsData.push(createFlightData(routes[2], aircraft[1]._id, airlines[0]._id, date, 10, 'SW', standardPricing));
            
            // ORD -> LAX
            flightsData.push(createFlightData(routes[3], aircraft[0]._id, airlines[0]._id, date, 14, 'SW', standardPricing));
            
            // EuroJet flights
            // FRA -> LHR
            flightsData.push(createFlightData(routes[4], aircraft[2]._id, airlines[1]._id, date, 9, 'EJ', standardPricing));
            flightsData.push(createFlightData(routes[4], aircraft[2]._id, airlines[1]._id, date, 15, 'EJ', standardPricing));
            
            // LHR -> CDG
            flightsData.push(createFlightData(routes[5], aircraft[2]._id, airlines[1]._id, date, 11, 'EJ', standardPricing));
            
            // FRA -> CDG
            flightsData.push(createFlightData(routes[6], aircraft[2]._id, airlines[1]._id, date, 14, 'EJ', standardPricing));
            
            // Pacific Air flights
            // SYD -> MEL
            flightsData.push(createFlightData(routes[7], aircraft[3]._id, airlines[2]._id, date, 6, 'PA', standardPricing));
            flightsData.push(createFlightData(routes[7], aircraft[3]._id, airlines[2]._id, date, 12, 'PA', standardPricing));
            flightsData.push(createFlightData(routes[7], aircraft[3]._id, airlines[2]._id, date, 18, 'PA', standardPricing));
            
            // SYD -> LAX (long haul)
            flightsData.push(createFlightData(routes[8], aircraft[3]._id, airlines[2]._id, date, 22, 'PA', longHaulPricing));
        }
        
        // Insert flights in batches to avoid unique key conflicts
        for (let i = 0; i < flightsData.length; i++) {
            try {
                const flight = new Flight(flightsData[i]);
                await flight.save();
            } catch (error) {
                // Skip duplicates
                if (error.code !== 11000) {
                    console.error('Error creating flight:', error.message);
                }
            }
        }
        
        const flightCount = await Flight.countDocuments();
        console.log(`Created ${flightCount} flights`);
        
        console.log('Test data seeded successfully!');
        console.log('\n=== Test Credentials (Development Only) ===');
        console.log('Admin: admin@flightbooking.com / (set via ADMIN_PASSWORD env)');
        console.log('SkyWay Airline: admin@sw.com / airline123');
        console.log('EuroJet: admin@ej.com / airline123');
        console.log('Pacific Air: admin@pa.com / airline123');
        console.log('Passenger: passenger@test.com / passenger123');
        console.log('============================================\n');
        
    } catch (error) {
        console.error('Error seeding test data:', error);
    }
};

module.exports = {
    createAdminIfNotExists,
    seedTestData
};
