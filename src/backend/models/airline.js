const mongoose = require('mongoose');

const airlineSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    code: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true,
        minlength: 2,
        maxlength: 3
    },
    country: {
        type: String,
        required: true,
        trim: true
    },
    logo: {
        type: String,
        default: null
    },
    description: {
        type: String,
        trim: true
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Virtual for getting all aircraft
airlineSchema.virtual('aircraft', {
    ref: 'Aircraft',
    localField: '_id',
    foreignField: 'airline'
});

// Virtual for getting all routes
airlineSchema.virtual('routes', {
    ref: 'Route',
    localField: '_id',
    foreignField: 'airline'
});

airlineSchema.set('toObject', { virtuals: true });
airlineSchema.set('toJSON', { virtuals: true });

const Airline = mongoose.model('Airline', airlineSchema);

module.exports = Airline;
