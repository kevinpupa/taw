const Airline = require('../models/airline');

/**
 * Get all airlines with pagination
 * @param {number} page - Current page number (default: 1)
 * @param {number} limit - Items per page (default: 20)
 * @param {boolean} active - Filter only active airlines (default: true)
 * 
 * Libraries used:
 * - Mongoose (MongoDB ORM): Airline.find() queries the database
 * 
 * Non-default functions:
 * - .skip(): Skip N records (for pagination)
 * - .limit(): Limit results to N records
 * - .sort(): Sort by field (1=ascending, -1=descending)
 * - .countDocuments(): Count total matching records
 */
const getAllAirlines = async (page = 1, limit = 20, active = true) => {
    // Build MongoDB query object
    const query = {};
    if (active) {
        query.isActive = true; // Only get active airlines
    }
    
    // Query database with pagination
    const airlines = await Airline.find(query)
        .skip((page - 1) * limit)  // Skip to correct page
        .limit(parseInt(limit))     // Limit results
        .sort({ name: 1 });         // Sort by name ascending
    
    // Count total matching documents
    const total = await Airline.countDocuments(query);
    
    return {
        airlines,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)  // Calculate total pages
        }
    };
};
/**
 * Get airline by ID
 * Non-default functions:
 * - .findById(): Find document by MongoDB _id field
 */
const getAirlineById = async (airlineId) => {
    const airline = await Airline.findById(airlineId);
    
    if (!airline) {
        throw new Error('Airline not found');
    }
    
    return airline;
};

/**
 * Create new airline
 * Non-default functions:
 * - new Airline(): Create new document instance
 * - .save(): Save document to MongoDB
 * 
 * Error handling:
 * - error.code === 11000: MongoDB duplicate key error
 *   This happens when trying to insert duplicate unique fields
 */
const createAirline = async (data) => {
    const { name, code, country, description, logo } = data;
    
    // Create new airline instance (not saved yet)
    const airline = new Airline({
        name,
        code: code.toUpperCase(),
        country,
        description,
        logo
    });
    
    try {
        await airline.save(); // Save to MongoDB
        return airline;
    } catch (error) {
        // Handle duplicate airline code or name
        if (error.code === 11000) {
            throw new Error('Airline with this name or code already exists');
        }
        throw error;
    }
};

/**
 * Update airline
 * Authorization:
 * - Admins can update any airline
 * - Airline users can only update their own airline
 */
const updateAirline = async (airlineId, data, userRole, userAirlineId) => {
    // Check if user has permission to update this airline
    if (userRole !== 'admin' && userAirlineId !== airlineId) {
        throw new Error('Not authorized to update this airline');
    }
    
    // Only allow updating these fields
    const allowedFields = ['name', 'description', 'logo', 'country'];
    const updates = {};
    
    // Add only provided fields to updates object
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updates[field] = data[field];
        }
    }
    
    // Non-default function:
    // .findByIdAndUpdate(): Find by ID and update fields, returns updated document
    const airline = await Airline.findByIdAndUpdate(airlineId, updates, { new: true });
    
    if (!airline) {
        throw new Error('Airline not found');
    }
    
    return airline;
};

/**
 * Deactivate airline (soft delete)
 * We don't actually delete from DB, just mark as inactive
 * This preserves historical data
 */
const deactivateAirline = async (airlineId) => {
    const airline = await Airline.findById(airlineId);
    
    if (!airline) {
        throw new Error('Airline not found');
    }
    
    airline.isActive = false; // Mark as inactive instead of deleting
    await airline.save();
    
    return airline;
};

module.exports = {
    getAllAirlines,
    getAirlineById,
    createAirline,
    updateAirline,
    deactivateAirline
};
