const express = require("express");

const {
  createCall,
  getCall,
  endCall,
} = require("../controllers/call.controllers");

const router = express.Router();

router.post("/", createCall);
router.get("/:sessionId", getCall);
router.delete("/:sessionId", endCall);

module.exports = router;
