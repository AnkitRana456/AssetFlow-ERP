"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateReturn = void 0;
const express_validator_1 = require("express-validator");
const ReturnRequest_1 = require("../models/ReturnRequest");
exports.validateReturn = [
    (0, express_validator_1.body)('asset')
        .notEmpty()
        .withMessage('Asset ID is required')
        .isMongoId()
        .withMessage('Asset ID must be a valid Mongo ID'),
    (0, express_validator_1.body)('returnNotes')
        .optional()
        .isString()
        .withMessage('Return notes must be a string')
        .trim(),
    (0, express_validator_1.body)('condition')
        .notEmpty()
        .withMessage('Condition is required')
        .isIn(Object.values(ReturnRequest_1.ReturnCondition))
        .withMessage('Condition must be EXCELLENT, GOOD, MINOR_DAMAGE, MAJOR_DAMAGE, or LOST')
];
