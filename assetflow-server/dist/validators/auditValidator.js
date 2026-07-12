"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateCloseAudit = exports.validateVerification = exports.validateAuditCycle = void 0;
const express_validator_1 = require("express-validator");
const AuditCycle_1 = require("../models/AuditCycle");
const AuditItem_1 = require("../models/AuditItem");
exports.validateAuditCycle = [
    (0, express_validator_1.body)('title')
        .notEmpty()
        .withMessage('Audit cycle name/title is required')
        .isString()
        .withMessage('Audit cycle title must be a string')
        .trim(),
    (0, express_validator_1.body)('description')
        .optional()
        .isString()
        .withMessage('Description must be a string')
        .trim(),
    (0, express_validator_1.body)('type')
        .notEmpty()
        .withMessage('Audit type is required')
        .isIn(Object.values(AuditCycle_1.AuditCycleType))
        .withMessage('Invalid audit type'),
    (0, express_validator_1.body)('department')
        .optional({ nullable: true, checkFalsy: true })
        .isMongoId()
        .withMessage('Department must be a valid Mongo ID')
        .custom((value, { req }) => {
        if (req.body.type === AuditCycle_1.AuditCycleType.DEPARTMENT && !value) {
            throw new Error('Department is required when audit type is DEPARTMENT');
        }
        return true;
    }),
    (0, express_validator_1.body)('location')
        .optional({ nullable: true, checkFalsy: true })
        .isString()
        .withMessage('Location must be a string')
        .custom((value, { req }) => {
        if (req.body.type === AuditCycle_1.AuditCycleType.LOCATION && !value) {
            throw new Error('Location is required when audit type is LOCATION');
        }
        return true;
    }),
    (0, express_validator_1.body)('categories')
        .optional()
        .isArray()
        .withMessage('Categories must be an array of IDs'),
    (0, express_validator_1.body)('categories.*')
        .optional()
        .isMongoId()
        .withMessage('Category must be a valid Mongo ID')
        .custom((value, { req }) => {
        if (req.body.type === AuditCycle_1.AuditCycleType.CATEGORY && (!req.body.categories || req.body.categories.length === 0)) {
            throw new Error('At least one Category is required when audit type is CATEGORY');
        }
        return true;
    }),
    (0, express_validator_1.body)('auditors')
        .notEmpty()
        .withMessage('Auditors array is required')
        .isArray({ min: 1 })
        .withMessage('At least one auditor must be assigned'),
    (0, express_validator_1.body)('auditors.*')
        .isMongoId()
        .withMessage('Auditor must be a valid Mongo ID User'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(Object.values(AuditCycle_1.AuditPriority))
        .withMessage('Priority must be LOW, MEDIUM, or HIGH'),
    (0, express_validator_1.body)('startDate')
        .notEmpty()
        .withMessage('Start date is required')
        .isISO8601()
        .withMessage('Start date must be a valid ISO8601 date'),
    (0, express_validator_1.body)('endDate')
        .notEmpty()
        .withMessage('End date is required')
        .isISO8601()
        .withMessage('End date must be a valid ISO8601 date')
        .custom((value, { req }) => {
        if (new Date(value) <= new Date(req.body.startDate)) {
            throw new Error('End date must be after start date');
        }
        return true;
    })
];
exports.validateVerification = [
    (0, express_validator_1.body)('scannedCode')
        .optional()
        .isString()
        .withMessage('Scanned code must be a string')
        .trim(),
    (0, express_validator_1.body)('assetId')
        .optional()
        .isMongoId()
        .withMessage('Asset ID must be a valid Mongo ID'),
    (0, express_validator_1.body)('verificationStatus')
        .notEmpty()
        .withMessage('Verification status is required')
        .isIn(Object.values(AuditItem_1.AuditVerificationStatus))
        .withMessage('Invalid verification status (VERIFIED, MISSING, DAMAGED, DISPOSED, DUPLICATE)'),
    (0, express_validator_1.body)('auditorNotes')
        .optional()
        .isString()
        .withMessage('Notes must be a string')
        .trim()
];
exports.validateCloseAudit = [
    (0, express_validator_1.body)('resolutionNotes')
        .notEmpty()
        .withMessage('Resolution and closure notes are required to close the audit cycle')
        .isString()
        .withMessage('Resolution notes must be a string')
        .trim()
];
