import { v2 as cloudinary } from 'cloudinary';
import logger from '../utils/logger.js';

/**
 * Configure Cloudinary
 */
export const configureCloudinary = () => {
  try {
    cloudinary.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
      secure: true
    });

    logger.info('Cloudinary configured successfully');
    return cloudinary;
  } catch (error) {
    logger.error('Failed to configure Cloudinary:', error);
    throw error;
  }
};

/**
 * Upload image to Cloudinary
 * @param {string|Buffer} filePathOrDataUri - File path, data URI, or buffer
 * @param {Object} options - Upload options
 * @returns {Promise<Object>} - Upload result
 */
export const uploadToCloudinary = async (filePathOrDataUri, options = {}) => {
  try {
    const {
      folder = 'scrapto',
      resource_type = 'image',
      public_id = null,
      transformation = []
    } = options;

    const uploadOptions = {
      folder: `scrapto/${folder}`,
      resource_type: resource_type,
      use_filename: true,
      unique_filename: true,
      overwrite: false
    };

    // Add transformations for images
    if (resource_type === 'image' && transformation.length > 0) {
      uploadOptions.transformation = transformation;
    } else if (resource_type === 'image') {
      // Default transformations
      uploadOptions.transformation = [
        { width: 1200, height: 1200, crop: 'limit' },
        { quality: 'auto' },
        { format: 'auto' }
      ];
    }

    if (public_id) {
      uploadOptions.public_id = public_id;
    }

    const result = await cloudinary.uploader.upload(filePathOrDataUri, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
      resource_type: result.resource_type
    };
  } catch (error) {
    logger.error('Cloudinary upload error:', error);
    throw new Error(`Failed to upload file to Cloudinary: ${error.message}`);
  }
};

/**
 * Upload multiple images to Cloudinary
 * @param {Array} files - Array of file paths or data URIs
 * @param {Object} options - Upload options
 * @returns {Promise<Array>} - Array of upload results
 */
export const uploadMultipleToCloudinary = async (files, options = {}) => {
  try {
    const uploadPromises = files.map((file, index) => {
      const fileOptions = {
        ...options,
        public_id: options.public_id ? `${options.public_id}_${index}` : null
      };
      return uploadToCloudinary(file, fileOptions);
    });

    const results = await Promise.all(uploadPromises);
    return results;
  } catch (error) {
    logger.error('Cloudinary multiple upload error:', error);
    throw new Error(`Failed to upload files to Cloudinary: ${error.message}`);
  }
};

/**
 * Delete file from Cloudinary
 * @param {string} publicId - Public ID of the file
 * @param {string} resource_type - Resource type (image, raw, video)
 * @returns {Promise<Object>} - Deletion result
 */
export const deleteFromCloudinary = async (publicId, resource_type = 'image') => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, {
      resource_type: resource_type
    });

    return {
      success: result.result === 'ok',
      message: result.result === 'ok' ? 'File deleted successfully' : 'File not found'
    };
  } catch (error) {
    logger.error('Cloudinary delete error:', error);
    throw new Error(`Failed to delete file from Cloudinary: ${error.message}`);
  }
};

/**
 * Get Cloudinary URL with transformations
 * @param {string} publicId - Public ID
 * @param {Array} transformations - Transformation options
 * @returns {string} - Transformed URL
 */
export const getCloudinaryUrl = (publicId, transformations = []) => {
  try {
    return cloudinary.url(publicId, {
      transformation: transformations,
      secure: true
    });
  } catch (error) {
    logger.error('Error generating Cloudinary URL:', error);
    throw error;
  }
};

export default cloudinary;

