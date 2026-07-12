"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = errorHandler;
/**
 * Global Express Error Handler.
 */
function errorHandler(err, req, res, next) {
    // Log details
    console.error('🔥 Error handler intercept:', err);
    const status = err.status || err.statusCode || 500;
    let message = err.message || 'Internal Server Error';
    // Handle Mongoose duplicate key error (11000)
    if (err.code === 11000) {
        const field = Object.keys(err.keyValue || {})[0] || 'field';
        const val = err.keyValue ? err.keyValue[field] : 'value';
        message = `Duplicate field value error: The ${field} '${val}' already exists.`;
    }
    // Handle Mongoose validation errors
    if (err.name === 'ValidationError') {
        const messages = Object.values(err.errors || {}).map((val) => val.message);
        message = `Database validation failed: ${messages.join(', ')}`;
    }
    res.status(status).json({
        message,
        code: err.code || err.name || 'INTERNAL_ERROR',
        stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
}
