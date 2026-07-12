"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateAsset = void 0;
const express_validator_1 = require("express-validator");
const Asset_1 = require("../models/Asset");
/**
 * Validation rules for Asset Registration / Update
 */
exports.validateAsset = [
    (0, express_validator_1.body)('name')
        .notEmpty()
        .withMessage('Asset name is required')
        .isString()
        .withMessage('Asset name must be a string')
        .trim(),
    (0, express_validator_1.body)('serialNumber')
        .notEmpty()
        .withMessage('Serial number is required')
        .isString()
        .withMessage('Serial number must be a string')
        .trim()
        .toUpperCase(),
    (0, express_validator_1.body)('category')
        .notEmpty()
        .withMessage('Category is required')
        .isMongoId()
        .withMessage('Category must be a valid Mongo ID'),
    (0, express_validator_1.body)('department')
        .notEmpty()
        .withMessage('Department is required')
        .isMongoId()
        .withMessage('Department must be a valid Mongo ID'),
    (0, express_validator_1.body)('location')
        .notEmpty()
        .withMessage('Location is required')
        .isString()
        .withMessage('Location must be a string')
        .trim(),
    (0, express_validator_1.body)('condition')
        .notEmpty()
        .withMessage('Condition is required')
        .isIn(Object.values(Asset_1.AssetCondition))
        .withMessage('Condition must be NEW, EXCELLENT, GOOD, FAIR, or POOR'),
    (0, express_validator_1.body)('purchaseDate')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage('Purchase date must be a valid ISO8601 date'),
    (0, express_validator_1.body)('warrantyExpiry')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .withMessage('Warranty expiry date must be a valid ISO8601 date'),
    (0, express_validator_1.body)('purchasePrice')
        .optional({ nullable: true, checkFalsy: true })
        .isFloat({ min: 0 })
        .withMessage('Purchase price must be a number greater than or equal to 0'),
    (0, express_validator_1.body)('vendor')
        .optional()
        .isString()
        .withMessage('Vendor must be a string')
        .trim(),
    (0, express_validator_1.body)('bookable')
        .optional()
        .isBoolean()
        .withMessage('Bookable state must be a boolean'),
    (0, express_validator_1.body)('sharedResource')
        .optional()
        .isBoolean()
        .withMessage('Shared resource state must be a boolean'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(Object.values(Asset_1.AssetStatus))
        .withMessage('Status must be a valid AssetStatus value')
];
