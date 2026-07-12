import { body } from 'express-validator';
import { AssetCondition, AssetStatus } from '../models/Asset';

/**
 * Validation rules for Asset Registration / Update
 */
export const validateAsset = [
  body('name')
    .notEmpty()
    .withMessage('Asset name is required')
    .isString()
    .withMessage('Asset name must be a string')
    .trim(),
  body('serialNumber')
    .notEmpty()
    .withMessage('Serial number is required')
    .isString()
    .withMessage('Serial number must be a string')
    .trim()
    .toUpperCase(),
  body('category')
    .notEmpty()
    .withMessage('Category is required')
    .isMongoId()
    .withMessage('Category must be a valid Mongo ID'),
  body('department')
    .notEmpty()
    .withMessage('Department is required')
    .isMongoId()
    .withMessage('Department must be a valid Mongo ID'),
  body('location')
    .notEmpty()
    .withMessage('Location is required')
    .isString()
    .withMessage('Location must be a string')
    .trim(),
  body('condition')
    .notEmpty()
    .withMessage('Condition is required')
    .isIn(Object.values(AssetCondition))
    .withMessage('Condition must be NEW, EXCELLENT, GOOD, FAIR, or POOR'),
  body('purchaseDate')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Purchase date must be a valid ISO8601 date'),
  body('warrantyExpiry')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Warranty expiry date must be a valid ISO8601 date'),
  body('purchasePrice')
    .optional({ nullable: true, checkFalsy: true })
    .isFloat({ min: 0 })
    .withMessage('Purchase price must be a number greater than or equal to 0'),
  body('vendor')
    .optional()
    .isString()
    .withMessage('Vendor must be a string')
    .trim(),
  body('bookable')
    .optional()
    .isBoolean()
    .withMessage('Bookable state must be a boolean'),
  body('sharedResource')
    .optional()
    .isBoolean()
    .withMessage('Shared resource state must be a boolean'),
  body('status')
    .optional()
    .isIn(Object.values(AssetStatus))
    .withMessage('Status must be a valid AssetStatus value')
];
