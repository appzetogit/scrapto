import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { uploadToCloudinary, deleteFromCloudinary, uploadBufferToCloudinary } from '../config/cloudinary.js';
import { MAX_FILE_SIZE, FILE_TYPES } from '../config/constants.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Use Memory Storage for better reliability (especially in production/serverless)
const storage = multer.memoryStorage();

// File filter
const fileFilter = (req, file, cb) => {
  if (FILE_TYPES.IMAGE.includes(file.mimetype) || FILE_TYPES.DOCUMENT.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only images and documents are allowed.'), false);
  }
};

// Configure multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: MAX_FILE_SIZE
  },
  fileFilter: fileFilter
});

/**
 * Upload single file to Cloudinary
 * @param {Object} file - Multer file object
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
export const uploadFile = async (file, options = {}) => {
  try {
    if (!file) {
      throw new Error('No file provided');
    }

    const folder = options.folder || 'general';

    // Check for Cloudinary credentials
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials are not properly configured on the server');
    }

    // Upload to Cloudinary
    logger.info(`Starting Cloudinary upload for ${file.originalname} to folder ${folder}`);

    let result;

    if (file.buffer) {
      // Memory Storage path
      result = await uploadBufferToCloudinary(file.buffer, {
        folder: folder,
        resource_type: options.resource_type || 'image',
        public_id: options.public_id || null
      });
    } else if (file.path) {
      // Disk Storage path (Legacy/Fallback)
      result = await uploadToCloudinary(file.path, {
        folder: folder,
        resource_type: options.resource_type || 'image',
        public_id: options.public_id || null
      });

      // Delete temporary file
      if (fs.existsSync(file.path)) {
        fs.unlinkSync(file.path);
      }
    } else {
      throw new Error('Invalid file object: no buffer or path');
    }

    logger.info(`Cloudinary upload success: ${result.secure_url}`);

    return result;
  } catch (error) {
    logger.error('File upload error:', error);

    // Clean up temp file on error (if disk storage was used)
    if (file && file.path && fs.existsSync(file.path)) {
      try {
        fs.unlinkSync(file.path);
      } catch (cleanupError) {
        logger.error('Failed to cleanup temp file:', cleanupError);
      }
    }

    throw new Error(`Failed to upload file: ${error.message}`);
  }
};

/**
 * Upload multiple files to Cloudinary
 * @param {Array} files - Array of Multer file objects
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleFiles = async (files, options = {}) => {
  try {
    if (!files || files.length === 0) {
      throw new Error('No files provided');
    }

    const uploadPromises = files.map((file, index) => {
      const fileOptions = {
        ...options,
        public_id: options.public_id ? `${options.public_id}_${index}` : null
      };
      return uploadFile(file, fileOptions);
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    logger.error('Multiple file upload error:', error);
    // Clean up temp files on error
    if (files) {
      files.forEach(file => {
        if (file && file.path && fs.existsSync(file.path)) {
          try {
            fs.unlinkSync(file.path);
          } catch (err) {
            logger.error('Error cleaning up temp file:', err);
          }
        }
      });
    }
    throw error;
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resource_type - Resource type
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFile = async (publicId, resource_type = 'image') => {
  try {
    return await deleteFromCloudinary(publicId, resource_type);
  } catch (error) {
    logger.error('File deletion error:', error);
    throw error;
  }
};

// Multer middleware exports
export const uploadSingle = (fieldName) => upload.single(fieldName);
export const uploadMultiple = (fieldName, maxCount = 5) => upload.array(fieldName, maxCount);
export const uploadFields = (fields) => upload.fields(fields);

export default {
  uploadFile,
  uploadMultipleFiles,
  deleteFile,
  uploadSingle,
  uploadMultiple,
  uploadFields
};

