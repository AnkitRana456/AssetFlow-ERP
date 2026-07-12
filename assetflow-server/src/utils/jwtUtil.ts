import jwt from 'jsonwebtoken';
import { UserRole } from '../models/User';

export interface ITokenPayload {
  userId: string;
  role: UserRole;
  email: string;
}

/**
 * Generate Access Token
 */
export function generateAccessToken(payload: ITokenPayload): string {
  const secret = process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key_change_me_in_production_123456';
  const expiry = process.env.JWT_ACCESS_EXPIRY || '15m';
  return jwt.sign(payload, secret, { expiresIn: expiry as any });
}

/**
 * Generate Refresh Token
 */
export function generateRefreshToken(payload: ITokenPayload): string {
  const secret = process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key_change_me_in_production_678910';
  const expiry = process.env.JWT_REFRESH_EXPIRY || '7d';
  return jwt.sign(payload, secret, { expiresIn: expiry as any });
}

/**
 * Verify Access Token. Throws error if invalid or expired.
 */
export function verifyAccessToken(token: string): ITokenPayload {
  const secret = process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key_change_me_in_production_123456';
  return jwt.verify(token, secret) as ITokenPayload;
}

/**
 * Verify Refresh Token. Throws error if invalid or expired.
 */
export function verifyRefreshToken(token: string): ITokenPayload {
  const secret = process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key_change_me_in_production_678910';
  return jwt.verify(token, secret) as ITokenPayload;
}
