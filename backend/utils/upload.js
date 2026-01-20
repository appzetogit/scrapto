// Re-export the Cloudinary-backed upload service to keep a single upload implementation.
export {
  uploadSingle,
  uploadMultiple,
  uploadFields,
  uploadFile,
  uploadMultipleFiles,
  deleteFile
} from '../services/uploadService.js';

export { default as uploadService } from '../services/uploadService.js';


