import { Request, Response, NextFunction, RequestHandler } from 'express';

/**
 * Wraps async Express middleware/route handlers to forward thrown errors 
 * to the global error middleware automatically.
 */
export const asyncHandler = (fn: RequestHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
