import express from 'express';
import { translateText } from '../controllers/translateController.js';

const router = express.Router();

// POST /api/translate
router.post('/', translateText);

// POST /api/translate/batch - handled by same controller logic
router.post('/batch', translateText);

// POST /api/translate/object - handle object translation
router.post('/object', translateText);

export default router;
