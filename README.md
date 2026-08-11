# AI Health Screening Assistant

This repository contains a voice-based health screening application with a Node.js backend and a React frontend.

## Project Structure

- `backend/` - Node.js + Express + Socket.IO backend
- `FRONTEND/frontend/` - React + Vite frontend

## Prerequisites

- Node.js 20+ installed
- npm installed

## Backend Setup

1. Open a terminal in `backend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Create a `.env` file in `backend/` with the following values:
   ```env
   PORT=5000
   CLIENT_URL=http://localhost:5173

   SARVAM_API_KEY=your_sarvam_api_key
   GEMINI_API_KEY=your_gemini_api_key

   SARVAM_STT_MODEL=saaras:v3
   SARVAM_TTS_MODEL=bulbul:v3
   SARVAM_TTS_VOICE=aditya
   GEMINI_MODEL=gemini-3.5-flash-lite
   ```
4. Start the backend:
   ```bash
   npm run dev
   ```

The backend server listens on `http://localhost:5000` by default.

## Frontend Setup

1. Open a terminal in `FRONTEND/frontend/`
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the frontend:
   ```bash
   npm run dev
   ```

The frontend will normally run on `http://localhost:5173`.

## Usage

1. Start the backend first.
2. Start the frontend.
3. Open the frontend url in your browser.
4. Click **Start Health Screening** and follow the voice prompts.

## Notes

- The backend uses environment variables for Sarvam and Gemini authentication.
- The frontend connects to the backend via Socket.IO.
- If your backend is hosted on a different URL, set `VITE_BACKEND_URL` in the frontend environment or `import.meta.env`.

## Troubleshooting

- If the frontend cannot load, make sure `CallScreen.jsx` exports a default component and the app is imported correctly in `src/App.jsx`.
- If voice recording doesn't work, ensure microphone permissions are allowed in the browser.
- If the backend cannot reach Sarvam or Gemini, validate your API keys and network connectivity.

## Evaluation Criteria

This project is intended to be evaluated on the following dimensions:

- **Call experience:** The system should support a real voice conversation end-to-end, not just static code.
- **Pipeline architecture:** The STT → LLM → TTS flow should be clearly structured and the real-time transport should be handled cleanly via Socket.IO.
- **Conversation state management:** The AI should maintain context across turns and avoid losing track of questions or answers.
- **Failure handling:** The system should gracefully handle silence, unclear audio, or API failures and recover when possible.
- **Report quality:** The post-call summary should meaningfully synthesize the spoken conversation into structured findings, not just echo the transcript.
