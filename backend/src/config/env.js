require("dotenv").config();

const env = {
  port: Number(process.env.PORT) || 5000,

  clientUrl:
    process.env.CLIENT_URL ||
    "http://localhost:5173",

  sarvamApiKey:
    process.env.SARVAM_API_KEY,

  geminiApiKey:
    process.env.GEMINI_API_KEY,

  sarvamSttModel:
    process.env.SARVAM_STT_MODEL ||
    "saaras:v3",

  sarvamTtsModel:
    process.env.SARVAM_TTS_MODEL ||
    "bulbul:v3",

  sarvamTtsVoice:
    process.env.SARVAM_TTS_VOICE ||
    "aditya",

  geminiModel:
    process.env.GEMINI_MODEL ||
    "gemini-2.5-flash-lite",
};

if (!env.sarvamApiKey) {
  console.warn(
    "WARNING: SARVAM_API_KEY is missing"
  );
}

if (!env.geminiApiKey) {
  console.warn(
    "WARNING: GEMINI_API_KEY is missing"
  );
}

module.exports = env;