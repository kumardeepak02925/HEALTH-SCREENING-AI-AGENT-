const express = require("express");
const cors = require("cors");

const callRoutes = require("./routes/call.routes");
const reportRoutes = require("./routes/report.routes");

const errorMiddleware = require("./middleware/error.middleware");

const app = express();

// CORS
app.use(
  cors({
    origin:
      process.env.CLIENT_URL ||
      "http://localhost:5173",
    credentials: true,
  })
);

// JSON body parser
app.use(
  express.json({
    limit: "2mb",
  })
);

// Health check
app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "AI Health Screening Backend is running",
    timestamp: new Date().toISOString(),
  });
});

// API routes
app.use("/api/calls", callRoutes);
app.use("/api/reports", reportRoutes);

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Error handler
app.use(errorMiddleware);

module.exports = app;
