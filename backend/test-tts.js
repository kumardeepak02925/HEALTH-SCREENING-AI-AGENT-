require("dotenv").config();

async function testTTS() {
  console.log("Testing Sarvam TTS...");

  console.log(
    "API key exists:",
    Boolean(process.env.SARVAM_API_KEY)
  );

  const response = await fetch(
    "https://api.sarvam.ai/text-to-speech",
    {
      method: "POST",

      headers: {
        "Content-Type": "application/json",

        "api-subscription-key":
          process.env.SARVAM_API_KEY,
      },

      body: JSON.stringify({
        inputs: [
          "Hello, this is a test of the AI health assistant."
        ],

        target_language_code: "en-IN",

        speaker:
          process.env.SARVAM_TTS_VOICE ||
          "anushka",

        model:
          process.env.SARVAM_TTS_MODEL ||
          "bulbul:v3",

        enable_preprocessing: true,

        pace: 1.0,

        speech_sample_rate: 22050,

        output_audio_codec: "mp3",
      }),
    }
  );

  console.log(
    "HTTP status:",
    response.status
  );

  const text =
    await response.text();

  console.log(
    "Response:"
  );

  console.log(text);
}

testTTS().catch((error) => {
  console.error(
    "TTS TEST ERROR:"
  );

  console.error(error);
});