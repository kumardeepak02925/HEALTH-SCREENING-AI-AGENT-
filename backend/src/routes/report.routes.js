const express = require("express");

const {
  getReport,
} = require("../controllers/report.controllers");

const router = express.Router();

router.get("/:sessionId", getReport);

module.exports = router;