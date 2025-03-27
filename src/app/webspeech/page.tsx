"use client";

// pages/index.tsx
import { useState, useEffect, useRef } from "react";
import Head from "next/head";

// TypeScript interfaces for Web Speech API
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
      length: number;
    };
    length: number;
  };
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: (event: SpeechRecognitionEvent) => void;
  onerror: (event: any) => void;
  onend: () => void;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition?: SpeechRecognitionConstructor;
    webkitSpeechRecognition?: SpeechRecognitionConstructor;
  }
}

export default function Home() {
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check if SpeechRecognition is supported
    if (
      !("webkitSpeechRecognition" in window) &&
      !("SpeechRecognition" in window)
    ) {
      setIsSupported(false);
      return;
    }

    // Initialize SpeechRecognition
    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;

    if (SpeechRecognitionAPI) {
      recognitionRef.current = new SpeechRecognitionAPI();
      recognitionRef.current.continuous = true;
      recognitionRef.current.interimResults = true;

      recognitionRef.current.onresult = (event) => {
        let interimTranscript = "";
        let finalTranscript = "";

        for (let i = event.resultIndex; i < event.results.length; i++) {
          // Check if the result and its first alternative exist
          const result = event.results[i];
          if (result && result[0]) {
            const transcript = result[0].transcript;
            if (result.isFinal) {
              finalTranscript += transcript;
            } else {
              interimTranscript += transcript;
            }
          }
        }

        setTranscript(
          (prev) =>
            prev +
            finalTranscript +
            (interimTranscript ? ` ${interimTranscript}` : ""),
        );
      };

      recognitionRef.current.onerror = (event: any) => {
        // Handle specific error types
        switch (event.error) {
          case "network":
            setError(
              "Network error occurred. Please check your internet connection.",
            );
            break;
          case "not-allowed":
          case "permission-denied":
            setError(
              "Microphone access denied. Please allow microphone permissions in your browser.",
            );
            break;
          case "no-speech":
            setError(
              "No speech detected. Please try speaking louder or check your microphone.",
            );
            break;
          case "audio-capture":
            setError(
              "No microphone detected. Please connect a microphone and try again.",
            );
            break;
          case "aborted":
            // This is a normal user action, don't show error
            setError(null);
            break;
          default:
            setError(
              `Speech recognition error: ${event.error || "unknown error"}`,
            );
        }

        // If we're recording when an error occurs, stop recording
        if (isRecording) {
          setIsRecording(false);
        }

        console.error("Speech recognition error", event.error);
      };

      recognitionRef.current.onend = () => {
        // If recording ends but we're still in recording state, it was an unexpected end
        if (isRecording) {
          setIsRecording(false);
        }
      };
    }

    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, [isRecording]);

  const toggleRecording = () => {
    if (!recognitionRef.current) return;

    // Clear any previous errors when starting a new recording
    setError(null);

    if (isRecording) {
      recognitionRef.current.stop();
    } else {
      setTranscript("");
      try {
        recognitionRef.current.start();
      } catch (err) {
        setError(
          "Failed to start speech recognition. Please reload the page and try again.",
        );
        console.error("Start recognition error:", err);
      }
    }
    setIsRecording(!isRecording);
  };

  if (!isSupported) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gray-100 p-4">
        <div className="w-full max-w-lg rounded-lg bg-white p-8 shadow-md">
          <h1 className="mb-4 text-2xl font-bold text-red-600">
            Browser Not Supported
          </h1>
          <p className="text-gray-700">
            Your browser doesn't support the Web Speech API. Please try using
            Chrome, Edge, or Safari.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center bg-gray-100 p-4">
      <Head>
        <title>Voice Transcription App</title>
        <meta name="description" content="Record and transcribe your voice" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <main className="mt-10 w-full max-w-2xl rounded-lg bg-white p-8 shadow-md">
        <h1 className="mb-6 text-center text-3xl font-bold text-blue-600">
          Voice Transcription
        </h1>

        {error && (
          <div className="mb-6 rounded border-l-4 border-red-500 bg-red-50 p-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-500"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <div className="mb-8 flex justify-center">
          <button
            onClick={toggleRecording}
            className={`flex items-center justify-center rounded-full px-6 py-3 text-lg font-semibold text-white transition duration-300 ${
              isRecording
                ? "bg-red-500 hover:bg-red-600"
                : "bg-blue-500 hover:bg-blue-600"
            }`}
          >
            <span className="mr-2">
              {isRecording ? (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <rect x="6" y="6" width="12" height="12" strokeWidth="2" />
                </svg>
              ) : (
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                  />
                </svg>
              )}
            </span>
            {isRecording ? "Stop Recording" : "Start Recording"}
          </button>
        </div>

        <div className="mb-4">
          <h2 className="mb-2 text-xl font-semibold text-gray-700">
            Transcript:
          </h2>
          <div
            className={`rounded-lg p-4 ${transcript ? "border border-gray-200 bg-gray-50" : "bg-gray-100"} min-h-64`}
          >
            {transcript ? (
              <p className="whitespace-pre-wrap text-gray-800">{transcript}</p>
            ) : (
              <p className="text-gray-400 italic">
                Start recording to see transcript...
              </p>
            )}
          </div>
        </div>

        <div className="mt-6 border-t border-gray-200 pt-4">
          <h3 className="mb-2 text-lg font-medium text-gray-700">
            Instructions:
          </h3>
          <ul className="list-disc space-y-1 pl-5 text-gray-600">
            <li>Click the button above to start recording</li>
            <li>Speak clearly into your microphone</li>
            <li>Your speech will be transcribed in real-time</li>
            <li>Click the button again to stop recording</li>
          </ul>

          <div className="mt-4 rounded bg-blue-50 p-4">
            <h4 className="mb-2 font-medium text-blue-800">
              Troubleshooting tips:
            </h4>
            <ul className="list-disc space-y-1 pl-5 text-sm text-blue-700">
              <li>
                Make sure your browser has permission to access your microphone
              </li>
              <li>Check that you have a stable internet connection</li>
              <li>
                The Speech Recognition API works best in Chrome, Edge or Safari
              </li>
              <li>Speak clearly and at a normal pace for best results</li>
              <li>If you receive network errors, try reloading the page</li>
            </ul>
          </div>
        </div>
      </main>

      <footer className="mt-8 text-center text-sm text-gray-500">
        <p>Powered by Next.js, Tailwind CSS, and Web Speech API</p>
      </footer>
    </div>
  );
}
