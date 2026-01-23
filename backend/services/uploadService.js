import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { uploadToCloudinary, deleteFromCloudinary } from '../config/cloudinary.js';
import { MAX_FILE_SIZE, FILE_TYPES } from '../config/constants.js';
import logger from '../utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Temporary storage for files before Cloudinary upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    console.log('Multer processing file:', file.fieldname);
    // Use process.cwd() to ensure we point to backend root
    const uploadDir = path.join(process.cwd(), 'uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      try {
        fs.mkdirSync(uploadDir, { recursive: true });
      } catch (err) {
        console.error('Failed to create upload directory:', err);
      }
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    // Sanitize filename
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    console.log('Multer saving as:', safeName);
    cb(null, file.fieldname + '-' + uniqueSuffix + '-' + safeName);
  }
});

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

    const filePath = file.path;
    const folder = options.folder || 'general';

    // Check for Cloudinary credentials
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      throw new Error('Cloudinary credentials are not properly configured on the server');
    }

    // Upload to Cloudinary
    logger.info(`Starting Cloudinary upload for ${file.originalname} to folder ${folder}`);
    const result = await uploadToCloudinary(filePath, {
      folder: folder,
      resource_type: options.resource_type || 'image',
      public_id: options.public_id || null
    });

    logger.info(`Cloudinary upload success: ${result.secure_url}`);

    // Delete temporary file only if Cloudinary upload succeeded
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  } catch (error) {
    logger.error('File upload error:', error);

    // Clean up temp file on error
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

