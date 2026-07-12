"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = authenticate;
exports.authorize = authorize;
exports.checkActive = checkActive;
const jwtUtil_1 = require("../utils/jwtUtil");
const User_1 = require("../models/User");
/**
 * Authentication Middleware: Verifies the JWT Access Token in the request header or cookie.
 */
async function authenticate(req, res, next) {
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
            const decoded = (0, jwtUtil_1.verifyAccessToken)(token);
            req.user = decoded;
            next();
        }
        catch (err) {
            if (err.name === 'TokenExpiredError') {
                res.status(401).json({ message: 'Access token expired.', code: 'TOKEN_EXPIRED' });
                return;
            }
            res.status(401).json({ message: 'Invalid access token.' });
            return;
        }
    }
    catch (error) {
        next(error);
    }
}
/**
 * Authorization Middleware: Checks if the user's role matches any allowed roles.
 */
function authorize(...allowedRoles) {
    return (req, res, next) => {
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
async function checkActive(req, res, next) {
    try {
        if (!req.user) {
            res.status(401).json({ message: 'Unauthorized. Authentication required.' });
            return;
        }
        const user = await User_1.User.findById(req.user.userId);
        if (!user) {
            res.status(404).json({ message: 'User account not found.' });
            return;
        }
        if (user.status !== User_1.UserStatus.ACTIVE) {
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
    }
    catch (error) {
        next(error);
    }
}
