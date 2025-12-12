/**
 * Shared validation middleware
 * Extracts and validates request data using express-validator
 * Used across all route files to avoid duplication
 */

const { validationResult } = require('express-validator');

/**
 * Generic validation middleware
 * Checks for express-validator errors and returns formatted response
 * 
 * Usage in routes:
 * router.post('/', [validation rules], validate, controller.method);
 */
const validate = (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        // Log validation errors and payload for debugging
        console.error('Validation failed:', errors.array(), 'Body:', JSON.stringify(req.body));
        return res.status(400).json({ errors: errors.array() });
    }
    next();
};

module.exports = {
    validate
};
