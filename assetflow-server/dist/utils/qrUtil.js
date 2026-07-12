"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateQRCodeDataURI = generateQRCodeDataURI;
const qrcode_1 = __importDefault(require("qrcode"));
/**
 * Generate a QR Code as a base64 Data URI
 * @param text The payload to embed inside the QR Code (e.g. asset URL or tag)
 */
async function generateQRCodeDataURI(text) {
    try {
        return await qrcode_1.default.toDataURL(text, {
            errorCorrectionLevel: 'H',
            type: 'image/png',
            margin: 1,
            width: 300
        });
    }
    catch (err) {
        console.error('❌ Failed to generate QR Code:', err);
        throw err;
    }
}
