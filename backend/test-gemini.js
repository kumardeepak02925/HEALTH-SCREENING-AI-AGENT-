require("dotenv").config();

const { GoogleGenAI } = require("@google/genai");

async function testGemini() {
  console.log("========== GEMINI TEST ==========");

  console.log(
    "API key loaded:",
    Boolean(process.env.GEMINI_API_KEY)
  );

  console.log(
    "Model:",
    process.env.GEMINI_MODEL
  );

  if (!process.env.GEMINI_API_KEY) {
    console.log("❌ GEMINI_API_KEY is missing");
    return;
  }

  try {
    const ai = new GoogleGenAI({
      apiKey: process.env.GEMINI_API_KEY,
    });

    console.log("⏳ Calling Gemini...");

    const response = await ai.models.generateContent({
      model:
        process.env.GEMINI_MODEL ||
        "gemini-2.5-flash-lite",

      contents:
        "Reply with exactly: Gemini API is working",
    });

    console.log("\n✅ Gemini response:");
    console.log(response.text);

    console.log("\n🎉 GEMINI API IS WORKING");
  } catch (error) {
    console.log("\n❌ GEMINI FAILED");

    console.log("Message:", error.message);
    console.log("Status:", error.status);
    console.log("Code:", error.code);

    console.log("\nFull error:");
    console.dir(error, { depth: 5 });
  }
}

testGemini();