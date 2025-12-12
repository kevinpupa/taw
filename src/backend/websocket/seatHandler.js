/**
 * WebSocket Handler for Real-Time Seat Updates
 * Manages socket connections and broadcasts seat availability changes
 */

const Flight = require('../models/flight');
const jwt = require('jsonwebtoken');

const getJwtSecret = () => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error('JWT_SECRET must be set in environment');
    }
    return secret;
};

const JWT_SECRET = getJwtSecret();

const initializeSeatHandler = (io) => {
    // Namespace for seat updates
    const seatNamespace = io.of('/seats');

    seatNamespace.on('connection', (socket) => {
        // Seats namespace is read-only; allow unauthenticated connections for live seat maps
        console.log(`[WebSocket] User connected to /seats: ${socket.id}`);

        /**
         * Join a flight's seat room
         * Client emits: { flightId }
         */
        socket.on('join-flight', async (data) => {
            const { flightId } = data;
            const roomName = `flight-${flightId}`;

            try {
                // Verify flight exists
                const flight = await Flight.findById(flightId);
                if (!flight) {
                    socket.emit('error', { message: 'Flight not found' });
                    return;
                }

                // Join the room
                socket.join(roomName);
                console.log(`[WebSocket] Socket ${socket.id} joined room: ${roomName}`);

                // Send current seat availability
                const bookedSeats = flight.bookedSeats || [];
                socket.emit('seats-update', {
                    flightId,
                    bookedSeats,
                    availableSeats: flight.aircraft.totalCapacity - bookedSeats.length,
                    timestamp: new Date()
                });
            } catch (error) {
                console.error('[WebSocket] Error joining flight:', error);
                socket.emit('error', { message: 'Error joining flight room' });
            }
        });

        /**
         * Leave a flight's seat room
         */
        socket.on('leave-flight', (data) => {
            const { flightId } = data;
            const roomName = `flight-${flightId}`;
            socket.leave(roomName);
            console.log(`[WebSocket] Socket ${socket.id} left room: ${roomName}`);
        });

        socket.on('disconnect', () => {
            console.log(`[WebSocket] User disconnected: ${socket.id}`);
        });
    });

    /**
     * Broadcast seat update when a ticket is purchased
     * Called from ticket service after purchase
     */
    const broadcastSeatUpdate = (flightId, bookedSeats, totalCapacity) => {
        const roomName = `flight-${flightId}`;
        seatNamespace.to(roomName).emit('seats-update', {
            flightId,
            bookedSeats,
            availableSeats: totalCapacity - bookedSeats.length,
            timestamp: new Date()
        });
    };

    /**
     * Broadcast flight status update (cancellation, reactivation, etc.)
     * Called from admin/airline operations
     */
    const broadcastFlightUpdate = (flightId, data) => {
        const roomName = `flight-${flightId}`;
        seatNamespace.to(roomName).emit('flight-update', {
            flightId,
            ...data,
            timestamp: new Date()
        });
    };

    return {
        broadcastSeatUpdate,
        broadcastFlightUpdate
    };
};

module.exports = {
    initializeSeatHandler
};
