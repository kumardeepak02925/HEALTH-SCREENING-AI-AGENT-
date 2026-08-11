
const { Server } = require("socket.io");

const env = require("../config/env");

const {
  createSession,
  getSession,
  addMessage,
  updateCollectedData,
  markQuestionAsked,
  setLanguage,
  endSession,
} = require("../services/conversation.services");

const {
  generateGreeting,
  generateConversationResponse,
  generateHealthReport,
} = require("../services/llm.services");

const {
  transcribeAudio,
} = require("../services/stt.services");

const {
  generateSpeech,
} = require("../services/tts.services");

const {
  info,
  error,
} = require("../utils/logger");


// ============================================================
// SOCKET INITIALIZATION
// ============================================================

function initializeSocket(server) {
  const allowedOrigins = [
    env.clientUrl,
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
  ].filter(Boolean);

  const io = new Server(server, {
    cors: {
      origin: (origin, callback) => {
        if (!origin || allowedOrigins.includes(origin)) {
          callback(null, true);
          return;
        }

        callback(
          new Error(
            `Socket CORS blocked: ${origin}`
          )
        );
      },

      methods: ["GET", "POST"],

      credentials: true,
    },

    // Maximum socket payload: 10 MB
    maxHttpBufferSize: 10 * 1024 * 1024,
  });


  // ==========================================================
  // CONNECTION
  // ==========================================================

  io.on("connection", (socket) => {
    info(
      `Socket connected: ${socket.id}`
    );

    let currentSessionId = null;


    // ========================================================
    // START CALL
    // ========================================================

    socket.on(
      "start-call",
      async () => {
        try {

          const session =
            createSession();

          currentSessionId =
            session.sessionId;

          socket.join(
            session.sessionId
          );


          // --------------------------------------------------
          // Notify frontend
          // --------------------------------------------------

          socket.emit(
            "call-started",
            {
              sessionId:
                session.sessionId,

              status: "active",
            }
          );


          // --------------------------------------------------
          // Generate greeting
          // --------------------------------------------------

          const greeting =
            await generateGreeting();


          // --------------------------------------------------
          // Save greeting
          // --------------------------------------------------

          addMessage(
            session.sessionId,
            "assistant",
            greeting.reply
          );


          markQuestionAsked(
            session.sessionId,
            "name"
          );


          // --------------------------------------------------
          // Send greeting text
          // --------------------------------------------------

          socket.emit(
            "ai-text",
            {
              text:
                greeting.reply,

              language:
                greeting.language,

              nextQuestion:
                greeting.nextQuestion,
            }
          );


          // ==================================================
          // GREETING TTS
          // ==================================================

          try {

            const audio =
              await generateSpeech(
                greeting.reply,
                greeting.language
              );


            if (
              !audio ||
              audio.length === 0
            ) {
              throw new Error(
                "TTS returned empty audio"
              );
            }


            socket.emit(
              "ai-audio",
              {
                audio:
                  audio.toString(
                    "base64"
                  ),

                mimeType:
                  "audio/mpeg",
              }
            );


            info(
              `Greeting TTS successful. Audio bytes: ${audio.length}`
            );

          } catch (ttsError) {

            error(
              "Greeting TTS failed:",
              ttsError
            );


            // TTS failure must NOT
            // terminate the call.

            socket.emit(
              "warning",
              {
                code:
                  "TTS_FAILED",

                message:
                  "Voice playback failed, but the conversation can continue using text.",

                details:
                  process.env.NODE_ENV ===
                  "development"
                    ? ttsError.message
                    : undefined,
              }
            );
          }

        } catch (err) {

          error(
            "Start call error:",
            err
          );


          socket.emit(
            "call-error",
            {
              code:
                err.code ||
                "START_CALL_ERROR",

              message:
                err.message ||
                "Unable to start the call.",
            }
          );
        }
      }
    );


    // ========================================================
    // RECEIVE AUDIO
    // ========================================================

    socket.on(
      "audio",
      async (payload) => {

        // ----------------------------------------------------
        // Check active session
        // ----------------------------------------------------

        if (!currentSessionId) {

          socket.emit(
            "call-error",
            {
              code:
                "NO_ACTIVE_CALL",

              message:
                "No active call.",
            }
          );

          return;
        }


        const session =
          getSession(
            currentSessionId
          );


        if (
          !session ||
          session.status !== "active"
        ) {

          socket.emit(
            "call-error",
            {
              code:
                "CALL_NOT_ACTIVE",

              message:
                "The call is no longer active.",
            }
          );

          return;
        }


        try {

          // ==================================================
          // PROCESSING START
          // ==================================================

          socket.emit(
            "processing",
            {
              status: true,
            }
          );


          // ==================================================
          // EXTRACT AUDIO
          // ==================================================

          let audioBuffer;

          let mimeType =
            "audio/webm";


          // --------------------------------------------------
          // Buffer payload
          // --------------------------------------------------

          if (
            Buffer.isBuffer(
              payload
            )
          ) {

            audioBuffer =
              payload;

          }

          // --------------------------------------------------
          // Object payload
          // --------------------------------------------------

          else if (
            payload &&
            payload.audio
          ) {

            try {

              audioBuffer =
                Buffer.from(
                  payload.audio,
                  "base64"
                );

            } catch (decodeError) {

              error(
                "Audio base64 decode failed:",
                decodeError
              );


              socket.emit(
                "processing",
                {
                  status: false,
                }
              );


              socket.emit(
                "warning",
                {
                  code:
                    "INVALID_AUDIO",

                  message:
                    "The audio could not be read. Please record your answer again.",
                }
              );


              return;
            }


            mimeType =
              payload.mimeType ||
              "audio/webm";

          }

          // --------------------------------------------------
          // Invalid payload
          // --------------------------------------------------

          else {

            socket.emit(
              "processing",
              {
                status: false,
              }
            );


            socket.emit(
              "warning",
              {
                code:
                  "INVALID_AUDIO",

                message:
                  "No valid audio was received. Please try again.",
              }
            );


            return;
          }


          // ==================================================
          // EMPTY AUDIO
          // ==================================================

          if (
            !audioBuffer ||
            audioBuffer.length === 0
          ) {

            info(
              "Received empty audio payload."
            );


            socket.emit(
              "processing",
              {
                status: false,
              }
            );


            socket.emit(
              "no-speech",
              {
                message:
                  "I couldn't hear anything. Please speak and try again.",
              }
            );


            return;
          }


          info(
            `Audio received: ${audioBuffer.length} bytes, ${mimeType}`
          );


          // ==================================================
          // NORMALIZE MIME TYPE
          // ==================================================

          const normalizedMimeType =
            (
              mimeType ||
              "audio/webm"
            )
              .split(";")[0]
              .trim()
              .toLowerCase();


          // ==================================================
          // 1. SPEECH TO TEXT
          // ==================================================

          let transcription;


          try {

            transcription =
              await transcribeAudio(
                audioBuffer,
                normalizedMimeType
              );

          } catch (sttError) {

            error(
              "STT failed:",
              sttError
            );


            socket.emit(
              "processing",
              {
                status: false,
              }
            );


            // ----------------------------------------------
            // IMPORTANT:
            // Do NOT end the call.
            // ----------------------------------------------

            socket.emit(
              "warning",
              {
                code:
                  "STT_FAILED",

                message:
                  "I couldn't understand your voice. Please speak clearly and try again.",

                details:
                  process.env.NODE_ENV ===
                  "development"
                    ? sttError.message
                    : undefined,
              }
            );


            return;
          }


          // ==================================================
          // TRANSCRIPT
          // ==================================================

          const userText =
            (
              transcription?.text ||
              ""
            ).trim();


          // ==================================================
          // NO SPEECH
          // ==================================================

          if (!userText) {

            socket.emit(
              "processing",
              {
                status: false,
              }
            );


            socket.emit(
              "no-speech",
              {
                message:
                  "I didn't catch that. Please try speaking again.",
              }
            );


            return;
          }


          info(
            `User said: ${userText}`
          );


          // ==================================================
          // 2. SAVE USER MESSAGE
          // ==================================================

          addMessage(
            currentSessionId,
            "user",
            userText
          );


          socket.emit(
            "user-transcript",
            {
              text:
                userText,
            }
          );


          // ==================================================
          // 3. GEMINI / LLM
          // ==================================================

          let aiResponse;


          try {

            aiResponse =
              await generateConversationResponse(
                session,
                userText
              );

          } catch (llmError) {

            error(
              "Gemini/LLM failed:",
              llmError
            );


            socket.emit(
              "processing",
              {
                status: false,
              }
            );


            // ----------------------------------------------
            // Do NOT kill the session.
            // ----------------------------------------------

            socket.emit(
              "warning",
              {
                code:
                  "LLM_FAILED",

                message:
                  "I'm having trouble processing your response. Please try again.",

                details:
                  process.env.NODE_ENV ===
                  "development"
                    ? llmError.message
                    : undefined,
              }
            );


            return;
          }


          // ==================================================
          // VALIDATE LLM RESPONSE
          // ==================================================

          if (
            !aiResponse ||
            !aiResponse.reply
          ) {

            error(
              "Invalid LLM response:",
              aiResponse
            );


            socket.emit(
              "processing",
              {
                status: false,
              }
            );


            socket.emit(
              "warning",
              {
                code:
                  "INVALID_LLM_RESPONSE",

                message:
                  "I couldn't generate the next question. Please try again.",
              }
            );


            return;
          }


          // ==================================================
          // 4. UPDATE CONVERSATION STATE
          // ==================================================

          updateCollectedData(
            currentSessionId,
            aiResponse.data
          );


          if (
            aiResponse.language
          ) {

            setLanguage(
              currentSessionId,
              aiResponse.language
            );
          }


          if (
            aiResponse.nextQuestion
          ) {

            markQuestionAsked(
              currentSessionId,
              aiResponse.nextQuestion
            );
          }


          // ==================================================
          // SAVE AI MESSAGE
          // ==================================================

          addMessage(
            currentSessionId,
            "assistant",
            aiResponse.reply
          );


          // ==================================================
          // 5. SEND AI TEXT
          // ==================================================

          socket.emit(
            "ai-text",
            {
              text:
                aiResponse.reply,

              language:
                aiResponse.language,

              nextQuestion:
                aiResponse.nextQuestion,

              conversationComplete:
                Boolean(
                  aiResponse.conversationComplete
                ),
            }
          );


          // ==================================================
          // 6. TTS
          // ==================================================

          try {

            const audio =
              await generateSpeech(
                aiResponse.reply,
                aiResponse.language
              );


            if (
              !audio ||
              audio.length === 0
            ) {

              throw new Error(
                "TTS returned empty audio"
              );
            }


            socket.emit(
              "ai-audio",
              {
                audio:
                  audio.toString(
                    "base64"
                  ),

                mimeType:
                  "audio/mpeg",
              }
            );


            info(
              `AI TTS successful. Audio bytes: ${audio.length}`
            );

          } catch (ttsError) {

            error(
              "TTS failed:",
              ttsError
            );


            // ----------------------------------------------
            // TTS is optional.
            // Text conversation continues.
            // ----------------------------------------------

            socket.emit(
              "warning",
              {
                code:
                  "TTS_FAILED",

                message:
                  "Voice generation failed, but you can continue with the text conversation.",

                details:
                  process.env.NODE_ENV ===
                  "development"
                    ? ttsError.message
                    : undefined,
              }
            );
          }


          // ==================================================
          // PROCESSING COMPLETE
          // ==================================================

          socket.emit(
            "processing",
            {
              status: false,
            }
          );

        } catch (err) {

          error(
            "Audio processing error:",
            err
          );


          socket.emit(
            "processing",
            {
              status: false,
            }
          );


          // --------------------------------------------------
          // Generic recoverable error
          // --------------------------------------------------

          socket.emit(
            "warning",
            {
              code:
                err.code ||
                "AUDIO_PROCESSING_ERROR",

              message:
                "Something went wrong while processing your response. Please try again.",

              details:
                process.env.NODE_ENV ===
                "development"
                  ? err.message
                  : undefined,
            }
          );
        }
      }
    );


    // ========================================================
    // END CALL
    // ========================================================

    socket.on(
      "end-call",
      async () => {

        if (!currentSessionId) {
          return;
        }


        try {

          const session =
            endSession(
              currentSessionId
            );


          if (!session) {

            socket.emit(
              "call-error",
              {
                code:
                  "SESSION_NOT_FOUND",

                message:
                  "The call session could not be found.",
              }
            );

            return;
          }


          socket.emit(
            "call-ending",
            {
              sessionId:
                currentSessionId,
            }
          );


          let report;


          // ==================================================
          // GENERATE HEALTH REPORT
          // ==================================================

          try {

            report =
              await generateHealthReport(
                session
              );

          } catch (reportError) {

            error(
              "Report generation failed:",
              reportError
            );


            report =
              createFallbackReport(
                session
              );
          }


          // ==================================================
          // SEND REPORT
          // ==================================================

          socket.emit(
            "report-ready",
            {
              sessionId:
                currentSessionId,

              report,
            }
          );


          // ==================================================
          // CALL ENDED
          // ==================================================

          socket.emit(
            "call-ended",
            {
              sessionId:
                currentSessionId,

              status:
                "ended",
            }
          );


          info(
            `Call ended: ${currentSessionId}`
          );


          // Clear local session reference

          currentSessionId =
            null;

        } catch (err) {

          error(
            "End call error:",
            err
          );


          socket.emit(
            "call-error",
            {
              code:
                "END_CALL_ERROR",

              message:
                "Unable to end the call correctly.",
            }
          );
        }
      }
    );


    // ========================================================
    // DISCONNECT
    // ========================================================

    socket.on(
      "disconnect",
      (reason) => {

        info(
          `Socket disconnected: ${socket.id} - ${reason}`
        );

      }
    );
  });


  return io;
}


