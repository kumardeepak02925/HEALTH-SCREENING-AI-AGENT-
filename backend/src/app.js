const express = require("express");
const cors = require("cors");

const callRoutes = require("./routes/call.routes");
const reportRoutes = require("./routes/report.routes");

const errorMiddleware =
  require("./middleware/error.middleware");

const app = express();

app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",

    credentials: true,
  })
);

app.use(
  express.json({
    limit: "2mb",
  })
);

app.get(
  "/api/health",
  (req, res) => {
    res.json({
      success: true,

      message:
        "AI Health Screening Backend is running",

      timestamp:
        new Date().toISOString(),
    });
  }
);

app.use(
  "/api/calls",
  callRoutes
);

app.use(
  "/api/reports",
  reportRoutes
);

app.use(
  (req, res) => {
    res.status(404).json({
      success: false,

      message:
        "Route not found",
    });
  }
);

app.use(errorMiddleware);

module.exports = app;