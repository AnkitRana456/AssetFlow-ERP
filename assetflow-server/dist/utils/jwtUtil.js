"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateAccessToken = generateAccessToken;
exports.generateRefreshToken = generateRefreshToken;
exports.verifyAccessToken = verifyAccessToken;
exports.verifyRefreshToken = verifyRefreshToken;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
/**
 * Generate Access Token
 */
function generateAccessToken(payload) {
    const secret = process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key_change_me_in_production_123456';
    const expiry = process.env.JWT_ACCESS_EXPIRY || '15m';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: expiry });
}
/**
 * Generate Refresh Token
 */
function generateRefreshToken(payload) {
    const secret = process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key_change_me_in_production_678910';
    const expiry = process.env.JWT_REFRESH_EXPIRY || '7d';
    return jsonwebtoken_1.default.sign(payload, secret, { expiresIn: expiry });
}
/**
 * Verify Access Token. Throws error if invalid or expired.
 */
function verifyAccessToken(token) {
    const secret = process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key_change_me_in_production_123456';
    return jsonwebtoken_1.default.verify(token, secret);
}
/**
 * Verify Refresh Token. Throws error if invalid or expired.
 */
function verifyRefreshToken(token) {
    const secret = process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key_change_me_in_production_678910';
    return jsonwebtoken_1.default.verify(token, secret);
}
