const mongoose = require('mongoose');

// Pricing for each ticket class
const pricingSchema = new mongoose.Schema({
    class: {
        type: String,
        enum: ['economy', 'business', 'first'],
        required: true
    },
    basePrice: {
        type: Number,
        required: true,
        min: 0
    },
    // Extra charges
    extraLegroomPrice: {
        type: Number,
        default: 0,
        min: 0
    }
}, { _id: false });

const flightSchema = new mongoose.Schema({
    // Flight number (e.g., "AA123")
    flightNumber: {
        type: String,
        required: true,
        uppercase: true,
        trim: true
    },
    route: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Route',
        required: true
    },
    aircraft: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Aircraft',
        required: true
    },
    airline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline',
        required: true
    },
    // Departure date and time (UTC)
    departureTime: {
        type: Date,
        required: true
    },
    // Arrival date and time (UTC)
    arrivalTime: {
        type: Date,
        required: true
    },
    // Pricing for each class
    pricing: [pricingSchema],
    // Extra baggage pricing
    extraBaggagePrice: {
        type: Number,
        default: 30,
        min: 0
    },
    // Booked seats (seat numbers that are taken)
    bookedSeats: [{
        type: String
    }],
    // Flight status
    status: {
        type: String,
        enum: ['scheduled', 'boarding', 'departed', 'arrived', 'cancelled', 'delayed'],
        default: 'scheduled'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Index for search optimization
flightSchema.index({ departureTime: 1 });
flightSchema.index({ airline: 1, departureTime: 1 });
flightSchema.index({ route: 1, departureTime: 1 });
flightSchema.index({ flightNumber: 1, departureTime: 1 }, { unique: true });

// Virtual for calculating available seats
flightSchema.virtual('availableSeats').get(function() {
    // This will be populated when aircraft is loaded
    if (this.populated('aircraft') && this.aircraft) {
        return this.aircraft.totalCapacity - this.bookedSeats.length;
    }
    return null;
});

// Method to check if a specific seat is available
flightSchema.methods.isSeatAvailable = function(seatNumber) {
    return !this.bookedSeats.includes(seatNumber);
};

// Method to book a seat
flightSchema.methods.bookSeat = function(seatNumber) {
    if (this.bookedSeats.includes(seatNumber)) {
        throw new Error('Seat already booked');
    }
    this.bookedSeats.push(seatNumber);
};

// Method to get price for a specific class
flightSchema.methods.getPriceForClass = function(ticketClass, extras = {}) {
    const classPrice = this.pricing.find(p => p.class === ticketClass);
    if (!classPrice) {
        throw new Error(`Invalid ticket class: ${ticketClass}`);
    }
    
    let totalPrice = classPrice.basePrice;
    
    if (extras.extraLegroom) {
        totalPrice += classPrice.extraLegroomPrice || 0;
    }
    
    if (extras.extraBaggage) {
        totalPrice += this.extraBaggagePrice * (extras.extraBaggageCount || 1);
    }
    
    return totalPrice;
};

flightSchema.set('toObject', { virtuals: true });
flightSchema.set('toJSON', { virtuals: true });

const Flight = mongoose.model('Flight', flightSchema);

module.exports = Flight;
