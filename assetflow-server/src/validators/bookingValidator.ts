import { body } from 'express-validator';
import { BookingPriority, RecurrencePattern } from '../models/Booking';

export const validateBooking = [
  body('title')
    .notEmpty()
    .withMessage('Booking title is required')
    .isString()
    .withMessage('Booking title must be a string')
    .trim(),
  body('resource')
    .notEmpty()
    .withMessage('Resource ID is required')
    .isMongoId()
    .withMessage('Resource must be a valid Mongo ID'),
  body('startTime')
    .notEmpty()
    .withMessage('Start time is required')
    .isISO8601()
    .withMessage('Start time must be a valid ISO8601 date'),
  body('endTime')
    .notEmpty()
    .withMessage('End time is required')
    .isISO8601()
    .withMessage('End time must be a valid ISO8601 date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('End time must be after start time');
      }
      return true;
    }),
  body('priority')
    .optional()
    .isIn(Object.values(BookingPriority))
    .withMessage('Priority must be LOW, MEDIUM, or HIGH'),
  body('remarks')
    .optional()
    .isString()
    .withMessage('Remarks must be a string')
    .trim(),
  body('participants')
    .optional()
    .isArray()
    .withMessage('Participants must be an array of User IDs'),
  body('participants.*')
    .optional()
    .isMongoId()
    .withMessage('Participant ID must be a valid Mongo ID'),
  body('isRecurring')
    .optional()
    .isBoolean()
    .withMessage('isRecurring must be a boolean'),
  body('recurrencePattern')
    .optional()
    .isIn(Object.values(RecurrencePattern))
    .withMessage('Recurrence pattern must be DAILY, WEEKLY, or MONTHLY')
    .custom((value, { req }) => {
      if (req.body.isRecurring && !value) {
        throw new Error('Recurrence pattern is required for recurring bookings');
      }
      return true;
    }),
  body('recurrenceUntil')
    .optional({ nullable: true, checkFalsy: true })
    .isISO8601()
    .withMessage('Recurrence until date must be a valid ISO8601 date')
    .custom((value, { req }) => {
      if (req.body.isRecurring && value && new Date(value) <= new Date(req.body.endTime)) {
        throw new Error('Recurrence end date must be after the initial booking end time');
      }
      return true;
    }),
  body('attachment')
    .optional()
    .isString()
    .withMessage('Attachment must be a string URL')
];

export const validateReschedule = [
  body('bookingId')
    .notEmpty()
    .withMessage('Booking ID is required')
    .isMongoId()
    .withMessage('Booking ID must be a valid Mongo ID'),
  body('startTime')
    .notEmpty()
    .withMessage('New start time is required')
    .isISO8601()
    .withMessage('New start time must be a valid ISO8601 date'),
  body('endTime')
    .notEmpty()
    .withMessage('New end time is required')
    .isISO8601()
    .withMessage('New end time must be a valid ISO8601 date')
    .custom((value, { req }) => {
      if (new Date(value) <= new Date(req.body.startTime)) {
        throw new Error('New end time must be after new start time');
      }
      return true;
    }),
  body('resourceId')
    .optional()
    .isMongoId()
    .withMessage('Resource ID must be a valid Mongo ID')
];
