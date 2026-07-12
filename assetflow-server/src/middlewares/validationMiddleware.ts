import { Request, Response, NextFunction } from 'express';
import { validationResult } from 'express-validator';

/**
 * Middleware to intercept validation results and return a structured 400 response on validation failures.
 */
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    res.status(400).json({
      message: 'Validation errors encountered.',
      errors: errors.array().map(err => ({
        field: (err as any).path || '',
        message: err.msg
      }))
    });
    return;
  }
  next();
}
