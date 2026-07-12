"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SettingsSchema = exports.Settings = void 0;
const mongoose_1 = require("mongoose");
const SettingsSchema = new mongoose_1.Schema({
    orgName: { type: String, default: 'AssetFlow ERP', required: true, trim: true },
    brandLogoUrl: { type: String },
    theme: { type: String, default: 'INDIGO' },
    smtpHost: { type: String },
    smtpPort: { type: Number, default: 2525 },
    smtpUser: { type: String },
    smtpPass: { type: String },
    cloudinaryCloudName: { type: String },
    cloudinaryApiKey: { type: String },
    cloudinaryApiSecret: { type: String },
    sessionTimeout: { type: Number, default: 30 },
    language: { type: String, default: 'en' },
    timezone: { type: String, default: 'UTC' },
    passwordMinLength: { type: Number, default: 8 }
}, { timestamps: true });
exports.SettingsSchema = SettingsSchema;
exports.Settings = (0, mongoose_1.model)('Settings', SettingsSchema);
