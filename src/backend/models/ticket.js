const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
    // Reference to the booking user
    passenger: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    flight: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Flight',
        required: true
    },
    // Passenger details for this ticket
    passengerDetails: {
        fullName: {
            type: String,
            required: true,
            trim: true
        },
        email: {
            type: String,
            required: true,
            trim: true,
            lowercase: true
        },
        phone: {
            type: String,
            trim: true
        },
        dateOfBirth: {
            type: Date
        },
        passportNumber: {
            type: String,
            trim: true
        }
    },
    // Ticket class
    ticketClass: {
        type: String,
        enum: ['economy', 'business', 'first'],
        required: true
    },
    // Selected seat
    seatNumber: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    // Extras
    extras: {
        extraLegroom: {
            type: Boolean,
            default: false
        },
        extraBaggage: {
            type: Boolean,
            default: false
        },
        extraBaggageCount: {
            type: Number,
            default: 0,
            min: 0
        },
        specialMeal: {
            type: String,
            enum: ['standard', 'vegetarian', 'vegan', 'halal', 'kosher', 'gluten-free'],
            default: 'standard'
        }
    },
    // Pricing breakdown
    pricing: {
        basePrice: {
            type: Number,
            required: true,
            min: 0
        },
        extrasPrice: {
            type: Number,
            default: 0,
            min: 0
        },
        totalPrice: {
            type: Number,
            required: true,
            min: 0
        }
    },
    // Booking reference (unique identifier for customer)
    bookingReference: {
        type: String,
        required: true,
        unique: true,
        uppercase: true
    },
    // Ticket status
    status: {
        type: String,
        enum: ['confirmed', 'checked-in', 'boarded', 'cancelled', 'refunded'],
        default: 'confirmed'
    }
}, { timestamps: true });

// Index for lookup
ticketSchema.index({ passenger: 1, createdAt: -1 });
ticketSchema.index({ flight: 1 });

// Generate booking reference before saving
ticketSchema.pre('save', function() {
    if (!this.bookingReference) {
        // Generate a 6-character alphanumeric booking reference
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let reference = '';
        for (let i = 0; i < 6; i++) {
            reference += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        this.bookingReference = reference;
    }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

module.exports = Ticket;
