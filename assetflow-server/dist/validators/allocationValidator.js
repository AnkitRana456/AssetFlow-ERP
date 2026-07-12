"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAllocation = void 0;
const express_validator_1 = require("express-validator");
exports.validateAllocation = [
    (0, express_validator_1.body)('asset')
        .notEmpty()
        .withMessage('Asset ID is required')
        .isMongoId()
        .withMessage('Asset ID must be a valid Mongo ID'),
    (0, express_validator_1.body)('employee')
        .notEmpty()
        .withMessage('Employee ID is required')
        .isMongoId()
        .withMessage('Employee ID must be a valid Mongo ID'),
    (0, express_validator_1.body)('department')
        .notEmpty()
        .withMessage('Department ID is required')
        .isMongoId()
        .withMessage('Department ID must be a valid Mongo ID'),
    (0, express_validator_1.body)('expectedReturn')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage('Expected return date must be a valid ISO8601 date'),
    (0, express_validator_1.body)('purpose')
        .optional()
        .isString()
        .withMessage('Purpose must be a string')
        .trim(),
    (0, express_validator_1.body)('notes')
        .optional()
        .isString()
        .withMessage('Notes must be a string')
        .trim(),
    (0, express_validator_1.body)('attachments')
        .optional()
        .isArray()
        .withMessage('Attachments must be an array')
];
