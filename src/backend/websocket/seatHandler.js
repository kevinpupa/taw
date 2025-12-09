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
        try {
            const token = socket.handshake.auth?.token || socket.handshake.query?.token;
            if (!token) {
                socket.disconnect(true);
                return;
            }
            jwt.verify(token, JWT_SECRET);
        } catch (err) {
            console.warn(`[WebSocket] Unauthorized socket ${socket.id}`);
            socket.disconnect(true);
            return;
        }

        console.log(`[WebSocket] User connected: ${socket.id}`);

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

    return {
        broadcastSeatUpdate
    };
};

module.exports = {
    initializeSeatHandler
};
