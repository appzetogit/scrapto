import dotenv from "dotenv";

dotenv.config();

export const googleCloudConfig = {
  apiKey: process.env.GOOGLE_CLOUD_TRANSLATE_API_KEY,
};

// Language code normalization map
export const languageCodeMap = {
  en: "en",
  hi: "hi",
  bn: "bn",
  mr: "mr",
  te: "te",
  ta: "ta",
  gu: "gu",
  ur: "ur",
  kn: "kn",
  or: "or",
  ml: "ml",
  pa: "pa",
  as: "as",
};

export default {
  googleCloudConfig,
  languageCodeMap,
};
