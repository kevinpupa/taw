const mongoose = require('mongoose');

const routeSchema = new mongoose.Schema({
    airline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline',
        required: true
    },
    departureAirport: {
        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            minlength: 3,
            maxlength: 3
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        country: {
            type: String,
            required: true,
            trim: true
        },
        name: {
            type: String,
            trim: true
        }
    },
    arrivalAirport: {
        code: {
            type: String,
            required: true,
            uppercase: true,
            trim: true,
            minlength: 3,
            maxlength: 3
        },
        city: {
            type: String,
            required: true,
            trim: true
        },
        country: {
            type: String,
            required: true,
            trim: true
        },
        name: {
            type: String,
            trim: true
        }
    },
    // Estimated flight duration in minutes
    duration: {
        type: Number,
        required: true,
        min: 15
    },
    // Distance in kilometers
    distance: {
        type: Number,
        min: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Compound index for unique routes per airline
routeSchema.index({ 
    airline: 1, 
    'departureAirport.code': 1, 
    'arrivalAirport.code': 1 
}, { unique: true });

// Index for search
routeSchema.index({ 'departureAirport.code': 1, 'arrivalAirport.code': 1 });
routeSchema.index({ 'departureAirport.city': 'text', 'arrivalAirport.city': 'text' });

const Route = mongoose.model('Route', routeSchema);

module.exports = Route;
