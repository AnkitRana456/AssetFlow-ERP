import { body } from 'express-validator';

export const validateTransfer = [
  body('asset')
    .notEmpty()
    .withMessage('Asset ID is required')
    .isMongoId()
    .withMessage('Asset ID must be a valid Mongo ID'),
  body('toEmployee')
    .notEmpty()
    .withMessage('Destination employee ID is required')
    .isMongoId()
    .withMessage('Destination employee ID must be a valid Mongo ID'),
  body('toDepartment')
    .optional({ nullable: true })
    .isMongoId()
    .withMessage('Destination department ID must be a valid Mongo ID'),
  body('reason')
    .notEmpty()
    .withMessage('Transfer reason is required')
    .isString()
    .withMessage('Transfer reason must be a string')
    .trim()
];
