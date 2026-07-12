"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PASSWORD_REGEX = void 0;
exports.hashPassword = hashPassword;
exports.comparePassword = comparePassword;
exports.isPasswordStrong = isPasswordStrong;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
// Regex: min 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special character
exports.PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&#])[A-Za-z\d@$!%*?&#]{8,}$/;
/**
 * Hash a plain text password.
 */
async function hashPassword(password) {
    const salt = await bcryptjs_1.default.genSalt(10);
    return bcryptjs_1.default.hash(password, salt);
}
/**
 * Compare plain text password with its hash.
 */
async function comparePassword(password, hash) {
    return bcryptjs_1.default.compare(password, hash);
}
/**
 * Validate password strength.
 */
function isPasswordStrong(password) {
    return exports.PASSWORD_REGEX.test(password);
}