// ============================================================
// FALLBACK HEALTH REPORT
// ============================================================

function createFallbackReport(
  session
) {

  const data =
    session.collectedData ||
    {};


  // ----------------------------------------------------------
  // Information collected
  // ----------------------------------------------------------

  const informationCollected =
    Object.entries(data)
      .filter(
        ([key, value]) => {

          if (
            Array.isArray(value)
          ) {

            return (
              value.length > 0
            );
          }

          return Boolean(value);
        }
      )
      .map(
        ([key]) => key
      );


  // ----------------------------------------------------------
  // Determine report status
  // ----------------------------------------------------------

  const requiredFields = [
    "name",
    "mainConcern",
    "duration",
    "severity",
  ];


  const completedRequiredFields =
    requiredFields.filter(
      (field) =>
        Boolean(data[field])
    ).length;


  const status =
    completedRequiredFields >= 4
      ? "complete"
      : "incomplete";


  // ----------------------------------------------------------
  // Build summary
  // ----------------------------------------------------------

  let summary =
    "The call ended before a complete automated report could be generated.";


  if (
    data.name &&
    data.mainConcern
  ) {

    summary =
      `${data.name} reported ${data.mainConcern}`;


    if (data.duration) {

      summary +=
        ` for ${data.duration}`;
    }


    if (data.severity) {

      summary +=
        ` with a reported severity of ${data.severity}`;
    }


    summary += ".";
  }


  // ----------------------------------------------------------
  // Follow-up
  // ----------------------------------------------------------

  const followUp = [
    "This screening summary is not a medical diagnosis.",
    "Consider consulting a healthcare professional if symptoms persist or worsen.",
    "Seek urgent professional medical help if severe or concerning symptoms develop.",
  ];


  // ----------------------------------------------------------
  // Return fallback report
  // ----------------------------------------------------------

  return {

    status,

    patientName:
      data.name ||
      "Not collected",

    mainConcern:
      data.mainConcern ||
      "Not collected",

    keySymptoms:
      data.mainConcern
        ? [data.mainConcern]
        : [],

    duration:
      data.duration ||
      "Not collected",

    severity:
      data.severity ||
      "Not collected",

    relatedSymptoms:
      Array.isArray(
        data.relatedSymptoms
      )
        ? data.relatedSymptoms
        : [],

    followUp,

    summary,

    informationCollected,

    limitations:
      status === "complete"
        ? "This report was generated using information collected during the screening conversation."
        : "Some information may not have been collected because the call ended early or the report service was unavailable.",
  };
}


// ============================================================
// EXPORT
// ============================================================

module.exports =
  initializeSocket;

