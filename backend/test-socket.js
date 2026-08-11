const { io } = require("socket.io-client");

const socket = io("http://localhost:5000");

socket.on("connect", () => {
  console.log("✅ Socket connected");
  console.log("Socket ID:", socket.id);

  console.log("📞 Starting call...");

  socket.emit("start-call");
});

socket.on("call-started", (data) => {
  console.log("\n✅ CALL STARTED");
  console.log(data);
});

socket.on("ai-text", (data) => {
  console.log("\n🤖 AI RESPONSE");
  console.log(data);
});

socket.on("ai-audio", (data) => {
  console.log("\n🔊 AI AUDIO RECEIVED");

  console.log({
    mimeType: data.mimeType,
    audioLength: data.audio?.length
  });
});

socket.on("processing", (data) => {
  console.log("\n⚙️ Processing:", data);
});

socket.on("warning", (data) => {
  console.log("\n⚠️ Warning:", data);
});

socket.on("call-error", (data) => {
  console.log("\n❌ Call Error:");
  console.log(data);
});

socket.on("disconnect", (reason) => {
  console.log("\n🔌 Disconnected:", reason);
});

socket.on("connect_error", (error) => {
  console.log("\n❌ Connection Error:");
  console.log(error.message);
});