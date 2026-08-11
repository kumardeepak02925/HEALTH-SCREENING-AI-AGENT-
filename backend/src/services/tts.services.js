const env = require("../config/env");

const {
  AppError,
} = require("../utils/error");

async function generateSpeech(
  text,
  language = "en"
) {
  if (!text) {
    throw new AppError(
      "Text is required",
      400,
      "EMPTY_TEXT"
    );
  }

  if (!env.sarvamApiKey) {
    throw new AppError(
      "Sarvam API key is missing",
      500,
      "MISSING_SARVAM_KEY"
    );
  }

  const response =
    await fetch(
      "https://api.sarvam.ai/text-to-speech",
      {
        method: "POST",

        headers: {
          "Content-Type":
            "application/json",

          "api-subscription-key":
            env.sarvamApiKey,
        },

        body: JSON.stringify({
          inputs: [text],

          target_language_code:
            language === "hi"
              ? "hi-IN"
              : "en-IN",

          speaker:
            env.sarvamTtsVoice,

          model:
            env.sarvamTtsModel,

          enable_preprocessing:
            true,

          pace: 1.0,

          speech_sample_rate: 22050,

          output_audio_codec:
            "mp3",
        }),
      }
    );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new AppError(
      `Sarvam TTS failed: ${errorText}`,
      502,
      "TTS_API_ERROR"
    );
  }

  const result =
    await response.json();

  const audioBase64 =
    result.audios?.[0];

  if (!audioBase64) {
    throw new AppError(
      "No audio returned by Sarvam",
      502,
      "EMPTY_TTS_RESPONSE"
    );
  }

  return Buffer.from(
    audioBase64,
    "base64"
  );
}

module.exports = {
  generateSpeech,
};