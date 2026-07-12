import { body } from 'express-validator';
import { ReturnCondition } from '../models/ReturnRequest';

export const validateReturn = [
  body('asset')
    .notEmpty()
    .withMessage('Asset ID is required')
    .isMongoId()
    .withMessage('Asset ID must be a valid Mongo ID'),
  body('returnNotes')
    .optional()
    .isString()
    .withMessage('Return notes must be a string')
    .trim(),
  body('condition')
    .notEmpty()
    .withMessage('Condition is required')
    .isIn(Object.values(ReturnCondition))
    .withMessage('Condition must be EXCELLENT, GOOD, MINOR_DAMAGE, MAJOR_DAMAGE, or LOST')
];
