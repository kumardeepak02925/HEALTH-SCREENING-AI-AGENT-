const http = require("http");

const app = require("./app");
const env = require("./config/env");

const initializeSocket = require("./websocket/call.socket");

const { info } = require("./utils/logger");

// Create HTTP server
const server = http.createServer(app);

// Initialize Socket.IO
initializeSocket(server);

// Start server
server.listen(
  env.port,
  "0.0.0.0",
  () => {
    info(`Server running on port ${env.port}`);
    info("WebSocket server ready");
  }
);

// Handle unhandled promise rejections
process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "Unhandled Promise Rejection:",
      error
    );
  }
);

// Handle uncaught exceptions
process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught Exception:",
      error
    );
  }
);
