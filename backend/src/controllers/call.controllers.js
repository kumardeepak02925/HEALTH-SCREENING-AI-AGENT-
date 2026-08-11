const {
  createSession,
  getSession,
  endSession,
} = require("../services/conversation.services");

const {
  generateHealthReport,
} = require("../services/report.service");

async function createCall(req, res) {
  const session = createSession();

  res.status(201).json({
    success: true,

    session: {
      sessionId: session.sessionId,

      status: session.status,

      startedAt: session.startedAt,
    },
  });
}

async function getCall(req, res) {
  const { sessionId } = req.params;

  const session = getSession(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Call session not found",
    });
  }

  return res.json({
    success: true,
    session,
  });
}

async function endCall(req, res) {
  const { sessionId } = req.params;

  const session = endSession(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Call session not found",
    });
  }

  const report =
    await generateHealthReport(session);

  return res.json({
    success: true,

    sessionId,

    report,
  });
}

module.exports = {
  createCall,
  getCall,
  endCall,
};