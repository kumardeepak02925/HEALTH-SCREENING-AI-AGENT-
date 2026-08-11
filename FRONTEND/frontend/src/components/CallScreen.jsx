
import { useEffect, useRef } from "react";
import { useVoiceCall } from "../hooks/useVoiceCall";

export default function CallScreen() {
  const {
    connected,
    calling,
    processing,
    messages,
    error,
    report,
    startCall,
    sendVoiceMessage,
    endCall,
  } = useVoiceCall();

  const conversationRef = useRef(null);

  // Auto-scroll conversation
  useEffect(() => {
    if (conversationRef.current) {
      conversationRef.current.scrollTop =
        conversationRef.current.scrollHeight;
    }
  }, [messages, processing]);

  // ==========================================
  // REPORT SCREEN
  // ==========================================

  if (report) {
    return (
      <div className="app">

        <div className="card report">

          {/* Header */}

          <div className="header">

            <div>
              <div
                style={{
                  display: "inline-block",
                  marginBottom: "8px",
                  padding: "5px 10px",
                  borderRadius: "999px",
                  background: "#dcfce7",
                  color: "#166534",
                  fontSize: "11px",
                  fontWeight: "700",
                }}
              >
                ✓ SCREENING COMPLETED
              </div>

              <h1>
                🩺 Health Screening Report
              </h1>

              <p>
                AI-assisted health screening summary
              </p>
            </div>

            <span className="status online">
              Completed
            </span>

          </div>


          {/* Disclaimer */}

          <div className="disclaimer">

            <strong>
              ⚠ Important
            </strong>

            <p
              style={{
                marginBottom: 0,
                marginTop: "6px",
              }}
            >
              This is a screening summary, not a
              medical diagnosis. Please consult a
              qualified healthcare professional
              for medical advice.
            </p>

          </div>


          {/* Patient Information */}

          <div className="report-grid">

            <div>
              <strong>
                👤 Patient
              </strong>

              <p>
                {report.patientName ||
                  "Not collected"}
              </p>
            </div>


            <div>
              <strong>
                ❤️ Main Concern
              </strong>

              <p>
                {report.mainConcern ||
                  "Not collected"}
              </p>
            </div>


            <div>
              <strong>
                🕐 Duration
              </strong>

              <p>
                {report.duration ||
                  "Not collected"}
              </p>
            </div>


            <div>
              <strong>
                📊 Severity
              </strong>

              <p>
                {report.severity ||
                  "Not collected"}
              </p>
            </div>

          </div>


          {/* Summary */}

          <h2>
            📋 Summary
          </h2>

          <div
            style={{
              padding: "18px",
              marginBottom: "24px",
              borderRadius: "14px",
              background: "#f8fafc",
              border: "1px solid #e5e7eb",
              color: "#475569",
              lineHeight: "1.7",
            }}
          >
            {report.summary ||
              "No summary available."}
          </div>


          {/* Related Symptoms */}

          <h2>
            🔎 Related Symptoms
          </h2>

          {report.relatedSymptoms &&
          report.relatedSymptoms.length > 0 ? (

            <div
              style={{
                display: "flex",
                flexWrap: "wrap",
                gap: "8px",
                marginBottom: "24px",
              }}
            >

              {report.relatedSymptoms.map(
                (symptom, index) => (
                  <span
                    key={index}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "999px",
                      background: "#eff6ff",
                      color: "#1d4ed8",
                      border:
                        "1px solid #dbeafe",
                      fontSize: "12px",
                      fontWeight: "600",
                    }}
                  >
                    ✓ {symptom}
                  </span>
                )
              )}

            </div>

          ) : (

            <p
              style={{
                color: "#64748b",
                fontSize: "13px",
              }}
            >
              No related symptoms were collected.
            </p>

          )}


          {/* Follow-up */}

          <h2>
            🩺 Follow-up
          </h2>

          {report.followUp &&
          report.followUp.length > 0 ? (

            <div
              style={{
                display: "flex",
                flexDirection: "column",
                gap: "10px",
              }}
            >

              {report.followUp.map(
                (item, index) => (
                  <div
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "flex-start",
                      gap: "10px",
                      padding: "14px",
                      borderRadius: "12px",
                      background: "#f8fafc",
                      border:
                        "1px solid #e5e7eb",
                    }}
                  >

                    <span
                      style={{
                        width: "24px",
                        height: "24px",
                        minWidth: "24px",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        borderRadius: "50%",
                        background: "#dcfce7",
                        color: "#15803d",
                        fontSize: "12px",
                        fontWeight: "700",
                      }}
                    >
                      ✓
                    </span>

                    <span
                      style={{
                        color: "#475569",
                        fontSize: "13px",
                        lineHeight: "1.6",
                      }}
                    >
                      {item}
                    </span>

                  </div>
                )
              )}

            </div>

          ) : (

            <div
              style={{
                padding: "14px",
                borderRadius: "12px",
                background: "#fff7ed",
                color: "#9a3412",
                fontSize: "13px",
              }}
            >
              No specific follow-up information
              was generated for this screening.
            </div>

          )}


          {/* New Screening */}

          <div className="controls">

            <button
              className="start-button"
              onClick={() => {
                window.location.reload();
              }}
            >
              🔄 Start New Screening
            </button>

          </div>

        </div>

      </div>
    );
  }


  // ==========================================
  // CALL SCREEN
  // ==========================================

  return (
    <div className="app">

      <div className="card">

        {/* Header */}

        <div className="header">

          <div>

            <div
              style={{
                display: "inline-block",
                marginBottom: "6px",
                padding: "5px 9px",
                borderRadius: "999px",
                background: "#eff6ff",
                color: "#2563eb",
                fontSize: "10px",
                fontWeight: "700",
              }}
            >
              ✦ AI POWERED
            </div>

            <h1>
              🩺 AI Health Assistant
            </h1>

            <p>
              Voice-based health screening
            </p>

          </div>


          <span
            className={
              connected
                ? "status online"
                : "status offline"
            }
          >
            <span>
              ●
            </span>{" "}
            {connected
              ? "Connected"
              : "Offline"}
          </span>

        </div>


        {/* Active Call Status */}

        {calling && (

          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              marginBottom: "15px",
              padding: "12px 15px",
              borderRadius: "12px",
              background: "#f8fafc",
              border: "1px solid #e2e8f0",
            }}
          >

            <div>

              <strong
                style={{
                  display: "block",
                  fontSize: "13px",
                }}
              >
                🎙 Screening in progress
              </strong>

              <span
                style={{
                  color: "#64748b",
                  fontSize: "11px",
                }}
              >
                {processing
                  ? "AI is processing your answer..."
                  : "I'm listening to your response."}
              </span>

            </div>

            <span
              style={{
                padding: "6px 9px",
                borderRadius: "999px",
                background: processing
                  ? "#fef3c7"
                  : "#dcfce7",
                color: processing
                  ? "#92400e"
                  : "#166534",
                fontSize: "10px",
                fontWeight: "700",
              }}
            >
              {processing
                ? "PROCESSING"
                : "LIVE"}
            </span>

          </div>

        )}


        {/* Conversation */}

        <div
          className="conversation"
          ref={conversationRef}
        >

          {messages.length === 0 ? (

            <div className="empty">

              <div
                style={{
                  fontSize: "45px",
                  marginBottom: "12px",
                }}
              >
                🎙️
              </div>

              <strong
                style={{
                  display: "block",
                  fontSize: "16px",
                  marginBottom: "7px",
                }}
              >
                Ready to begin?
              </strong>

              <p>
                Start your health screening.
                The AI assistant will guide you
                through a few simple questions.
              </p>

            </div>

          ) : (

            messages.map((message) => {

              const isAssistant =
                message.role === "assistant";

              return (
                <div
                  key={message.id}
                  className={
                    "message " +
                    message.role
                  }
                >

                  <div className="message-role">

                    {isAssistant
                      ? "🤖 AI Assistant"
                      : "👤 You"}

                  </div>

                  <div>
                    {message.text}
                  </div>

                </div>
              );
            })

          )}


          {/* Processing */}

          {processing && (

            <div className="processing">

              <span />
              <span />
              <span />

              <label>
                AI is thinking...
              </label>

            </div>

          )}

        </div>


        {/* Error */}

        {error && (

          <div className="error">

            <strong>
              ⚠ Something went wrong
            </strong>

            <div
              style={{
                marginTop: "5px",
              }}
            >
              {error}
            </div>

          </div>

        )}


        {/* Controls */}

        <div className="controls">

          {!calling ? (

            <button
              className="start-button"
              onClick={startCall}
            >
              🎙 Start Health Screening
            </button>

          ) : (

            <>

              <button
                className="voice-button"
                onClick={sendVoiceMessage}
                disabled={processing}
                title={
                  processing
                    ? "Please wait"
                    : "Click to speak"
                }
              >
                {processing
                  ? "⏳"
                  : "🎤"}
              </button>


              <button
                className="end-button"
                onClick={endCall}
              >
                🔴 End Call
              </button>

            </>

          )}

        </div>


        {/* Instructions */}

        {!calling && (

          <p className="hint">

            Click{" "}
            <strong>
              Start Health Screening
            </strong>{" "}
            to begin your assessment.

          </p>

        )}


        {calling && !processing && (

          <p className="hint">

            🎤 Click the microphone, speak your
            answer, then click it again to send.

          </p>

        )}


        {calling && processing && (

          <p className="hint">

            ⏳ Please wait while the AI processes
            your response.

          </p>

        )}


        {/* Safety */}

        <div
          style={{
            marginTop: "20px",
            padding: "12px 15px",
            borderRadius: "12px",
            background: "#f8fafc",
            border: "1px solid #eef2f7",
            color: "#64748b",
            fontSize: "11px",
            lineHeight: "1.5",
            textAlign: "center",
          }}
        >
          🔒 Your conversation is used only for
          this screening session.
          <br />
          This service does not provide a
          medical diagnosis.
        </div>

      </div>

    </div>
  );
}

