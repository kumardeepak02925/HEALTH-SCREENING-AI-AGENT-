const env = require("../config/env");
const { AppError } = require("../utils/error");

async function transcribeAudio(
  audioBuffer,
  mimeType = "audio/webm"
) {
  const normalizedMimeType =
    (mimeType || "audio/webm")
      .split(";")[0]
      .trim();

  if (
    !audioBuffer ||
    audioBuffer.length === 0
  ) {
    throw new AppError(
      "No audio received",
      400,
      "NO_AUDIO"
    );
  }

  if (!env.sarvamApiKey) {
    throw new AppError(
      "Sarvam API key is not configured",
      500,
      "MISSING_SARVAM_KEY"
    );
  }

  const formData = new FormData();

  const extension =
    normalizedMimeType.includes("webm")
      ? "webm"
      : normalizedMimeType.includes("wav")
      ? "wav"
      : normalizedMimeType.includes("mp3")
      ? "mp3"
      : "webm";

  const blob = new Blob(
    [audioBuffer],
    {
      type: normalizedMimeType,
    }
  );

  formData.append(
    "file",
    blob,
    `recording.${extension}`
  );

  formData.append(
    "model",
    env.sarvamSttModel
  );

  formData.append(
    "language_code",
    "unknown"
  );

  formData.append(
    "mode",
    "transcribe"
  );

  const response = await fetch(
    "https://api.sarvam.ai/speech-to-text",
    {
      method: "POST",

      headers: {
        "api-subscription-key":
          env.sarvamApiKey,
      },

      body: formData,
    }
  );

  if (!response.ok) {
    const errorText =
      await response.text();

    throw new AppError(
      `Sarvam STT failed: ${errorText}`,
      502,
      "STT_API_ERROR"
    );
  }

  const result =
    await response.json();

  const text =
    (
      result.transcript ||
      result.text ||
      ""
    ).trim();

  if (!text) {
    return {
      text: "",
      language:
        result.language_code || null,
    };
  }

  return {
    text,

    language:
      result.language_code || null,
  };
}

module.exports = {
  transcribeAudio,
};