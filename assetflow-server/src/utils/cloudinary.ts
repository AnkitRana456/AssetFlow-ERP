import { v2 as cloudinary } from 'cloudinary';
import fs from 'fs';
import path from 'path';

// Configure Cloudinary if credentials exist
const isCloudinaryConfigured = 
  process.env.CLOUDINARY_CLOUD_NAME && 
  process.env.CLOUDINARY_API_KEY && 
  process.env.CLOUDINARY_API_SECRET;

if (isCloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET
  });
} else {
  console.warn('⚠️ Cloudinary credentials missing. File uploads will default to local filesystem storage.');
}

/**
 * Upload a local file to Cloudinary (or local filesystem if not configured)
 * @param filePath Path of the local file
 * @param folder Folder name in Cloudinary (or subdirectory locally)
 */
export async function uploadToCloudinary(filePath: string, folder: string = 'assetflow'): Promise<string> {
  try {
    if (isCloudinaryConfigured) {
      const result = await cloudinary.uploader.upload(filePath, {
        folder: folder,
        resource_type: 'auto'
      });
      // Delete temp local file after upload
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      return result.secure_url;
    } else {
      // Local fallback: Move file to public uploads directory
      const fileName = path.basename(filePath);
      const publicUploadsDir = path.join(__dirname, '../uploads');
      
      if (!fs.existsSync(publicUploadsDir)) {
        fs.mkdirSync(publicUploadsDir, { recursive: true });
      }

      const destPath = path.join(publicUploadsDir, fileName);
      fs.copyFileSync(filePath, destPath);
      
      // Delete temp file after copy
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }

      const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
      return `${serverUrl}/uploads/${fileName}`;
    }
  } catch (error) {
    console.error('❌ File upload error:', error);
    // Cleanup temp file on error
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
    throw error;
  }
}

/**
 * Delete a file from Cloudinary (or local filesystem if not configured)
 * @param fileUrl URL of the file to delete
 */
export async function deleteFromCloudinary(fileUrl: string): Promise<void> {
  try {
    if (!fileUrl) return;

    if (isCloudinaryConfigured && fileUrl.includes('cloudinary.com')) {
      // Extract public_id from Cloudinary URL
      const parts = fileUrl.split('/');
      const uploadIndex = parts.indexOf('upload');
      if (uploadIndex !== -1 && parts.length > uploadIndex + 2) {
        const publicIdWithExt = parts.slice(uploadIndex + 2).join('/');
        const publicId = publicIdWithExt.substring(0, publicIdWithExt.lastIndexOf('.')) || publicIdWithExt;
        await cloudinary.uploader.destroy(publicId);
      }
    } else {
      // Local fallback: Remove local file
      const serverUrl = process.env.SERVER_URL || 'http://localhost:5000';
      if (fileUrl.startsWith(`${serverUrl}/uploads/`)) {
        const fileName = fileUrl.replace(`${serverUrl}/uploads/`, '');
        const filePath = path.join(__dirname, '../uploads', fileName);
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
      }
    }
  } catch (error) {
    console.error('❌ File deletion error:', error);
  }
}
