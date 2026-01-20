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
    const uploadDir = path.join(__dirname, '../uploads/temp');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
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
      logger.warn('Cloudinary credentials missing, using local storage fallback');
      const filename = path.basename(filePath);
      return {
        secure_url: `/uploads/temp/${filename}`, // Frontend needs to handle relative path or proxy
        public_id: `local_${filename}`,
        format: path.extname(filename).substring(1),
        resource_type: 'image'
      };
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(filePath, {
      folder: folder,
      resource_type: options.resource_type || 'image',
      public_id: options.public_id || null
    });

    // Delete temporary file only if Cloudinary upload succeeded
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    return result;
  } catch (error) {
    logger.error('File upload error:', error);

    // Fallback to local storage if Cloudinary fails
    if (file && file.path && fs.existsSync(file.path)) {
      logger.warn('Falling back to local storage due to upload error');
      const filename = path.basename(file.path);
      return {
        secure_url: `/uploads/temp/${filename}`,
        public_id: `local_${filename}`,
        format: path.extname(filename).substring(1),
        resource_type: 'image'
      };
    }

    throw error;
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

