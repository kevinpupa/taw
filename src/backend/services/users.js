const User = require('../models/user');

// Get all users with pagination
const getAllUsers = async (page = 1, limit = 20, role = null) => {
    const query = {};
    if (role) {
        query.role = role;
    }
    
    const users = await User.find(query)
        .populate('airline', 'name code')
        .skip((page - 1) * limit)
        .limit(parseInt(limit))
        .sort({ createdAt: -1 });
    
    const total = await User.countDocuments(query);
    
    return {
        users,
        pagination: {
            page: parseInt(page),
            limit: parseInt(limit),
            total,
            pages: Math.ceil(total / limit)
        }
    };
};

// Get user by ID
const getUserById = async (userId) => {
    const user = await User.findById(userId).populate('airline');
    
    if (!user) {
        throw new Error('User not found');
    }
    
    return user;
};

// Update user
const updateUser = async (userId, data, requestingUserId, requestingUserRole) => {
    // Check authorization - admin can update anyone, users can only update themselves
    if (requestingUserRole !== 'admin' && requestingUserId !== userId) {
        throw new Error('Not authorized to update this user');
    }
    
    const allowedFields = ['fullName', 'phone'];
    const updates = {};
    
    for (const field of allowedFields) {
        if (data[field] !== undefined) {
            updates[field] = data[field];
        }
    }
    
    const user = await User.findByIdAndUpdate(userId, updates, { new: true }).populate('airline');
    
    if (!user) {
        throw new Error('User not found');
    }
    
    return user;
};

// Deactivate user
const deactivateUser = async (userId, requestingUserId) => {
    // Prevent admin from deleting themselves
    if (requestingUserId.toString() === userId) {
        throw new Error('Cannot delete your own admin account');
    }
    
    const user = await User.findById(userId);
    
    if (!user) {
        throw new Error('User not found');
    }
    
    // Soft delete by deactivating
    user.isActive = false;
    await user.save();
    
    return user;
};

module.exports = {
    getAllUsers,
    getUserById,
    updateUser,
    deactivateUser
};
