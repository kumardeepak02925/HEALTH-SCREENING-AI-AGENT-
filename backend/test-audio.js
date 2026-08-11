const fs = require("fs");
const { io } = require("socket.io-client");

const audioPath = "./test-audio.m4a";
const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("✅ Socket connected");

  socket.emit("start-call");
});

socket.on("call-started", (data) => {
  console.log("\n✅ CALL STARTED");
  console.log(data);

  setTimeout(() => {
    sendAudio();
  }, 1000);
});

function sendAudio() {
  console.log("\n🎤 Sending audio...");

  if (!fs.existsSync(audioPath)) {
    console.error(
      "❌ test-audio.m4a not found"
    );
    console.error(
      "Please add a real audio file named test-audio.m4a to the backend folder."
    );

    socket.disconnect();
    return;
  }

  const audio = fs.readFileSync(audioPath);

  if (audio.length === 0) {
    console.error("❌ Audio file is empty");
    socket.disconnect();
    return;
  }

  console.log(
    "Audio size:",
    audio.length,
    "bytes"
  );

  socket.emit("audio", {
    audio: audio.toString("base64"),
    mimeType: "audio/mp4",
  });
}

socket.on("processing", (data) => {
  console.log(
    "\n⚙️ Processing:",
    data
  );
});

socket.on("user-transcript", (data) => {
  console.log(
    "\n📝 USER TRANSCRIPT:"
  );

  console.log(data);
});

socket.on("ai-text", (data) => {
  console.log(
    "\n🤖 AI RESPONSE:"
  );

  console.log(data);
});

socket.on("ai-audio", (data) => {
  console.log(
    "\n🔊 AI AUDIO RECEIVED:"
  );

  console.log({
    mimeType: data.mimeType,
    audioLength: data.audio?.length,
  });

  console.log(
    "\n✅ COMPLETE STT → LLM → TTS FLOW WORKED!"
  );

  // Keep the call open so we can verify STT/LLM responses before ending.
});

socket.on("report-ready", (data) => {
  console.log(
    "\n📋 HEALTH REPORT:"
  );

  console.log(
    JSON.stringify(
      data.report,
      null,
      2
    )
  );
});

socket.on("call-ended", (data) => {
  console.log(
    "\n🔴 CALL ENDED"
  );

  console.log(data);

  socket.disconnect();
});

socket.on("no-speech", (data) => {
  console.log(
    "\n⚠️ NO SPEECH:"
  );

  console.log(data);
});

socket.on("warning", (data) => {
  console.log(
    "\n⚠️ WARNING:"
  );

  console.log(data);
});

socket.on("call-error", (data) => {
  console.log(
    "\n❌ CALL ERROR:"
  );

  console.log(data);
});

socket.on("connect_error", (error) => {
  console.error(
    "\n❌ SOCKET ERROR:",
    error.message
  );
});

socket.on("disconnect", (reason) => {
  console.log(
    "\n🔌 Disconnected:",
    reason
  );
});