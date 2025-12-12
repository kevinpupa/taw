/**
 * Flight Booking System - Express Server
 * Main entry point for the REST API backend
 * 
 * Handles:
 * - Express app initialization
 * - Middleware setup (CORS, body parser, error handling)
 * - Database connection (MongoDB)
 * - Route registration
 * - WebSocket setup for real-time updates
 * - Test data seeding on startup
 * - Server startup on configured port
 */

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const http = require('http');
const { Server } = require('socket.io');
require('dotenv').config();

// Import routes
const authRoutes = require('./routes/auth');
const searchRoutes = require('./routes/search');
const flightRoutes = require('./routes/flights');
const ticketRoutes = require('./routes/tickets');
const airlineRoutes = require('./routes/airlines');
const airlineAdminRoutes = require('./routes/airline');
const adminRoutes = require('./routes/admin');
const aircraftRoutes = require('./routes/aircraft');
const routeRoutes = require('./routes/routes');
const userRoutes = require('./routes/users');

// Import seeding function
const { createAdminIfNotExists, seedTestData } = require('./seeds/seed');

// Import WebSocket handler
const { initializeSeatHandler } = require('./websocket/seatHandler');

// Create Express app
const app = express();
const server = http.createServer(app);

// Initialize Socket.IO for real-time updates
const io = new Server(server, {
    cors: {
        origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
        credentials: true,
        methods: ['GET', 'POST']
    }
});

// Initialize seat update handler
const seatHandler = initializeSeatHandler(io);

// Store seat handler in app for access in services
app.locals.seatHandler = seatHandler;

// ===== MIDDLEWARE =====

/**
 * CORS Configuration
 * Allow requests from frontend (running on different port during development)
 * In production, restrict to specific domain
 */
app.use(cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:4200',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
}));

/**
 * Body Parser Middleware
 * Parse incoming JSON and URL-encoded request bodies
 */
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

/**
 * Cookie Parser Middleware
 * Parse httpOnly cookies from requests
 */
app.use(cookieParser());

/**
 * Request Logging Middleware
 * Log all API requests in development mode
 */
if (process.env.NODE_ENV !== 'production') {
    app.use((req, res, next) => {
        console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
        next();
    });
}

// ===== ROUTES =====

/**
 * API Routes
 * All routes are prefixed with /api
 */
app.use('/api/auth', authRoutes);
app.use('/api/search', searchRoutes);
app.use('/api/flights', flightRoutes);
app.use('/api/tickets', ticketRoutes);
app.use('/api/airlines', airlineRoutes);
app.use('/api/airline', airlineAdminRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/aircraft', aircraftRoutes);
app.use('/api/routes', routeRoutes);
app.use('/api/users', userRoutes);

/**
 * Health check endpoint
 * Useful for monitoring and Docker health checks
 */
app.get('/health', (req, res) => {
    res.status(200).json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

/**
 * 404 Not Found Handler
 * Return error for undefined routes
 */
app.use((req, res) => {
    res.status(404).json({
        error: {
            message: 'Endpoint not found',
            path: req.path,
            method: req.method
        }
    });
});

/**
 * Global Error Handler
 * Catches all errors from route handlers and middleware
 * Formats error responses consistently
 */
app.use((err, req, res, next) => {
    console.error('Error:', err);

    // Mongoose validation error
    if (err.name === 'ValidationError') {
        return res.status(400).json({
            error: {
                message: 'Validation error',
                details: Object.values(err.errors).map(e => e.message)
            }
        });
    }

    // Mongoose duplicate key error (MongoDB error code 11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue)[0];
        return res.status(409).json({
            error: {
                message: `${field} already exists`,
                field
            }
        });
    }

    // JWT errors are handled in auth middleware
    // Pass through other errors with default status 500
    const statusCode = err.status || 500;
    res.status(statusCode).json({
        error: {
            message: err.message || 'Internal server error',
            ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
        }
    });
});

// ===== DATABASE CONNECTION =====

/**
 * MongoDB Connection
 * Handles connection to MongoDB database
 * Automatically retries on connection failure
 */
const connectDatabase = async () => {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/flight-booking';
    
    try {
        console.log('Connecting to MongoDB...');
        
        await mongoose.connect(mongoUri, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000
        });
        
        console.log('✓ MongoDB connected successfully');
        
        // Create connection event handlers
        mongoose.connection.on('disconnected', () => {
            console.warn('⚠ MongoDB disconnected');
        });
        
        mongoose.connection.on('error', (err) => {
            console.error('⚠ MongoDB connection error:', err.message);
        });
        
        return true;
    } catch (error) {
        console.error('✗ MongoDB connection failed:', error.message);
        console.error('Make sure MongoDB is running at:', mongoUri);
        return false;
    }
};

// ===== SEED DATA =====

/**
 * Initialize Application
 * 1. Connect to database
 * 2. Create admin user if not exists
 * 3. Seed test data if database is empty
 * 4. Start server
 */
const initializeApp = async () => {
    try {
        // Connect to database
        const dbConnected = await connectDatabase();
        if (!dbConnected) {
            console.error('Failed to connect to database. Exiting...');
            process.exit(1);
        }

        // Create admin user
        console.log('Initializing admin user...');
        await createAdminIfNotExists();

        // Seed test data
        console.log('Checking test data...');
        await seedTestData();

        console.log('✓ Application initialized successfully');
        return true;
    } catch (error) {
        console.error('✗ Application initialization failed:', error);
        return false;
    }
};

// ===== SERVER STARTUP =====

/**
 * Start Express Server
 * Listen on configured port
 */
const PORT = process.env.PORT || 3000;
const NODE_ENV = process.env.NODE_ENV || 'development';

const startServer = async () => {
    try {
        // Initialize app (database, admin, seed data)
        const initialized = await initializeApp();
        if (!initialized) {
            console.error('Failed to initialize application');
            process.exit(1);
        }

        // Start listening
        server.listen(PORT, () => {
            console.log('\n' + '='.repeat(50));
            console.log('🚀 Flight Booking API Server Started');
            console.log('='.repeat(50));
            console.log(`Environment: ${NODE_ENV}`);
            console.log(`Port: ${PORT}`);
            console.log(`URL: http://localhost:${PORT}`);
            console.log(`WebSocket: ws://localhost:${PORT}`);
            console.log(`Health Check: http://localhost:${PORT}/health`);
            console.log('\nAPI Endpoints:');
            console.log('  POST   /api/auth/register - Register new user');
            console.log('  POST   /api/auth/login - Login');
            console.log('  GET    /api/search/flights - Search flights (public)');
            console.log('  GET    /api/flights - Get flights (airline)');
            console.log('  POST   /api/flights - Create flight (airline)');
            console.log('  GET    /api/tickets - Get tickets (passenger)');
            console.log('  POST   /api/tickets - Book ticket (passenger)');
            console.log('  GET    /api/airlines - Get airlines (admin)');
            console.log('  GET    /api/users - Get users (admin)');
            console.log('\nWebSocket Events:');
            console.log('  /seats namespace - Real-time seat availability');
            console.log('='.repeat(50) + '\n');
        });
    } catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};

// Handle graceful shutdown
process.on('SIGTERM', async () => {
    console.log('\nSIGTERM received, shutting down gracefully...');
    await mongoose.disconnect();
    process.exit(0);
});

process.on('SIGINT', async () => {
    console.log('\nSIGINT received, shutting down gracefully...');
    await mongoose.disconnect();
    process.exit(0);
});

// Start the server
startServer();

module.exports = app;
