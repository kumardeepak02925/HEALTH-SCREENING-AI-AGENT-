const http = require("http");

const app = require("./app");

const env = require("./config/env");

const initializeSocket =
  require("./websocket/call.socket");

const {
  info,
} = require("./utils/logger");

const server =
  http.createServer(app);

initializeSocket(server);

server.listen(
  env.port,
  () => {
    info(
      `Server running on http://localhost:${env.port}`
    );

    info(
      `WebSocket server ready`
    );
  }
);

process.on(
  "unhandledRejection",
  (error) => {
    console.error(
      "Unhandled Promise Rejection:",
      error
    );
  }
);

process.on(
  "uncaughtException",
  (error) => {
    console.error(
      "Uncaught Exception:",
      error
    );
  }
);