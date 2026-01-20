import express from 'express';
import { translate, batchTranslate, objectTranslate } from '../controllers/translationController.js';

const router = express.Router();

/**
 * @route   POST /api/v1/translate
 * @desc    Translate single text
 * @access  Public
 */
router.post('/', translate);

/**
 * @route   POST /api/v1/translate/batch
 * @desc    Batch translate texts
 * @access  Public
 */
router.post('/batch', batchTranslate);

/**
 * @route   POST /api/v1/translate/object
 * @desc    Translate object properties
 * @access  Public
 */
router.post('/object', objectTranslate);

export default router;
