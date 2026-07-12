"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CONFIG = void 0;
__exportStar(require("./db"), exports);
exports.CONFIG = {
    db: {
        uri: process.env.MONGO_URI || 'mongodb://localhost:27017/assetflow'
    },
    jwt: {
        accessSecret: process.env.JWT_ACCESS_SECRET || 'your_super_secret_access_key_change_me_in_production_123456',
        refreshSecret: process.env.JWT_REFRESH_SECRET || 'your_super_secret_refresh_key_change_me_in_production_678910',
        accessExpiry: process.env.JWT_ACCESS_EXPIRY || '15m',
        refreshExpiry: process.env.JWT_REFRESH_EXPIRY || '7d'
    }
};
