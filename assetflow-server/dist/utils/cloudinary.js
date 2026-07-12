"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadToCloudinary = uploadToCloudinary;
exports.deleteFromCloudinary = deleteFromCloudinary;
const cloudinary_1 = require("cloudinary");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET;
if (isCloudinaryConfigured) {
    cloudinary_1.v2.config({
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
        api_key: process.env.CLOUDINARY_API_KEY,
        api_secret: process.env.CLOUDINARY_API_SECRET
    });
}
else {
    console.warn('⚠️ Cloudinary credentials missing. File uploads will default to local filesystem storage.');
}
/**
 * Upload a local file to Cloudinary (or local filesystem if not configured)
 * @param filePath Path of the local file
 * @param folder Folder name in Cloudinary (or subdirectory locally)
 */
async function uploadToCloudinary(filePath, folder = 'assetflow') {
    try {
        if (isCloudinaryConfigured) {
            const result = await cloudinary_1.v2.uploader.upload(filePath, {
                folder: folder,
                resource_type: 'auto'
            });
            // Delete temp local file after upload
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            return result.secure_url;
        }
        else {
            // Local fallback: Move file to public uploads directory
            const fileName = path_1.default.basename(filePath);
            const publicUploadsDir = path_1.default.join(__dirname, '../uploads');
            if (!fs_1.default.existsSync(publicUploadsDir)) {
                fs_1.default.mkdirSync(publicUploadsDir, { recursive: true });
            }
            const destPath = path_1.default.join(publicUploadsDir, fileName);
            fs_1.default.copyFileSync(filePath, destPath);
            // Delete temp file after copy
            if (fs_1.default.existsSync(filePath)) {
                fs_1.default.unlinkSync(filePath);
            }
            const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
            return `${serverUrl}/uploads/${fileName}`;
        }
    }
    catch (error) {
        console.error('❌ File upload error:', error);
        // Cleanup temp file on error
        if (fs_1.default.existsSync(filePath)) {
            fs_1.default.unlinkSync(filePath);
        }
        throw error;
    }
}
/**
 * Delete a file from Cloudinary (or local filesystem if not configured)
 * @param fileUrl URL of the file to delete
 */
async function deleteFromCloudinary(fileUrl) {
    try {
        if (!fileUrl)
            return;
        if (isCloudinaryConfigured && fileUrl.includes('cloudinary.com')) {
            // Extract public_id from Cloudinary URL
            const parts = fileUrl.split('/');
            const uploadIndex = parts.indexOf('upload');
            if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
                const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
                const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;
                await cloudinary_1.v2.uploader.destroy(publicId);
            }
        }
        else {
            // Local fallback: Remove local file
            const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
            if (fileUrl.startsWith(`${serverUrl}/uploads/`)) {
                const fileName = fileUrl.replace(`${serverUrl}/uploads/`, '');
                const filePath = path_1.default.join(__dirname, '../uploads', fileName);
                if (fs_1.default.existsSync(filePath)) {
                    fs_1.default.unlinkSync(filePath);
                }
            }
        }
    }
    catch (error) {
        console.error('❌ File deletion error:', error);
    }
}
