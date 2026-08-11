import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import socket from "../services/socket";

export function useVoiceCall() {
  const [connected, setConnected] =
    useState(false);

  const [calling, setCalling] =
    useState(false);

  const [processing, setProcessing] =
    useState(false);

  const [sessionId, setSessionId] =
    useState(null);

  const [messages, setMessages] =
    useState([]);

  const [error, setError] =
    useState(null);

  const [report, setReport] =
    useState(null);

  const mediaRecorderRef =
    useRef(null);

  const streamRef =
    useRef(null);

  const chunksRef =
    useRef([]);


  const addMessage = useCallback(
    (role, text) => {
      setMessages((previous) => [
        ...previous,
        {
          id:
            `${Date.now()}-${Math.random()}`,
          role,
          text,
        },
      ]);
    },
    []
  );


  useEffect(() => {

    function onConnect() {
      console.log(
        "✅ Frontend Socket connected"
      );

      setConnected(true);
      setError(null);
    }


    function onDisconnect() {
      console.log(
        "🔌 Frontend Socket disconnected"
      );

      setConnected(false);
    }


    function onCallStarted(data) {
      console.log(
        "📞 Call started:",
        data
      );

      setSessionId(
        data.sessionId
      );

      setCalling(true);
    }


    function onProcessing(data) {
      setProcessing(
        Boolean(data.status)
      );
    }


    function onUserTranscript(data) {
      addMessage(
        "user",
        data.text
      );
    }


    function onAiText(data) {
      addMessage(
        "assistant",
        data.text
      );
    }


    function onAiAudio(data) {
      if (!data.audio) {
        return;
      }

      try {
        const binary =
          atob(data.audio);

        const bytes =
          new Uint8Array(
            binary.length
          );

        for (
          let i = 0;
          i < binary.length;
          i++
        ) {
          bytes[i] =
            binary.charCodeAt(i);
        }

        const blob =
          new Blob(
            [bytes],
            {
              type:
                data.mimeType ||
                "audio/mpeg",
            }
          );

        const audioUrl =
          URL.createObjectURL(
            blob
          );

        const audio =
          new Audio(audioUrl);

        audio.onended = () => {
          URL.revokeObjectURL(
            audioUrl
          );
        };

        audio.play().catch(
          (playError) => {
            console.error(
              "Audio playback failed:",
              playError
            );
          }
        );

      } catch (audioError) {
        console.error(
          "Audio decoding failed:",
          audioError
        );
      }
    }


    function onWarning(data) {
      console.warn(
        "⚠️ Warning:",
        data
      );
    }


    function onCallError(data) {
      console.error(
        "❌ Call error:",
        data
      );

      setError(
        data.message ||
          "Something went wrong."
      );

      setProcessing(false);
    }


    function onReportReady(data) {
      console.log(
        "📋 Report:",
        data
      );

      setReport(
        data.report
      );
    }


    function onCallEnded() {
      setCalling(false);
      setProcessing(false);

      stopMicrophone();
    }


    socket.on(
      "connect",
      onConnect
    );

    socket.on(
      "disconnect",
      onDisconnect
    );

    socket.on(
      "call-started",
      onCallStarted
    );

    socket.on(
      "processing",
      onProcessing
    );

    socket.on(
      "user-transcript",
      onUserTranscript
    );

    socket.on(
      "ai-text",
      onAiText
    );

    socket.on(
      "ai-audio",
      onAiAudio
    );

    socket.on(
      "warning",
      onWarning
    );

    socket.on(
      "call-error",
      onCallError
    );

    socket.on(
      "report-ready",
      onReportReady
    );

    socket.on(
      "call-ended",
      onCallEnded
    );


    return () => {
      socket.off(
        "connect",
        onConnect
      );

      socket.off(
        "disconnect",
        onDisconnect
      );

      socket.off(
        "call-started",
        onCallStarted
      );

      socket.off(
        "processing",
        onProcessing
      );

      socket.off(
        "user-transcript",
        onUserTranscript
      );

      socket.off(
        "ai-text",
        onAiText
      );

      socket.off(
        "ai-audio",
        onAiAudio
      );

      socket.off(
        "warning",
        onWarning
      );

      socket.off(
        "call-error",
        onCallError
      );

      socket.off(
        "report-ready",
        onReportReady
      );

      socket.off(
        "call-ended",
        onCallEnded
      );
    };

  }, [addMessage]);


  const startCall =
    useCallback(async () => {

      setError(null);
      setMessages([]);
      setReport(null);

      if (!socket.connected) {
        socket.connect();
      }

      socket.emit(
        "start-call"
      );

    }, []);


  const startMicrophone =
    useCallback(async () => {

      try {

        const stream =
          await navigator.mediaDevices
            .getUserMedia({
              audio: true,
            });

        streamRef.current =
          stream;


        const mimeTypes = [
          "audio/webm;codecs=opus",
          "audio/webm",
          "audio/mp4",
        ];


        const supportedType =
          mimeTypes.find(
            (type) =>
              MediaRecorder.isTypeSupported(
                type
              )
          );


        const recorder =
          supportedType
            ? new MediaRecorder(
                stream,
                {
                  mimeType:
                    supportedType,
                }
              )
            : new MediaRecorder(
                stream
              );


        chunksRef.current = [];


        recorder.ondataavailable =
          (event) => {

            if (
              event.data &&
              event.data.size > 0
            ) {
              chunksRef.current.push(
                event.data
              );
            }
          };


        recorder.onstop =
          async () => {

            try {

              const blob =
                new Blob(
                  chunksRef.current,
                  {
                    type:
                      recorder.mimeType ||
                      "audio/webm",
                  }
                );


              console.log(
                "🎤 Recording size:",
                blob.size
              );


              if (
                blob.size === 0
              ) {
                setError(
                  "No audio was recorded."
                );

                return;
              }


              const arrayBuffer =
                await blob.arrayBuffer();


              const bytes =
                new Uint8Array(
                  arrayBuffer
                );


              let binary = "";

              const chunkSize =
                0x8000;


              for (
                let i = 0;
                i < bytes.length;
                i += chunkSize
              ) {

                binary += String.fromCharCode(
                  ...bytes.subarray(
                    i,
                    i + chunkSize
                  )
                );
              }


              const base64 =
                btoa(binary);


              socket.emit(
                "audio",
                {
                  audio: base64,

                  mimeType:
                    recorder.mimeType ||
                    "audio/webm",
                }
              );

            } catch (audioError) {

              console.error(
                "Audio send error:",
                audioError
              );

              setError(
                "Unable to send audio."
              );
            }
          };


        mediaRecorderRef.current =
          recorder;

        recorder.start();

      } catch (microphoneError) {

        console.error(
          "Microphone error:",
          microphoneError
        );

        setError(
          "Microphone permission is required."
        );
      }

    }, []);


  const stopMicrophone =
    useCallback(() => {

      if (
        mediaRecorderRef.current &&
        mediaRecorderRef.current.state !==
          "inactive"
      ) {

        mediaRecorderRef.current.stop();
      }


      if (streamRef.current) {

        streamRef.current
          .getTracks()
          .forEach(
            (track) =>
              track.stop()
          );

        streamRef.current =
          null;
      }

    }, []);


  const sendVoiceMessage =
    useCallback(async () => {

      if (
        !mediaRecorderRef.current
      ) {
        await startMicrophone();

        return;
      }


      if (
        mediaRecorderRef.current
          .state === "recording"
      ) {

        mediaRecorderRef.current.stop();

        mediaRecorderRef.current =
          null;
      }

    }, [startMicrophone]);


  const endCall =
    useCallback(() => {

      stopMicrophone();

      socket.emit(
        "end-call"
      );

    }, [stopMicrophone]);


  return {
    connected,
    calling,
    processing,
    sessionId,
    messages,
    error,
    report,

    startCall,
    sendVoiceMessage,
    endCall,
  };
}