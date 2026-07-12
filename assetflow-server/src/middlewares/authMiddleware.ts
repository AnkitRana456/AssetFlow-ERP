import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwtUtil';
import { User, UserRole, UserStatus } from '../models/User';

/**
 * Authentication Middleware: Verifies the JWT Access Token in the request header or cookie.
 */
export async function authenticate(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    let token = '';

    // Check Authorization Header: Bearer <token>
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
      token = req.headers.authorization.split(' ')[1];
    } 
    // Fallback: Check in cookies if any
    else if (req.cookies && req.cookies.access_token) {
      token = req.cookies.access_token;
    }

    if (!token) {
      res.status(401).json({ message: 'Authentication required. No token provided.' });
      return;
    }

    try {
      const decoded = verifyAccessToken(token);
      req.user = decoded;
      next();
    } catch (err: any) {
      if (err.name === 'TokenExpiredError') {
        res.status(401).json({ message: 'Access token expired.', code: 'TOKEN_EXPIRED' });
        return;
      }
      res.status(401).json({ message: 'Invalid access token.' });
      return;
    }
  } catch (error) {
    next(error);
  }
}

/**
 * Authorization Middleware: Checks if the user's role matches any allowed roles.
 */
export function authorize(...allowedRoles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized. Authentication required.' });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      res.status(403).json({ message: 'Forbidden. Insufficient permissions.' });
      return;
    }

    next();
  };
}

/**
 * Account Status Middleware: Checks if the authenticated user's account is Active and not deleted.
 */
export async function checkActive(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    if (!req.user) {
      res.status(401).json({ message: 'Unauthorized. Authentication required.' });
      return;
    }

    const user = await User.findById(req.user.userId);
    if (!user) {
      res.status(404).json({ message: 'User account not found.' });
      return;
    }

    if (user.status !== UserStatus.ACTIVE) {
      res.status(403).json({ 
        message: `Account is inactive or suspended. Current status: ${user.status}`,
        code: 'ACCOUNT_INACTIVE'
      });
      return;
    }

    if (user.deletedAt) {
      res.status(403).json({ message: 'This account has been deleted.' });
      return;
    }

    next();
  } catch (error) {
    next(error);
  }
}
