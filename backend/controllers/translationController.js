import {
  translateText,
  translateBatch,
  translateObject,
} from "../services/translationService.js";
import { sendSuccess, sendError } from "../utils/responseHandler.js";
import logger from "../utils/logger.js";

/**
 * Handle single text translation
 */
export const translate = async (req, res) => {
  try {
    const { text, targetLang, sourceLang } = req.body;

    if (!text || !targetLang) {
      return sendError(res, "Text and targetLang are required", 400);
    }

    const translation = await translateText(text, targetLang, sourceLang);

    return sendSuccess(res, "Translation successful", {
      original: text,
      translation,
      sourceLang,
      targetLang,
    });
  } catch (error) {
    logger.error("Translation controller error:", error);
    return sendError(res, "Translation failed", 500);
  }
};

/**
 * Handle batch translation
 */
export const batchTranslate = async (req, res) => {
  try {
    const { texts, targetLang, sourceLang } = req.body;

    if (!Array.isArray(texts) || !targetLang) {
      return sendError(res, "Texts array and targetLang are required", 400);
    }

    if (texts.length > 100) {
      return sendError(res, "Batch size exceeds limit (max 100)", 400);
    }

    const translations = await translateBatch(texts, targetLang, sourceLang);

    return sendSuccess(res, "Batch translation successful", {
      original: texts,
      translations,
      sourceLang,
      targetLang,
    });
  } catch (error) {
    logger.error("Batch translation controller error:", error);
    return sendError(res, "Batch translation failed", 500);
  }
};

/**
 * Handle object translation
 */
export const objectTranslate = async (req, res) => {
  try {
    const { obj, targetLang, sourceLang, keysToTranslate } = req.body;

    if (!obj || !targetLang || !Array.isArray(keysToTranslate)) {
      return sendError(
        res,
        "Object, targetLang, and keysToTranslate are required",
        400
      );
    }

    const translatedObj = await translateObject(
      obj,
      targetLang,
      sourceLang,
      keysToTranslate
    );

    return sendSuccess(res, "Object translation successful", {
      original: obj,
      translation: translatedObj,
      sourceLang,
      targetLang,
    });
  } catch (error) {
    logger.error("Object translation controller error:", error);
    return sendError(res, "Object translation failed", 500);
  }
};

export default {
  translate,
  batchTranslate,
  objectTranslate,
};
