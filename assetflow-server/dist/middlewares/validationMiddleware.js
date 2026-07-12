"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateRequest = validateRequest;
const express_validator_1 = require("express-validator");
/**
 * Middleware to intercept validation results and return a structured 400 response on validation failures.
 */
function validateRequest(req, res, next) {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        res.status(400).json({
            message: 'Validation errors encountered.',
            errors: errors.array().map(err => ({
                field: err.path || '',
                message: err.msg
            }))
        });
        return;
    }
    next();
}
