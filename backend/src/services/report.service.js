const env = require("../config/env");
const { AppError } = require("../utils/error");

async function generateHealthReport(session) {
  const transcript = session.conversation
    .map(
      (message) =>
        `${message.role.toUpperCase()}: ${message.text}`
    )
    .join("\n");

  const prompt = `
You are generating a structured report from a basic health screening call.

IMPORTANT:
- Do not diagnose.
- Do not prescribe treatment.
- Only summarize information actually mentioned.
- If information was not collected, use "Not collected".
- If the call was very short, clearly mark the report as incomplete.
- Identify information that may warrant professional follow-up, but do not make a diagnosis.

SESSION DATA:
${JSON.stringify(
    session.collectedData,
    null,
    2
  )}

TRANSCRIPT:
${transcript}

Return ONLY valid JSON:

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

  const response = await fetch(
    "https://api.openai.com/v1/chat/completions",
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${env.openaiApiKey}`,
      },
      body: JSON.stringify({
        model: env.llmModel,
        temperature: 0.1,
        response_format: {
          type: "json_object",
        },
        messages: [
          {
            role: "system",
            content:
              "You generate safe structured health screening summaries.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
      }),
    }
  );

  if (!response.ok) {
    const errorText = await response.text();

    throw new AppError(
      `Report API failed: ${errorText}`,
      502,
      "REPORT_API_ERROR"
    );
  }

  const result = await response.json();
  const content =
    result.choices?.[0]?.message?.content;

  if (!content) {
    throw new AppError(
      "Report generation returned no content",
      502,
      "EMPTY_REPORT"
    );
  }

  try {
    return JSON.parse(content);
  } catch {
    throw new AppError(
      "Report returned invalid JSON",
      502,
      "INVALID_REPORT_JSON"
    );
  }
}

module.exports = {
  generateHealthReport,
};