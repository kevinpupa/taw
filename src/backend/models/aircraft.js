const mongoose = require('mongoose');

// Seat configuration for different classes
const seatConfigSchema = new mongoose.Schema({
    class: {
        type: String,
        enum: ['economy', 'business', 'first'],
        required: true
    },
    rows: {
        type: Number,
        required: true,
        min: 1
    },
    seatsPerRow: {
        type: Number,
        required: true,
        min: 1,
        max: 10
    },
    // Extra legroom rows (optional)
    extraLegroomRows: [{
        type: Number
    }]
}, { _id: false });

const aircraftSchema = new mongoose.Schema({
    airline: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Airline',
        required: true
    },
    model: {
        type: String,
        required: true,
        trim: true
    },
    registrationNumber: {
        type: String,
        required: true,
        unique: true,
        uppercase: true,
        trim: true
    },
    // Seat configuration by class
    seatConfiguration: [seatConfigSchema],
    // Total capacity (calculated)
    totalCapacity: {
        type: Number,
        default: 0
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

// Calculate total capacity before saving
aircraftSchema.pre('save', function() {
    this.totalCapacity = this.seatConfiguration.reduce((total, config) => {
        return total + (config.rows * config.seatsPerRow);
    }, 0);
});

// Method to get seat map
aircraftSchema.methods.getSeatMap = function() {
    const seatMap = [];
    const letters = 'ABCDEFGHIJ';
    
    let currentRow = 1;
    
    for (const config of this.seatConfiguration) {
        for (let row = 0; row < config.rows; row++) {
            const rowNumber = currentRow++;
            const rowSeats = [];
            
            for (let seat = 0; seat < config.seatsPerRow; seat++) {
                rowSeats.push({
                    seatNumber: `${rowNumber}${letters[seat]}`,
                    class: config.class,
                    hasExtraLegroom: config.extraLegroomRows?.includes(row + 1) || false
                });
            }
            
            seatMap.push({
                row: rowNumber,
                class: config.class,
                seats: rowSeats
            });
        }
    }
    
    return seatMap;
};

const Aircraft = mongoose.model('Aircraft', aircraftSchema);

module.exports = Aircraft;
