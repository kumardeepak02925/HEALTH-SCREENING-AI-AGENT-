const { randomUUID } = require("crypto");

const sessions = new Map();

const INITIAL_DATA = {
  name: null,
  mainConcern: null,
  duration: null,
  severity: null,
  relatedSymptoms: [],
};

function createSession() {
  const sessionId = randomUUID();

  const session = {
    sessionId,

    status: "active",

    startedAt: new Date().toISOString(),

    endedAt: null,

    language: "en",

    currentQuestion: "name",

    askedQuestions: [],

    collectedData: {
      ...INITIAL_DATA,
    },

    conversation: [],
  };

  sessions.set(sessionId, session);

  return session;
}

function getSession(sessionId) {
  return sessions.get(sessionId);
}

function deleteSession(sessionId) {
  sessions.delete(sessionId);
}

function addMessage(sessionId, role, text) {
  const session = getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  session.conversation.push({
    role,
    text,
    timestamp: new Date().toISOString(),
  });
}

function updateCollectedData(sessionId, data = {}) {
  const session = getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  session.collectedData = {
    ...session.collectedData,
    ...data,
  };
}

function markQuestionAsked(sessionId, question) {
  const session = getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  if (!session.askedQuestions.includes(question)) {
    session.askedQuestions.push(question);
  }

  session.currentQuestion = question;
}

function setLanguage(sessionId, language) {
  const session = getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  session.language = language;
}

function endSession(sessionId) {
  const session = getSession(sessionId);

  if (!session) {
    return null;
  }

  session.status = "ended";
  session.endedAt = new Date().toISOString();

  return session;
}

function getConversationForLLM(sessionId) {
  const session = getSession(sessionId);

  if (!session) {
    throw new Error("Session not found");
  }

  return session.conversation.map((message) => ({
    role: message.role,
    content: message.text,
  }));
}

function getAllSessions() {
  return Array.from(sessions.values());
}

module.exports = {
  createSession,
  getSession,
  deleteSession,
  addMessage,
  updateCollectedData,
  markQuestionAsked,
  setLanguage,
  endSession,
  getConversationForLLM,
  getAllSessions,
};