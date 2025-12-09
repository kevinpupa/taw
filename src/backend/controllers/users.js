const userService = require('../services/users');
const authService = require('../services/auth');

// Get all users
const getAllUsers = async (req, res, next) => {
    try {
        const { role, page = 1, limit = 20 } = req.query;
        
        const result = await userService.getAllUsers(
            page,
            limit,
            role
        );
        
        res.json(result);
    } catch (error) {
        next(error);
    }
};

// Get user by ID
const getUserById = async (req, res, next) => {
    try {
        const user = await userService.getUserById(req.params.id);
        res.json({ user });
    } catch (error) {
        if (error.message === 'User not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Create airline user by invitation
const createAirlineUser = async (req, res, next) => {
    try {
        const user = await authService.createAirlineUser(req.body, req.user);
        
        res.status(201).json({
            message: 'Airline user created successfully. User must change password on first login.',
            user
        });
    } catch (error) {
        if (error.message.includes('already exists')) {
            return res.status(409).json({ error: { message: error.message } });
        }
        if (error.message.includes('Only admin')) {
            return res.status(403).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Update user
const updateUser = async (req, res, next) => {
    try {
        const user = await userService.updateUser(
            req.params.id,
            req.body,
            req.user._id,
            req.user.role
        );
        
        res.json({ user });
    } catch (error) {
        if (error.message === 'Not authorized to update this user') {
            return res.status(403).json({ error: { message: error.message } });
        }
        if (error.message === 'User not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

// Delete user
const deleteUser = async (req, res, next) => {
    try {
        await userService.deactivateUser(
            req.params.id,
            req.user._id
        );
        
        res.json({ message: 'User deleted successfully' });
    } catch (error) {
        if (error.message === 'Cannot delete your own admin account') {
            return res.status(400).json({ error: { message: error.message } });
        }
        if (error.message === 'User not found') {
            return res.status(404).json({ error: { message: error.message } });
        }
        next(error);
    }
};

module.exports = {
    getAllUsers,
    getUserById,
    createAirlineUser,
    updateUser,
    deleteUser
};
