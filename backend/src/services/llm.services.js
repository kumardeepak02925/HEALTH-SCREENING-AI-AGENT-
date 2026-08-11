const {
  GoogleGenAI,
} = require("@google/genai");

const env = require("../config/env");

const {
  AppError,
} = require("../utils/error");

const ai = new GoogleGenAI({
  apiKey: env.geminiApiKey,
});

const SYSTEM_PROMPT = `
You are an AI health screening assistant.

Your job is to conduct a basic health intake conversation.

IMPORTANT SAFETY RULES:

- You are NOT a doctor.
- Do NOT diagnose diseases.
- Do NOT prescribe medicines.
- Do NOT provide definitive medical conclusions.
- Collect information only.
- If the user describes a possible emergency, recommend seeking urgent professional medical help.
- Ask ONE question at a time.
- Never repeat a question whose information has already been collected.
- If the answer is vague, ask a useful clarification.
- Keep responses short and natural because the response will be converted to speech.

Collect the following:

1. Name
2. Main concern/symptom
3. Duration
4. Severity
5. Related symptoms

The conversation should feel adaptive rather than like a fixed questionnaire.

Return ONLY valid JSON:

{
  "reply": "string",
  "language": "en",
  "nextQuestion": "name | mainConcern | duration | severity | relatedSymptoms | complete",
  "data": {
    "name": null,
    "mainConcern": null,
    "duration": null,
    "severity": null,
    "relatedSymptoms": []
  },
  "conversationComplete": false,
  "followUpRequired": false
}
`;

function buildPrompt(
  session,
  userText
) {
  return `
${SYSTEM_PROMPT}

CURRENT SESSION:

${JSON.stringify(
  {
    collectedData:
      session.collectedData,

    askedQuestions:
      session.askedQuestions,

    currentQuestion:
      session.currentQuestion,

    language:
      session.language,
  },
  null,
  2
)}

CONVERSATION:

${session.conversation
  .map(
    (message) =>
      `${message.role.toUpperCase()}: ${message.text}`
  )
  .join("\n")}

NEW USER MESSAGE:

${userText}

Determine the next appropriate question.

Remember:
- Do not repeat answered questions.
- Ask only one question.
- Clarify vague answers.
- Update the collected data.
- If enough information has been collected, mark conversationComplete as true.
`;
}

async function generateConversationResponse(
  session,
  userText
) {
  if (!env.geminiApiKey) {
    throw new AppError(
      "Gemini API key is not configured",
      500,
      "MISSING_GEMINI_KEY"
    );
  }

  const prompt =
    buildPrompt(
      session,
      userText
    );

  try {
    const response =
      await ai.models.generateContent(
        {
          model:
            env.geminiModel,

          contents: prompt,

          config: {
            temperature: 0.2,

            responseMimeType:
              "application/json",

            maxOutputTokens: 600,
          },
        }
      );

    const text =
      response.text;

    const rawText =
      typeof text === "string"
        ? text.trim()
        : "";

    if (!rawText) {
      throw new Error(
        "Empty Gemini response"
      );
    }

    try {
      return normalizeResponse(
        JSON.parse(rawText)
      );
    } catch (parseError) {
      console.error(
        "Gemini parse failed:",
        parseError.message
      );
      console.error(
        "Gemini raw response:",
        rawText
      );

      const jsonMatch = rawText.match(
        /\{[\s\S]*\}/
      );

      if (jsonMatch) {
        return normalizeResponse(
          JSON.parse(jsonMatch[0])
        );
      }

      throw parseError;
    }
  } catch (error) {
    console.error(
      "Gemini error:",
      error
    );

    throw new AppError(
      "Unable to process the conversation",
      502,
      "LLM_API_ERROR"
    );
  }
}

function normalizeResponse(
  data
) {
  return {
    reply:
      typeof data.reply ===
      "string"
        ? data.reply.trim()
        : "Could you please tell me a little more?",

    language:
      data.language === "hi"
        ? "hi"
        : "en",

    nextQuestion:
      data.nextQuestion ||
      "mainConcern",

    data: {
      name:
        data.data?.name ??
        null,

      mainConcern:
        data.data?.mainConcern ??
        null,

      duration:
        data.data?.duration ??
        null,

      severity:
        data.data?.severity ??
        null,

      relatedSymptoms:
        Array.isArray(
          data.data
            ?.relatedSymptoms
        )
          ? data.data
              .relatedSymptoms
          : [],
    },

    conversationComplete:
      Boolean(
        data.conversationComplete
      ),

    followUpRequired:
      Boolean(
        data.followUpRequired
      ),
  };
}

async function generateGreeting() {
  return {
    reply:
      "Hello! I'm your AI health screening assistant. I'll ask you a few basic questions about how you're feeling. To begin, may I know your name?",

    language: "en",

    nextQuestion: "name",

    data: {
      name: null,
      mainConcern: null,
      duration: null,
      severity: null,
      relatedSymptoms: [],
    },

    conversationComplete: false,

    followUpRequired: false,
  };
}

async function generateHealthReport(
  session
) {
  const prompt = `
You are generating a structured report from
a basic health screening conversation.

Do NOT diagnose.
Do NOT prescribe medication.

Only summarize information that was actually
provided by the user.

If information is missing, write:
"Not collected".

If the call was short or incomplete,
mark status as "incomplete".

SESSION DATA:

${JSON.stringify(
  session.collectedData,
  null,
  2
)}

CONVERSATION:

${session.conversation
  .map(
    (message) =>
      `${message.role.toUpperCase()}: ${message.text}`
  )
  .join("\n")}

Return ONLY JSON:

{
  "status": "complete | incomplete",
  "patientName": "string",
  "mainConcern": "string",
  "keySymptoms": [],
  "duration": "string",
  "severity": "string",
  "relatedSymptoms": [],
  "followUp": [],
  "summary": "string",
  "informationCollected": [],
  "limitations": "string"
}
`;

  try {
    const response =
      await ai.models.generateContent(
        {
          model:
            env.geminiModel,

          contents: prompt,

          config: {
            temperature: 0.1,

            responseMimeType:
              "application/json",

            maxOutputTokens: 1000,
          },
        }
      );

    return JSON.parse(
      response.text
    );
  } catch (error) {
    console.error(
      "Report generation error:",
      error
    );

    throw new AppError(
      "Unable to generate health report",
      502,
      "REPORT_ERROR"
    );
  }
}

module.exports = {
  generateGreeting,
  generateConversationResponse,
  generateHealthReport,
};