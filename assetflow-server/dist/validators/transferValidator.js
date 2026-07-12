"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateTransfer = void 0;
const express_validator_1 = require("express-validator");
exports.validateTransfer = [
    (0, express_validator_1.body)('asset')
        .notEmpty()
        .withMessage('Asset ID is required')
        .isMongoId()
        .withMessage('Asset ID must be a valid Mongo ID'),
    (0, express_validator_1.body)('toEmployee')
        .notEmpty()
        .withMessage('Destination employee ID is required')
        .isMongoId()
        .withMessage('Destination employee ID must be a valid Mongo ID'),
    (0, express_validator_1.body)('toDepartment')
        .optional({ nullable: true })
        .isMongoId()
        .withMessage('Destination department ID must be a valid Mongo ID'),
    (0, express_validator_1.body)('reason')
        .notEmpty()
        .withMessage('Transfer reason is required')
        .isString()
        .withMessage('Transfer reason must be a string')
        .trim()
];
