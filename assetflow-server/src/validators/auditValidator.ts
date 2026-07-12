import { body } from 'express-validator';
import { AuditCycleType, AuditPriority } from '../models/AuditCycle';
import { AuditVerificationStatus } from '../models/AuditItem';

export const validateAuditCycle = [
  body('title')
    .notEmpty()
    .withMessage('Audit cycle name/title is required')
    .isString()
    .withMessage('Audit cycle title must be a string')
    .trim(),
  body('description')
    .optional()
    .isString()
    .withMessage('Description must be a string')
    .trim(),
  body('type')
    .notEmpty()
    .withMessage('Audit type is required')
    .isIn(Object.values(AuditCycleType))
    .withMessage('Invalid audit type'),
  body('department')
    .optional({ nullable: true, checkFalsy: true })
    .isMongoId()
    .withMessage('Department must be a valid Mongo ID')
    .custom((value, { req }) => {
      if (req.body.type === AuditCycleType.DEPARTMENT && !value) {
        throw new Error('Department is required when audit type is DEPARTMENT');
      }
      return true;
    }),
  body('location')
    .optional({ nullable: true, checkFalsy: true })
    .isString()
    .withMessage('Location must be a string')
    .custom((value, { req }) => {
      if (req.body.type === AuditCycleType.LOCATION && !value) {
        throw new Error('Location is required when audit type is LOCATION');
      }
      return true;
    }),
  body('categories')
    .optional()
    .isArray()
    .withMessage('Categories must be an array of IDs'),
  body('categories.*')
    .optional()
    .isMongoId()
    .withMessage('Category must be a valid Mongo ID')
    .custom((value, { req }) => {
      if (req.body.type === AuditCycleType.CATEGORY && (!req.body.categories || req.body.categories.length === 0)) {
        throw new Error('At least one Category is required when audit type is CATEGORY');
      }
      return true;
    }),
  body('auditors')
    .notEmpty()
    .withMessage('Auditors array is required')
    .isArray({ min: 1 })
    .withMessage('At least one auditor must be assigned'),
  body('auditors.*')
    .isMongoId()
    .withMessage('Auditor must be a valid Mongo ID User'),
  body('priority')
    .optional()
    .isIn(Object.values(AuditPriority))
    .withMessage('Priority must be LOW, MEDIUM, or HIGH'),
  body('startDate')
    .notEmpty()
    .withMessage('Start date is required')
    .isISO8601()
    .withMessage('Start date must be a valid ISO8601 date'),
  body('endDate')
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

export const validateVerification = [
  body('scannedCode')
    .optional()
    .isString()
    .withMessage('Scanned code must be a string')
    .trim(),
  body('assetId')
    .optional()
    .isMongoId()
    .withMessage('Asset ID must be a valid Mongo ID'),
  body('verificationStatus')
    .notEmpty()
    .withMessage('Verification status is required')
    .isIn(Object.values(AuditVerificationStatus))
    .withMessage('Invalid verification status (VERIFIED, MISSING, DAMAGED, DISPOSED, DUPLICATE)'),
  body('auditorNotes')
    .optional()
    .isString()
    .withMessage('Notes must be a string')
    .trim()
];

export const validateCloseAudit = [
  body('resolutionNotes')
    .notEmpty()
    .withMessage('Resolution and closure notes are required to close the audit cycle')
    .isString()
    .withMessage('Resolution notes must be a string')
    .trim()
];
