"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Loader2, Mic, StopCircle, Keyboard } from "lucide-react";
import { toast } from "sonner";
import { pipeline } from "@huggingface/transformers";
import { Textarea } from "~/components/ui/textarea";

interface MeetingTranscriptionProps {
  onTranscriptionComplete: (text: string) => Promise<void>;
  onCancel: () => void;
}

// Import SpeechRecognition types
interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  maxAlternatives: number;
  onresult:
    | ((this: SpeechRecognition, ev: SpeechRecognitionEvent) => any)
    | null;
  onerror:
    | ((this: SpeechRecognition, ev: SpeechRecognitionErrorEvent) => any)
    | null;
  onend: ((this: SpeechRecognition, ev: Event) => any) | null;
  start(): void;
  stop(): void;
}

interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
}

/**
 * Component for transcribing meeting audio from screen capture
 */
export const MeetingTranscription = ({
  onTranscriptionComplete,
  onCancel,
}: MeetingTranscriptionProps) => {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [transcriber, setTranscriber] = useState<any>(null);
  const [isScreenCapturing, setIsScreenCapturing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usingWebSpeechAPI, setUsingWebSpeechAPI] = useState(false);
  const [manualTranscription, setManualTranscription] = useState<string>("");
  const [showManualInput, setShowManualInput] = useState(false);
  const [hasAutoTranscriptionFailed, setHasAutoTranscriptionFailed] =
    useState(false);
  const [networkStatus, setNetworkStatus] = useState<
    "stable" | "unstable" | "disconnected"
  >("stable");
  const [hasDetectedAudio, setHasDetectedAudio] = useState(false);
  const [showMicPermissionRequest, setShowMicPermissionRequest] =
    useState(false);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const isArcBrowser = useRef(
    navigator.userAgent.includes("Arc") ||
      (navigator.userAgent.includes("Chrome") &&
        navigator.userAgent.includes("Apple")),
  );
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [isMicrophoneTesting, setIsMicrophoneTesting] = useState(false);
  const [microphoneTestResult, setMicrophoneTestResult] = useState<
    "untested" | "working" | "not-working" | "denied"
  >("untested");
  const microphoneTestTimeout = useRef<NodeJS.Timeout | null>(null);

  // Refs for media handling
  const audioChunksRef = useRef<Blob[]>([]);
  const screenMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptionTextRef = useRef<string>("");

  // Check if Web Speech API is supported
  const isWebSpeechAPISupported = () => {
    return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
  };

  // Load the transcription method
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);

        // For Arc browser, always use transformers.js and skip Web Speech API
        if (isArcBrowser.current) {
          console.log(
            "Arc browser detected! Using transformers.js exclusively",
          );
          setUsingWebSpeechAPI(false);

          try {
            console.log("Loading transformers.js model for Arc browser...");
            // Load the Whisper model for transcription
            const whisperPipeline = await pipeline(
              "automatic-speech-recognition",
              "Xenova/whisper-tiny.en",
            );

            console.log("Whisper pipeline loaded for Arc:", whisperPipeline);

            // Ensure the pipeline is properly initialized as a function
            if (typeof whisperPipeline === "function") {
              setTranscriber(whisperPipeline);
            } else if (
              whisperPipeline &&
              typeof (whisperPipeline as any).__call__ === "function"
            ) {
              setTranscriber((input: any) =>
                (whisperPipeline as any).__call__(input),
              );
            } else if (
              whisperPipeline &&
              typeof (whisperPipeline as any).call === "function"
            ) {
              setTranscriber((input: any) =>
                (whisperPipeline as any).call(input),
              );
            } else {
              throw new Error("Invalid pipeline initialization");
            }
          } catch (error) {
            console.error(
              "Failed to load transformers.js model for Arc:",
              error,
            );
            throw new Error(
              "No transcription methods are available in this browser",
            );
          }
        } else {
          // For other browsers, first check if Web Speech API is available (more reliable)
          const webSpeechAvailable = isWebSpeechAPISupported();
          if (webSpeechAvailable) {
            console.log("Using Web Speech API for transcription");
            setUsingWebSpeechAPI(true);
          }

          // Always try to load transformers.js model, even when using Web Speech API
          // This ensures we have it available as a fallback
          try {
            console.log(
              "Loading transformers.js model as fallback or primary method...",
            );
            // Load the Whisper model for transcription
            const whisperPipeline = await pipeline(
              "automatic-speech-recognition",
              "Xenova/whisper-tiny.en",
            );

            console.log("Whisper pipeline loaded:", whisperPipeline);

            // Ensure the pipeline is properly initialized as a function
            if (typeof whisperPipeline === "function") {
              setTranscriber(whisperPipeline);
            } else if (
              whisperPipeline &&
              typeof (whisperPipeline as any).__call__ === "function"
            ) {
              setTranscriber((input: any) =>
                (whisperPipeline as any).__call__(input),
              );
            } else if (
              whisperPipeline &&
              typeof (whisperPipeline as any).call === "function"
            ) {
              setTranscriber((input: any) =>
                (whisperPipeline as any).call(input),
              );
            } else {
              throw new Error("Invalid pipeline initialization");
            }

            // If Web Speech API is not available, indicate we're using transformers.js
            if (!webSpeechAvailable) {
              setUsingWebSpeechAPI(false);
            }
          } catch (error) {
            console.error("Failed to load transformers.js model:", error);

            // If Web Speech API is not available, and transformers.js failed, throw error
            if (!webSpeechAvailable) {
              throw new Error(
                "No transcription methods are available in this browser",
              );
            }
          }
        }
      } catch (error) {
        console.error("Failed to initialize transcription:", error);
        setErrorMessage(
          "Failed to initialize transcription. Please try again or use a different browser.",
        );
      } finally {
        setIsModelLoading(false);
      }
    };

    loadModel();

    // Cleanup on unmount
    return () => {
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Add useEffect for detection logging
  useEffect(() => {
    if (isArcBrowser.current) {
      console.log("Arc browser detected! Using specialized handling");
    }
  }, []);

  /**
   * Ensures all required permissions are granted before starting
   * Returns the combined stream if successful, false if permissions denied
   */
  const setupPermissions = async () => {
    // Step 1: Reset state
    setErrorMessage(null);
    setHasDetectedAudio(false);
    setAudioLevel(0);

    // Step 2: First try microphone permission - crucial for Arc browser
    try {
      console.log("Requesting microphone permission first...");
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      setMicPermissionGranted(true);

      // Log success but stop the stream as we'll recreate it
      console.log("✓ Microphone permission granted");
      micStream.getTracks().forEach((track) => track.stop());
    } catch (micError) {
      console.warn("Microphone permission not granted:", micError);
      // On Arc, microphone permission is critical, show explicit UI
      if (isArcBrowser.current) {
        setIsScreenCapturing(false);
        setShowMicPermissionRequest(true);
        return false;
      }
      // For other browsers, we can try to continue with screen audio only
    }

    // Step 3: Request screen sharing (with audio)
    try {
      console.log("Requesting screen sharing with audio...");
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Analyze what we received
      const hasScreenAudio = screenStream.getAudioTracks().length > 0;
      console.log(
        "✓ Screen sharing granted. Audio tracks:",
        hasScreenAudio ? "Yes" : "No",
      );

      if (!hasScreenAudio) {
        toast.warning(
          "No audio from screen capture detected. Make sure to check 'Share system audio'.",
        );
      }

      // Store for cleanup
      screenStreamRef.current = screenStream;

      // Step 4: Create combined stream with both sources if possible
      const combinedStream = new MediaStream();

      // Add all tracks from screen
      screenStream.getTracks().forEach((track) => {
        track.enabled = true;
        combinedStream.addTrack(track);
      });

      // If we have microphone permission, add mic audio too
      if (micPermissionGranted) {
        try {
          const highQualityMic = await navigator.mediaDevices.getUserMedia({
            audio: {
              echoCancellation: true,
              noiseSuppression: true,
              autoGainControl: true,
              sampleRate: isArcBrowser.current ? 44100 : 48000,
              channelCount: 2,
            },
          });

          highQualityMic.getAudioTracks().forEach((track) => {
            track.enabled = true;
            combinedStream.addTrack(track);
          });

          console.log("✓ Added high quality microphone to stream");
        } catch (err) {
          console.warn("Could not add high quality microphone:", err);
        }
      }

      // Step 5: Setup audio context for monitoring
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(combinedStream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);

      // Play a test tone to help initialize audio system (crucial for Arc)
      setTimeout(() => playTestTone(audioContext), 500);

      // Start audio level monitoring
      monitorAudioLevels(analyzer);

      // Everything successful, return the combined stream
      return combinedStream;
    } catch (screenError) {
      console.error("Screen sharing error:", screenError);
      setErrorMessage("Screen sharing permission denied or cancelled.");
      return false;
    }
  };

  /**
   * Plays a test tone to help initialize the audio system
   * This is particularly important for Arc browser
   */
  const playTestTone = (audioContext: AudioContext) => {
    try {
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();

      oscillator.type = "sine";
      oscillator.frequency.value = 440; // A4 note
      gainNode.gain.value = 0.05; // Very quiet

      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);

      // Brief tone
      oscillator.start();
      setTimeout(() => oscillator.stop(), 200);

      console.log("Test tone played to activate audio system");
    } catch (err) {
      console.warn("Could not play test tone:", err);
    }
  };

  /**
   * Continuously monitors audio levels
   */
  const monitorAudioLevels = (analyzer: AnalyserNode) => {
    if (!isScreenCapturing) return;

    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    analyzer.getByteFrequencyData(dataArray);

    // Calculate average level
    let sum = 0;
    for (let i = 0; i < bufferLength; i++) {
      sum += dataArray[i] || 0;
    }

    const average = sum / bufferLength;

    // Use lower threshold for Arc browser
    const threshold = isArcBrowser.current ? 1.5 : 3.0;

    // Update UI with level
    setAudioLevel(average);

    // Detect audio
    if (average > threshold) {
      setHasDetectedAudio(true);
      console.log(`Audio detected! Level: ${average.toFixed(1)}`);
    }

    // Continue monitoring
    if (isScreenCapturing) {
      requestAnimationFrame(() => monitorAudioLevels(analyzer));
    }
  };

  /**
   * Tests if the microphone is working by attempting to capture audio
   * and checking if any audio levels are detected
   */
  const testMicrophone = async () => {
    setIsMicrophoneTesting(true);
    setMicrophoneTestResult("untested");
    setAudioLevel(0);
    setErrorMessage(null);

    try {
      console.log("Testing microphone functionality...");

      // Request microphone access with high quality settings
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: isArcBrowser.current ? 44100 : 48000,
          channelCount: 2,
        },
      });

      // Microphone permission granted
      setMicPermissionGranted(true);

      // Set up audio context to analyze microphone input
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(micStream);
      const analyzer = audioContext.createAnalyser();
      analyzer.fftSize = 256;
      source.connect(analyzer);

      // Play test tone to help initialize audio system
      playTestTone(audioContext);

      // Track if we've detected audio during the test
      let hasDetectedSound = false;
      const testStartTime = Date.now();
      const TEST_DURATION = 3000; // 3 seconds test

      // Set a timeout to end the test after 3 seconds
      microphoneTestTimeout.current = setTimeout(() => {
        // If we haven't detected sound yet, microphone might not be working
        if (!hasDetectedSound) {
          console.log("No microphone input detected during test");
          setMicrophoneTestResult("not-working");
        }

        // Clean up
        micStream.getTracks().forEach((track) => track.stop());
        setIsMicrophoneTesting(false);

        if (microphoneTestTimeout.current) {
          clearTimeout(microphoneTestTimeout.current);
          microphoneTestTimeout.current = null;
        }
      }, TEST_DURATION);

      // Monitor audio levels during the test period
      const checkAudioLevel = () => {
        if (!isMicrophoneTesting || Date.now() - testStartTime > TEST_DURATION)
          return;

        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyzer.getByteFrequencyData(dataArray);

        // Calculate average level
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          sum += dataArray[i] || 0;
        }

        const average = sum / bufferLength;
        setAudioLevel(average);

        // Lower threshold for detection during test
        const threshold = 2.0;

        // If audio detected, mark the microphone as working
        if (average > threshold) {
          hasDetectedSound = true;
          setMicrophoneTestResult("working");
          console.log(`Microphone working! Level: ${average.toFixed(1)}`);

          // Once we've confirmed it's working, we can end the test early
          if (microphoneTestTimeout.current) {
            clearTimeout(microphoneTestTimeout.current);
            microphoneTestTimeout.current = null;
          }

          // But continue updating the audio level for visual feedback
          setTimeout(() => {
            micStream.getTracks().forEach((track) => track.stop());
            setIsMicrophoneTesting(false);
          }, 1000);
        }

        // Continue checking if we're still testing
        if (isMicrophoneTesting) {
          requestAnimationFrame(checkAudioLevel);
        }
      };

      // Start the audio level monitoring
      checkAudioLevel();

      // Prompt the user to make some noise
      toast.info("Please speak or make noise to test your microphone", {
        duration: 3000,
      });
    } catch (error) {
      console.error("Microphone test error:", error);

      // Handle permission denied
      if (
        (error as Error).name === "NotAllowedError" ||
        (error as Error).name === "PermissionDeniedError"
      ) {
        setMicrophoneTestResult("denied");
        setMicPermissionGranted(false);
      } else {
        setMicrophoneTestResult("not-working");
        setErrorMessage("Could not access microphone for testing");
      }

      setIsMicrophoneTesting(false);
    }
  };

  /**
   * Requests microphone permission programmatically
   */
  const requestMicrophoneAccess = async () => {
    try {
      // Reset states
      setErrorMessage(null);

      console.log("Requesting microphone access programmatically...");

      // Request microphone with minimal constraints to increase chances of approval
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // If we get here, permission was granted
      console.log("✓ Microphone permission granted");
      setMicPermissionGranted(true);

      // Stop the stream immediately, we just needed the permission
      stream.getTracks().forEach((track) => track.stop());

      // Now test the microphone to confirm it's working
      testMicrophone();
    } catch (error) {
      console.error("Failed to get microphone permission:", error);

      // Handle permission errors
      if (
        (error as Error).name === "NotAllowedError" ||
        (error as Error).name === "PermissionDeniedError"
      ) {
        setMicrophoneTestResult("denied");
        toast.error(
          "Microphone permission was denied. Please check your browser settings and try again.",
        );
      } else {
        setErrorMessage(`Microphone access error: ${(error as Error).message}`);
      }
    }
  };

  /**
   * Switches from Web Speech API to transformers.js when errors occur
   */
  const switchToTransformersJs = async (stream: MediaStream) => {
    console.log(
      "Switching from Web Speech API to transformers.js due to errors",
    );

    // First stop any existing Web Speech processes
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }

    // Preserve any existing transcription
    const _existingText = transcriptionTextRef.current;

    // Add a note about the switch
    transcriptionTextRef.current +=
      "\n\n[Switching to alternative transcription method...]\n\n";

    // Update state
    setUsingWebSpeechAPI(false);
    setIsModelLoading(true);

    try {
      // Load the Whisper model if not already loaded
      if (!transcriber) {
        console.log("Loading transformers.js model...");
        const whisperPipeline = await pipeline(
          "automatic-speech-recognition",
          "Xenova/whisper-tiny.en",
        );

        console.log("Whisper pipeline loaded:", whisperPipeline);

        // Ensure the pipeline is properly initialized
        if (typeof whisperPipeline === "function") {
          setTranscriber(whisperPipeline);
        } else if (
          whisperPipeline &&
          typeof (whisperPipeline as any).__call__ === "function"
        ) {
          setTranscriber((input: any) =>
            (whisperPipeline as any).__call__(input),
          );
        } else if (
          whisperPipeline &&
          typeof (whisperPipeline as any).call === "function"
        ) {
          setTranscriber((input: any) => (whisperPipeline as any).call(input));
        } else {
          throw new Error("Invalid pipeline initialization");
        }
      }

      // Set up a new MediaRecorder with the stream
      const mediaRecorder = new MediaRecorder(stream);
      screenMediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      // Set up event handlers for the media recorder
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      // Start recording
      mediaRecorder.start(1000); // Collect data every second

      // Show toast notification about the switch
      toast.info(
        "Switched to alternative transcription method due to issues with speech recognition.",
      );
    } catch (error) {
      console.error("Failed to switch to transformers.js:", error);
      setErrorMessage(
        "Failed to switch transcription methods. Please try again.",
      );
      onCancel();
    } finally {
      setIsModelLoading(false);
    }
  };

  /**
   * Starts screen capture including audio for a meeting
   * First checks microphone if not already verified
   */
  const startScreenCapture = async () => {
    // If we haven't tested the microphone yet or it was previously not working, test it first
    if (microphoneTestResult !== "working" && !isMicrophoneTesting) {
      testMicrophone();
      return;
    }

    try {
      audioChunksRef.current = [];
      transcriptionTextRef.current = "";
      setIsScreenCapturing(true);
      setErrorMessage(null);
      setHasDetectedAudio(false);
      setAudioLevel(0);

      // Reset the permission request state
      setShowMicPermissionRequest(false);

      console.log(
        "Browser detection - Arc:",
        isArcBrowser.current,
        "User agent:",
        navigator.userAgent,
      );

      // Set up permissions and get combined stream
      const combinedStream = await setupPermissions();

      if (!combinedStream) {
        console.log("Permission setup incomplete or cancelled");
        return;
      }

      // Store stream for cleanup
      screenStreamRef.current = combinedStream;

      // For Arc browser or when using transformers.js explicitly
      if (isArcBrowser.current || !usingWebSpeechAPI) {
        // Use Transformers.js for transcription via recording
        const mediaRecorder = new MediaRecorder(combinedStream);
        screenMediaRecorderRef.current = mediaRecorder;

        mediaRecorder.addEventListener("dataavailable", (event) => {
          audioChunksRef.current.push(event.data);
        });

        mediaRecorder.addEventListener("stop", () => {
          setIsScreenCapturing(false);

          try {
            const videoBlob = new Blob(audioChunksRef.current, {
              type: "video/webm",
            });

            // Extract audio from video for transcription
            extractAudioAndTranscribe(videoBlob);
          } catch (error) {
            console.error("Video processing error:", error);
            setErrorMessage("Error processing video. Please try again.");
            onCancel();
          } finally {
            // Stop all tracks from the stream
            if (screenStreamRef.current) {
              screenStreamRef.current
                .getTracks()
                .forEach((track) => track.stop());
              screenStreamRef.current = null;
            }
          }
        });

        // Set a reasonable time slice for data collection (1 second)
        mediaRecorder.start(1000);
      } else {
        // Use Web Speech API for transcription with combined audio
        startWebSpeechTranscription(combinedStream);
      }
    } catch (error: unknown) {
      console.error("Permission error:", error);
      const permissionError = error as Error;
      if (
        permissionError.name === "NotAllowedError" ||
        permissionError.name === "PermissionDeniedError"
      ) {
        setErrorMessage(
          "Permission to access screen and audio was denied. Please grant both screen sharing and audio permissions when prompted.",
        );
      } else {
        setErrorMessage(`Screen capture error: ${permissionError.message}`);
      }
      setIsScreenCapturing(false);
      onCancel();
    }
  };

  /**
   * Initializes SpeechRecognition with optimal settings
   */
  const initSpeechRecognition = () => {
    const SpeechRecognition =
      (window as any).SpeechRecognition ||
      (window as any).webkitSpeechRecognition ||
      (window as any).mozSpeechRecognition ||
      (window as any).msSpeechRecognition;

    if (!SpeechRecognition) {
      console.error("SpeechRecognition not supported in this browser");
      return null;
    }

    const recognition = new SpeechRecognition();

    // Arc-specific configuration - Fix 3
    if (isArcBrowser.current) {
      console.log("Configuring SpeechRecognition specifically for Arc browser");
      recognition.continuous = false; // Arc works better with non-continuous mode
      recognition.interimResults = true;
      recognition.maxAlternatives = 1; // Reduce complexity for Arc

      // Explicitly set English for Arc
      recognition.lang = "en-US";

      // Add custom properties that might help with Arc
      try {
        recognition.interimResultsTimeout = 5000;
      } catch (e) {
        console.log("Could not set custom property", e);
      }
    } else {
      // Standard configuration for other browsers
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.maxAlternatives = 3;
      recognition.lang = "en-US";
    }

    return recognition;
  };

  /**
   * Uses Web Speech API for transcription with improved handling
   */
  const startWebSpeechTranscription = (stream: MediaStream) => {
    try {
      console.log("Starting Web Speech API transcription");
      console.log("Audio tracks in stream:", stream.getAudioTracks().length);
      transcriptionTextRef.current = "";
      setNetworkStatus("stable");
      setHasDetectedAudio(false);

      // Add browser detection info to transcript for debugging - Fix 4
      transcriptionTextRef.current = `Transcription starting in ${isArcBrowser.current ? "Arc" : "standard"} browser mode...\n\n`;

      // For Arc browser, we need to add an extra delay - Fix 4
      if (isArcBrowser.current) {
        console.log("Adding Arc-specific delay before recognition start");
        // Play test tone immediately for Arc
        const audioContext = new AudioContext();
        playTestTone(audioContext);

        setTimeout(() => initRecognitionForArc(stream), 1000);
      } else {
        initStandardRecognition(stream);
      }
    } catch (error) {
      console.error("Error setting up Web Speech API:", error);
      setErrorMessage(
        "Speech recognition failed. Trying alternative method...",
      );
      switchToTransformersJs(stream);
    }
  };

  // Arc-specific recognition initialization - Fix 4
  const initRecognitionForArc = (stream: MediaStream) => {
    // Create a new audio context specifically for Arc
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);

    // Log detailed info about input audio tracks for debugging
    console.log("Arc: Setting up WebSpeech with audio tracks:");
    stream.getAudioTracks().forEach((track, i) => {
      console.log(
        `Track ${i}: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}`,
      );
      // Ensure tracks are enabled
      track.enabled = true;
    });

    // Initialize Speech Recognition with Arc-specific settings
    const recognition = initSpeechRecognition();
    if (!recognition) {
      throw new Error("Speech recognition not available in Arc");
    }

    recognitionRef.current = recognition;

    // Set up event handlers similar to the standard approach
    // Listen for results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      // Reset network status on results
      setNetworkStatus("stable");
      setHasDetectedAudio(true);

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result?.[0]) continue;

        const transcript = result[0]?.transcript || "";

        if (result.isFinal) {
          finalTranscript += transcript + " ";
          console.log(`Final: "${transcript}"`);
        } else {
          interimTranscript += transcript;
        }
      }

      // Update transcription text
      if (finalTranscript) {
        // Remove initial helper message if present
        if (transcriptionTextRef.current.startsWith("Transcription starting")) {
          transcriptionTextRef.current = finalTranscript;
        } else {
          transcriptionTextRef.current += finalTranscript;
        }

        console.log(
          `Current text (${transcriptionTextRef.current.length} chars)`,
        );
      }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn(`Arc: Speech recognition error: ${event.error}`);

      if (event.error === "audio-capture" || event.error === "network") {
        // For Arc, these errors often require switching to transformers.js
        console.error("Critical Arc error, switching to transformers.js");
        switchToTransformersJs(stream);
        return;
      }
    };

    // Handle when recognition ends
    recognition.onend = () => {
      console.log("Arc: Speech recognition ended");

      // For Arc, short restart delay
      if (isScreenCapturing) {
        setTimeout(() => {
          if (isScreenCapturing) {
            console.log("Arc: Restarting speech recognition");
            try {
              recognition.start();
            } catch (e) {
              console.error("Failed to restart Arc recognition:", e);
            }
          }
        }, 300);
      }
    };

    // For Arc, explicitly connect audio to ensure it's active
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);

    // For Arc, play test tone again right before starting recognition
    playTestTone(audioContext);

    // Start recognition with a slight delay
    setTimeout(() => {
      try {
        recognition.start();
        console.log("Arc: Web Speech recognition explicitly started");
      } catch (e) {
        console.error("Failed to start recognition in Arc:", e);
      }
    }, 500);
  };

  // Standard recognition initialization for other browsers
  const initStandardRecognition = (stream: MediaStream) => {
    // Create a new audio context
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);

    // Log detailed info about input audio tracks
    console.log("Setting up Web Speech API with audio tracks:");
    stream.getAudioTracks().forEach((track, i) => {
      console.log(
        `Track ${i}: ${track.label}, enabled: ${track.enabled}, muted: ${track.muted}, state: ${track.readyState}`,
      );

      // Ensure tracks are enabled
      track.enabled = true;
    });

    // Set up an audio analyzer to detect if audio is being captured
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    source.connect(analyzer);

    // Initialize Speech Recognition with optimized settings
    const recognition = initSpeechRecognition();
    if (!recognition) {
      throw new Error("Speech recognition not available");
    }

    recognitionRef.current = recognition;

    // Keep track of recognition state
    let isRecognitionRunning = false;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    let backoffTime = 1000; // Start with 1s backoff

    // Listen for results
    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimTranscript = "";
      let finalTranscript = "";

      // Reset network status on results
      setNetworkStatus("stable");
      setHasDetectedAudio(true);
      reconnectAttempts = 0; // Reset reconnect counter when we get results
      backoffTime = 1000; // Reset backoff timer

      // Process all results
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (!result?.[0]) continue;

        const transcript = result[0]?.transcript || "";

        if (result.isFinal) {
          finalTranscript += transcript + " ";
          console.log(`Final: "${transcript}"`);
        } else {
          interimTranscript += transcript;
        }
      }

      // Update transcription text
      if (finalTranscript) {
        // Remove initial helper message if present
        if (transcriptionTextRef.current.startsWith("Transcription starting")) {
          transcriptionTextRef.current = finalTranscript;
        } else {
          transcriptionTextRef.current += finalTranscript;
        }

        console.log(
          `Current text (${transcriptionTextRef.current.length} chars)`,
        );
      }
    };

    // Handle errors
    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.warn(`Speech recognition error: ${event.error}`);

      // Handle different error types
      switch (event.error) {
        case "network":
          setNetworkStatus("unstable");
          // Network errors need careful handling
          try {
            if (isRecognitionRunning) {
              recognition.stop();
              isRecognitionRunning = false;
            }

            // Use exponential backoff
            setTimeout(() => {
              if (isScreenCapturing) {
                console.log(
                  `Restarting after network error (backoff: ${backoffTime}ms)`,
                );
                recognition.start();
                isRecognitionRunning = true;
                backoffTime = Math.min(backoffTime * 2, 10000); // Max 10s backoff
              }
            }, backoffTime);
          } catch (e) {
            console.error("Failed to recover from network error:", e);
          }
          break;

        case "no-speech":
          // No speech is normal, just continue
          console.log("No speech detected, continuing");
          break;

        case "aborted":
          // Aborted is usually intentional, don't treat as error
          console.log("Recognition aborted");
          break;

        case "audio-capture":
          // Audio capture errors often mean permission issues
          console.error("Audio capture error - check microphone permissions");
          break;

        case "not-allowed":
        case "service-not-allowed":
          // Permission errors
          console.error(`Permission error: ${event.error}`);
          setErrorMessage("Microphone access was denied or revoked.");
          break;

        default:
          if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
            // Switch to transformers.js after too many errors
            console.error("Too many recognition errors, switching methods");
            switchToTransformersJs(stream);
            return;
          }
      }
    };

    // Handle when recognition ends
    recognition.onend = () => {
      console.log("Speech recognition ended");
      isRecognitionRunning = false;

      // Standard browser handling - restart if still capturing
      if (isScreenCapturing && reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
        try {
          setTimeout(() => {
            if (isScreenCapturing) {
              console.log(
                `Restarting speech recognition (attempt ${reconnectAttempts + 1}/${MAX_RECONNECT_ATTEMPTS})`,
              );
              recognition.start();
              isRecognitionRunning = true;
              reconnectAttempts++;
            }
          }, 500);
        } catch (e) {
          console.error("Failed to restart recognition:", e);
        }
      } else if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
        console.error("Max reconnection attempts reached");
        setNetworkStatus("disconnected");

        // Add a message to the transcript
        transcriptionTextRef.current +=
          "\n\n[Speech recognition disconnected. Switching to alternative method...]";

        // Switch to transformers.js
        switchToTransformersJs(stream);
      }
    };

    // Start recognition
    recognition.start();
    isRecognitionRunning = true;
    console.log("Web Speech recognition started");

    // Connect audio source to keep the audio context alive
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);
  };

  /**
   * Extracts audio from video blob and starts transcription
   */
  const extractAudioAndTranscribe = async (videoBlob: Blob) => {
    try {
      // Extract the audio as a separate blob
      console.log("Extracting audio from video blob...");
      const audioBlob = await extractAudioFromVideo(videoBlob);
      console.log("Audio extracted, size:", audioBlob.size);

      if (audioBlob.size === 0) {
        throw new Error("Extracted audio is empty");
      }

      // Transcribe the audio
      await transcribeAudio(audioBlob);
    } catch (error) {
      console.error("Error extracting audio or transcribing:", error);

      // Check if Web Speech API is available as fallback
      if (isWebSpeechAPISupported() && !usingWebSpeechAPI) {
        console.log(
          "Transformers.js failed, trying to switch to Web Speech API",
        );
        setErrorMessage("Trying alternative transcription method...");

        // Try to restart with Web Speech API if we still have the stream
        if (screenStreamRef.current) {
          setUsingWebSpeechAPI(true);
          startWebSpeechTranscription(screenStreamRef.current);
          return;
        }
      }

      // If we can't recover, show error
      setErrorMessage("Error processing audio. Please try again.");
      setIsTranscribing(false);
      onCancel();
    }
  };

  /**
   * Helper function to extract audio from video blob
   */
  const extractAudioFromVideo = async (videoBlob: Blob): Promise<Blob> => {
    return new Promise((resolve, reject) => {
      try {
        // Create video element to load the blob
        const video = document.createElement("video");
        video.src = URL.createObjectURL(videoBlob);
        video.muted = true;

        // Create audio context for extraction
        const audioContext = new AudioContext();
        const destination = audioContext.createMediaStreamDestination();
        const source = audioContext.createMediaElementSource(video);
        source.connect(destination);

        // Create a media recorder to capture the audio
        const mediaRecorder = new MediaRecorder(destination.stream);
        const audioChunks: Blob[] = [];

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunks.push(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
          resolve(audioBlob);
        };

        // Start recording and playback
        mediaRecorder.start();
        video.play();

        // Stop when video reaches the end
        video.onended = () => {
          mediaRecorder.stop();
          video.remove();
        };

        // Set a timeout just in case the video doesn't end
        setTimeout(() => {
          if (mediaRecorder.state === "recording") {
            mediaRecorder.stop();
          }
        }, 30000); // 30 seconds max
      } catch (error) {
        console.error("Error extracting audio:", error);
        reject(error);
      }
    });
  };

  /**
   * Transcribes audio using transformers.js
   */
  const transcribeAudio = async (audioBlob: Blob) => {
    console.log("Starting transformers.js transcription...");
    setIsTranscribing(true);

    // Local variable to hold the transcriber function
    let transcriptionFunction: ((input: any) => Promise<any>) | null = null;

    // Check if transcriber is available, if not, try to load it
    if (!transcriber) {
      try {
        console.log(
          "Transcriber not available, loading transformers.js model...",
        );
        const whisperPipeline = await pipeline(
          "automatic-speech-recognition",
          "Xenova/whisper-tiny.en",
        );

        // Setup transcriber based on pipeline type
        if (typeof whisperPipeline === "function") {
          setTranscriber(whisperPipeline);
          transcriptionFunction = whisperPipeline;
        } else if (
          whisperPipeline &&
          typeof (whisperPipeline as any).__call__ === "function"
        ) {
          const caller = (input: any) =>
            (whisperPipeline as any).__call__(input);
          setTranscriber(caller);
          transcriptionFunction = caller;
        } else if (
          whisperPipeline &&
          typeof (whisperPipeline as any).call === "function"
        ) {
          const caller = (input: any) => (whisperPipeline as any).call(input);
          setTranscriber(caller);
          transcriptionFunction = caller;
        } else {
          throw new Error("Invalid pipeline initialization");
        }
      } catch (error) {
        console.error("Failed to load transformers.js model:", error);
        throw new Error("Transcription model could not be loaded");
      }
    } else {
      // Use the existing transcriber
      transcriptionFunction = transcriber;
    }

    if (!transcriptionFunction || typeof transcriptionFunction !== "function") {
      console.error(
        "Transcriber not properly initialized:",
        transcriptionFunction,
      );
      throw new Error("Transcription model is not properly initialized");
    }

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();
      const audioData = new Uint8Array(arrayBuffer);
      console.log(
        "Starting transcription with audio data length:",
        audioData.length,
      );

      // Run transcription with proper error handling
      let result;
      try {
        console.log("Calling transcriber function with audio data...");
        result = await transcriptionFunction(audioData);
        console.log("Transcription result:", result);
      } catch (error) {
        console.error("Transcription execution error:", error);
        throw error;
      }

      // Handle different result formats
      let text: string | undefined;
      if (result && typeof result.text === "string") {
        text = result.text;
      } else if (Array.isArray(result) && result.length > 0) {
        text = result.map((r) => r.text || "").join(" ");
      } else if (typeof result === "string") {
        text = result;
      }

      console.log("Extracted transcription text:", text);

      // Pass the transcribed text to the caller
      if (text) {
        console.log("Calling onTranscriptionComplete with text:", text);
        await onTranscriptionComplete(text);
        console.log("onTranscriptionComplete finished");
      } else {
        console.error("No text extracted from transcription result");
        throw new Error("Transcription failed to produce readable text");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      throw error;
    } finally {
      setIsTranscribing(false);
    }
  };

  /**
   * Stops screen capturing
   */
  const stopScreenCapture = () => {
    if (usingWebSpeechAPI) {
      console.log("Stopping Web Speech API recording");
      // Stop Web Speech API recognition
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }

      // Stop screen capture stream
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      // Set state for completion
      setIsScreenCapturing(false);

      // Process accumulated text
      let finalTranscriptionText = transcriptionTextRef.current;

      // Remove the initial helper message if it's still there
      if (finalTranscriptionText.startsWith("Transcription starting")) {
        const afterHelperText = finalTranscriptionText.split("\n\n")[1];
        if (afterHelperText) {
          finalTranscriptionText = afterHelperText;
        } else {
          finalTranscriptionText = "";
        }
      }

      // Cleanup any unnecessary whitespace
      finalTranscriptionText = finalTranscriptionText.trim();

      console.log("Final transcription text:", finalTranscriptionText);

      // Complete with the accumulated text
      if (finalTranscriptionText) {
        console.log("Web Speech accumulated text:", finalTranscriptionText);
        onTranscriptionComplete(finalTranscriptionText);
      } else {
        console.error("No transcription was produced by Web Speech API");

        if (!hasDetectedAudio) {
          toast.error(
            "No audio was detected during the recording. Please check your microphone and audio settings.",
            { duration: 5000 },
          );
        } else {
          toast.error(
            "No speech was detected or transcribed. Please try again or enter the transcription manually.",
            { duration: 5000 },
          );
        }

        // Instead of immediately canceling, show manual input option
        setHasAutoTranscriptionFailed(true);
        setShowManualInput(true);
      }
    } else if (screenMediaRecorderRef.current && isScreenCapturing) {
      console.log("Stopping Transformers.js recording");
      // Stop media recorder for Transformers.js approach
      screenMediaRecorderRef.current.stop();
      setIsScreenCapturing(false);
      setIsTranscribing(true);

      // Process the recorded audio
      const videoBlob = new Blob(audioChunksRef.current, {
        type: "video/webm",
      });
      console.log("Recorded video blob size:", videoBlob.size);
      if (videoBlob.size === 0) {
        setErrorMessage(
          "No audio was recorded. Please ensure your audio is enabled when sharing your screen.",
        );
        setIsTranscribing(false);
        onCancel();
        return;
      }

      // Extract audio and transcribe
      extractAudioAndTranscribe(videoBlob).catch((error) => {
        console.error("Error processing audio:", error);
        setErrorMessage("Error processing audio. Please try again.");
        setIsTranscribing(false);
        onCancel();
      });
    }
  };

  /**
   * Handles the submission of manual transcription
   */
  const handleSubmitManualTranscription = async () => {
    if (!manualTranscription || manualTranscription.trim() === "") {
      toast.error("Please enter some text before submitting");
      return;
    }

    try {
      console.log("Submitting manual transcription:", manualTranscription);
      await onTranscriptionComplete(manualTranscription.trim());
    } catch (error) {
      console.error("Error saving manual transcription:", error);
      setErrorMessage("Failed to save manual transcription");
    }
  };

  /**
   * Cancels the transcription and cleans up
   */
  const handleCancelManualTranscription = () => {
    setShowManualInput(false);
    setManualTranscription("");
    onCancel();
  };

  // Handle error display
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  // Clean up timeouts when component unmounts
  useEffect(() => {
    return () => {
      if (microphoneTestTimeout.current) {
        clearTimeout(microphoneTestTimeout.current);
      }

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  if (isModelLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#4A90E2]" />
        <span className="text-sm text-[#607D8B]">
          Loading transcription model...
        </span>
      </div>
    );
  }

  return (
    <div className="p-4">
      {isModelLoading ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#4A90E2]" />
          <span className="text-sm text-[#607D8B]">
            Loading transcription model...
          </span>
        </div>
      ) : isMicrophoneTesting ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2 text-[#607D8B]">
            <Mic className="h-5 w-5 animate-pulse text-blue-500" />
            <span>Testing microphone...</span>
          </div>

          <div className="w-full rounded-md border border-[#E0E0E0] bg-white p-4 text-sm dark:border-slate-600 dark:bg-slate-800">
            <p className="mb-2 font-medium text-[#424242] dark:text-slate-300">
              Microphone Test:
            </p>

            {/* Audio level meter */}
            <div className="mt-3">
              <p className="mb-1 text-sm font-medium">Audio Level:</p>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all ${microphoneTestResult === "working" ? "bg-green-500" : "bg-amber-500"}`}
                  style={{
                    width: `${Math.min(audioLevel * 5, 100)}%`,
                    transitionProperty: "width",
                    transitionDuration: "300ms",
                  }}
                ></div>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>No Audio</span>
                <span>Detection Threshold</span>
                <span>Full Volume</span>
              </div>
            </div>

            <div className="mt-4 text-center">
              <p className="text-[#607D8B] dark:text-slate-400">
                Please speak or make some noise to test your microphone.
              </p>
            </div>
          </div>

          <Button
            size="sm"
            variant="outline"
            onClick={() => {
              if (microphoneTestTimeout.current) {
                clearTimeout(microphoneTestTimeout.current);
              }
              setIsMicrophoneTesting(false);
            }}
          >
            Cancel Test
          </Button>
        </div>
      ) : showMicPermissionRequest && !isScreenCapturing ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm dark:border-red-800 dark:bg-red-900/30">
            <h3 className="mb-2 font-medium text-red-800 dark:text-red-600">
              Microphone Access Denied
            </h3>
            <p className="mb-3 text-red-700 dark:text-red-500">
              To record and transcribe your meeting, we need permission to
              access your microphone.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={requestMicrophoneAccess}
                className="bg-[#4A90E2] text-white hover:bg-[#357ABD]"
              >
                <Mic className="mr-2 h-4 w-4" />
                Grant Microphone Access
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowManualInput(true)}
              >
                Enter Transcription Manually
              </Button>
            </div>
            <div className="mt-3 rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="mb-2 font-medium">
                If permission dialog doesn&apos;t appear:
              </p>
              <ol className="ml-4 list-decimal space-y-1 text-[#607D8B] dark:text-slate-400">
                <li>Click the lock icon or microphone icon in the URL bar</li>
                <li>Toggle permission to &apos;Allow&apos; for this site</li>
                <li>Refresh the page and try again</li>
              </ol>
            </div>
          </div>
        </div>
      ) : !isScreenCapturing &&
        !isTranscribing &&
        !showManualInput &&
        microphoneTestResult === "not-working" ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm dark:border-amber-800 dark:bg-amber-900/30">
            <h3 className="mb-2 font-medium text-amber-800 dark:text-amber-600">
              Microphone Not Working
            </h3>
            <p className="mb-3 text-amber-700 dark:text-amber-500">
              We couldn&apos;t detect any audio from your microphone. The
              microphone may be muted or not properly connected.
            </p>
            <div className="flex flex-col gap-3">
              <Button
                onClick={testMicrophone}
                className="bg-[#4A90E2] text-white hover:bg-[#357ABD]"
              >
                <Mic className="mr-2 h-4 w-4" />
                Test Microphone Again
              </Button>
              <Button
                variant="outline"
                onClick={() => {
                  // Force proceed with screen capture despite microphone issues
                  setMicrophoneTestResult("working");
                  startScreenCapture();
                }}
              >
                Continue Anyway
              </Button>
              <Button
                variant="outline"
                onClick={() => setShowManualInput(true)}
              >
                Enter Transcription Manually
              </Button>
            </div>
            <div className="mt-3 rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-800">
              <p className="mb-2 font-medium">Troubleshooting tips:</p>
              <ol className="ml-4 list-decimal space-y-1 text-[#607D8B] dark:text-slate-400">
                <li>Check if your microphone is muted</li>
                <li>
                  Make sure the correct microphone is selected in your device
                  settings
                </li>
                <li>Try speaking louder or moving closer to the microphone</li>
                <li>Restart your browser and try again</li>
              </ol>
            </div>
          </div>
        </div>
      ) : isScreenCapturing ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2 text-[#607D8B]">
            <Mic className="h-5 w-5 animate-pulse text-red-500" />
            <span>
              {isArcBrowser.current
                ? "Recording with transformers.js..."
                : usingWebSpeechAPI
                  ? "Recording with Web Speech API..."
                  : "Recording in progress..."}
            </span>
          </div>

          <div className="w-full rounded-md border border-[#E0E0E0] bg-white p-3 text-sm dark:border-slate-600 dark:bg-slate-800">
            <p className="mb-2 font-medium text-[#424242] dark:text-slate-300">
              Status:
            </p>
            <p className="text-[#607D8B] dark:text-slate-400">
              {isArcBrowser.current ? (
                <>
                  <span className="mb-1 block">
                    • Capturing audio from your screen
                  </span>
                  <span className="block">
                    • Will transcribe when recording stops
                  </span>
                  {hasDetectedAudio ? (
                    <span className="mt-2 block text-green-500">
                      • Audio detected ✓
                    </span>
                  ) : (
                    <span className="mt-2 block text-amber-500">
                      • Waiting for audio... (Check your audio settings)
                    </span>
                  )}
                </>
              ) : usingWebSpeechAPI ? (
                <>
                  <span className="mb-1 block">
                    • Capturing audio from your screen
                  </span>
                  <span className="block">
                    • Converting speech to text in real-time
                  </span>
                  {networkStatus !== "stable" && (
                    <span
                      className={`mt-2 block font-medium ${networkStatus === "unstable" ? "text-amber-500" : "text-red-500"}`}
                    >
                      {networkStatus === "unstable"
                        ? "• Network issues detected, trying to recover..."
                        : "• Network disconnected, transcription may be incomplete"}
                    </span>
                  )}
                  {hasDetectedAudio ? (
                    <span className="mt-2 block text-green-500">
                      • Audio detected ✓
                    </span>
                  ) : (
                    <span className="mt-2 block text-amber-500">
                      • Waiting for audio... (Check your audio settings)
                    </span>
                  )}
                </>
              ) : (
                <>
                  <span className="mb-1 block">• Recording screen audio</span>
                  <span className="block">
                    • Will transcribe when recording stops
                  </span>
                  {hasDetectedAudio ? (
                    <span className="mt-2 block text-green-500">
                      • Audio detected ✓
                    </span>
                  ) : (
                    <span className="mt-2 block text-amber-500">
                      • Waiting for audio... (Check your audio settings)
                    </span>
                  )}
                </>
              )}
            </p>

            {/* Add audio level meter */}
            <div className="mt-3">
              <p className="mb-1 text-sm font-medium">Audio Level:</p>
              <div className="h-4 w-full overflow-hidden rounded-full bg-gray-200 dark:bg-gray-700">
                <div
                  className={`h-full rounded-full transition-all ${hasDetectedAudio ? "bg-green-500" : "bg-amber-500"}`}
                  style={{
                    width: `${Math.min(audioLevel * 5, 100)}%`,
                    transitionProperty: "width",
                    transitionDuration: "300ms",
                  }}
                ></div>
              </div>
              <div className="mt-1 flex justify-between text-xs text-gray-500">
                <span>No Audio</span>
                <span>{`Detection Threshold (${isArcBrowser.current ? "Low" : "Normal"})`}</span>
                <span>Full Volume</span>
              </div>
            </div>

            <div className="mt-3 space-y-1">
              <p className="font-medium text-[#424242] dark:text-slate-300">
                Instructions:
              </p>
              <ul className="list-disc pl-5 text-[#607D8B] dark:text-slate-400">
                <li>
                  Make sure to enable &quot;Share audio&quot; in the screen
                  sharing dialog
                </li>
                <li>Speak clearly into your microphone</li>
                <li>Click &quot;Stop Recording&quot; when finished</li>
              </ul>
            </div>

            {/* Arc browser specific UI - showing transformers.js is being used */}
            {isArcBrowser.current && (
              <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                <p className="mb-2 font-medium text-blue-600 dark:text-blue-500">
                  Arc Browser: Using transformers.js for optimal compatibility
                </p>
                <p className="text-[#607D8B] dark:text-slate-400">
                  For Arc browser, we&apos;re using an optimized offline
                  transcription method. The transcription will process when you
                  stop recording.
                </p>
              </div>
            )}

            {/* Existing troubleshooting UI - only show for non-Arc browsers */}
            {!hasDetectedAudio && !isArcBrowser.current && (
              <div className="mt-3 border-t border-gray-200 pt-3 dark:border-gray-700">
                <p className="mb-2 font-medium text-amber-600 dark:text-amber-500">
                  Audio Troubleshooting:
                </p>
                <ul className="list-disc pl-5 text-[#607D8B] dark:text-slate-400">
                  <li>
                    Ensure &apos;Share system audio&apos; is checked in the
                    sharing dialog
                  </li>
                  <li>Play some audio on your device to test detection</li>
                  <li>Check that your microphone is not muted</li>
                  <li>
                    Try playing loud audio or speaking loudly to help trigger
                    detection
                  </li>
                  <li>
                    Some browsers require specific settings for audio capture
                  </li>
                </ul>
                <div className="mt-3">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      // Force set has detected audio to true to bypass the check
                      setHasDetectedAudio(true);
                      toast.success(
                        "Audio detection bypassed. Proceeding with recording.",
                      );
                    }}
                  >
                    Force Enable Audio Detection
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={stopScreenCapture}
              className="flex items-center gap-1"
            >
              <StopCircle className="h-4 w-4" />
              <span>Stop Recording</span>
            </Button>
          </div>
        </div>
      ) : isTranscribing ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#4A90E2]" />
          <span className="text-sm text-[#607D8B]">Transcribing audio...</span>
        </div>
      ) : showManualInput ? (
        <div className="flex flex-col space-y-4">
          {hasAutoTranscriptionFailed && (
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 text-sm dark:border-amber-800 dark:bg-amber-900/30">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg
                    className="h-5 w-5 text-amber-400 dark:text-amber-500"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path
                      fillRule="evenodd"
                      d="M8.485 2.495c.673-1.167 2.357-1.167 3.03 0l6.28 10.875c.673 1.167-.17 2.625-1.516 2.625H3.72c-1.347 0-2.189-1.458-1.515-2.625L8.485 2.495zM10 5a.75.75 0 01.75.75v4.5a.75.75 0 01-1.5 0v-4.5A.75.75 0 0110 5zm0 10a1 1 0 100-2 1 1 0 000 2z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-amber-800 dark:text-amber-600">
                    Automatic transcription failed
                  </h3>
                  <div className="mt-1 text-sm text-amber-700 dark:text-amber-500">
                    <p>
                      Audio transcription couldn&apos;t be completed. You can
                      manually enter your transcription below.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#424242] dark:text-slate-300">
              Enter meeting transcription:
            </label>
            <Textarea
              placeholder="Type or paste your meeting transcription here..."
              className="min-h-[150px]"
              value={manualTranscription}
              onChange={(e) => setManualTranscription(e.target.value)}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancelManualTranscription}
            >
              Cancel
            </Button>
            <Button
              size="sm"
              onClick={handleSubmitManualTranscription}
              className="bg-[#4A90E2] text-white hover:bg-[#357ABD]"
            >
              Save Transcription
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center space-y-4">
          <p className="text-center text-sm text-[#607D8B] dark:text-slate-400">
            Choose how you want to capture the meeting transcription:
          </p>
          <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
            <Button
              onClick={() => {
                setHasAutoTranscriptionFailed(false);
                // Start with microphone test instead of directly starting screen capture
                testMicrophone();
              }}
              className="flex items-center gap-1 bg-[#4A90E2] text-white hover:bg-[#357ABD]"
            >
              <Mic className="h-4 w-4" />
              <span>Record Meeting Audio</span>
            </Button>
            <Button
              onClick={() => setShowManualInput(true)}
              variant="outline"
              className="flex items-center gap-1"
            >
              <Keyboard className="h-4 w-4" />
              <span>Enter Manually</span>
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
