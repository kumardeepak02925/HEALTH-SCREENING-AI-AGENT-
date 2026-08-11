const {
  getSession,
} = require("../services/conversation.services");

const {
  generateHealthReport,
} = require("../services/report.service");

async function getReport(req, res) {
  const { sessionId } = req.params;

  const session = getSession(sessionId);

  if (!session) {
    return res.status(404).json({
      success: false,
      message: "Session not found",
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
  getReport,
};