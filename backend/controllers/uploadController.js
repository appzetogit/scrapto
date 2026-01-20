import { uploadFile, uploadMultipleFiles } from '../services/uploadService.js';
import { sendSuccess, sendError } from '../utils/responseHandler.js';
import logger from '../utils/logger.js';

// Upload multiple order images
export const uploadOrderImages = async (req, res) => {
  try {
    const files = req.files || [];
    if (!files.length) {
      return sendError(res, 'No files provided', 400);
    }

    const results = await uploadMultipleFiles(files, { folder: 'orders' });
    return sendSuccess(res, 'Images uploaded successfully', { files: results }, 201);
  } catch (error) {
    logger.error('Order image upload error:', error);
    return sendError(res, 'Failed to upload images', 500);
  }
};

// Upload KYC documents (single or multiple fields)
export const uploadKycDocs = async (req, res) => {
  try {
    const fileList = [];
    if (req.files) {
      Object.values(req.files).forEach((arr) => fileList.push(...arr));
    }
    if (!fileList.length) {
      return sendError(res, 'No files provided', 400);
    }

    const results = await uploadMultipleFiles(fileList, { folder: 'kyc' });
    return sendSuccess(res, 'KYC documents uploaded successfully', { files: results }, 201);
  } catch (error) {
    logger.error('KYC upload error:', error);
    return sendError(res, 'Failed to upload documents', 500);
  }
};


