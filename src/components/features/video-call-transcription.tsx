"use client";

import { useState, useEffect, useRef } from "react";
import { pipeline, env } from "@huggingface/transformers";
import { Button } from "~/components/ui/button";

// Configure Transformers.js environment
env.allowLocalModels = false;
// Configure ONNX runtime if available
if (env?.backends?.onnx?.wasm) {
  env.backends.onnx.wasm.numThreads = 1;
}

// Define a safer type for the Whisper pipeline
interface TranscriptionResult {
  text: string;
}

interface TranscriberMethods {
  __call__?: (audioData: Float32Array) => Promise<TranscriptionResult>;
  call?: (audioData: Float32Array) => Promise<TranscriptionResult>;
  generate?: (audioData: Float32Array) => Promise<TranscriptionResult>;
  process?: (audioData: Float32Array) => Promise<TranscriptionResult>;
  transcribe?: (audioData: Float32Array) => Promise<TranscriptionResult>;
}

// Removing unused type

/**
 * Component for real-time transcription of video call audio with screen capture
 */
export function VideoCallTranscription() {
  const [transcriber, setTranscriber] = useState<unknown>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isScreenCapturing, setIsScreenCapturing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const screenMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const modelLoadAttemptedRef = useRef(false);

  /**
   * Stops screen capturing
   */
  const stopScreenCapture = () => {
    if (screenMediaRecorderRef.current && isScreenCapturing) {
      screenMediaRecorderRef.current.stop();
    }

    // Also clean up any screen stream that might be active
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((track) => track.stop());
      screenStreamRef.current = null;
    }
  };

  /**
   * Loads the transcription model when the component mounts
   */
  useEffect(() => {
    let isMounted = true;

    const loadModel = async () => {
      if (modelLoadAttemptedRef.current) return;
      modelLoadAttemptedRef.current = true;

      try {
        setIsModelLoading(true);

        // Create pipeline with specific configuration
        // Using a more basic configuration to ensure compatibility
        const whisperPipeline = await pipeline(
          "automatic-speech-recognition",
          "Xenova/whisper-tiny.en",
        );

        // When examining the object properties, safely handle it
        const methods = Object.getOwnPropertyNames(
          Object(whisperPipeline),
        ).filter(
          (prop) =>
            typeof (Object(whisperPipeline) as Record<string, unknown>)[
              prop
            ] === "function",
        );

        console.log("Whisper Pipeline methods:", methods);

        if (isMounted) {
          setTranscriber(whisperPipeline);
          setIsModelLoading(false);
        }
      } catch (error) {
        console.error("Error loading transcription model:", error);
        if (isMounted) {
          setIsModelLoading(false);
          setErrorMessage(
            "Failed to load transcription model. Please refresh and try again.",
          );
        }
      }
    };

    // Use setTimeout to defer model loading slightly after component mount
    const timer = setTimeout(() => {
      void loadModel();
    }, 1500); // Increased timeout further to ensure DOM is fully loaded

    return () => {
      isMounted = false;
      clearTimeout(timer);
      stopScreenCapture();
    };
  }, [stopScreenCapture]);

  /**
   * Starts screen capture including audio for a video call
   */
  const startScreenCapture = async () => {
    try {
      audioChunksRef.current = [];
      setIsScreenCapturing(true);
      setErrorMessage(null);
      setTranscription("");
      setAudioUrl(null);

      // Request access to screen with audio (system audio)
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      // Request access to microphone with specific constraints to ensure high quality
      const micStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });

      // Store reference to screen stream for cleanup
      screenStreamRef.current = screenStream;

      // Set up audio processing and mixing
      const audioContext = new AudioContext();
      const dest = audioContext.createMediaStreamDestination();

      // Process screen audio if available
      if (screenStream.getAudioTracks().length > 0) {
        const screenAudio = screenStream.getAudioTracks()[0];
        // Make sure track exists before creating stream
        if (screenAudio) {
          const screenAudioStream = new MediaStream();
          screenAudioStream.addTrack(screenAudio);
          const screenSource =
            audioContext.createMediaStreamSource(screenAudioStream);
          screenSource.connect(dest);
        }
      }

      // Process microphone audio with gain boost
      if (micStream.getAudioTracks().length > 0) {
        const micAudio = micStream.getAudioTracks()[0];
        // Make sure track exists before creating stream
        if (micAudio) {
          const micAudioStream = new MediaStream();
          micAudioStream.addTrack(micAudio);
          const micSource =
            audioContext.createMediaStreamSource(micAudioStream);

          // Add gain to boost microphone volume
          const gainNode = audioContext.createGain();
          gainNode.gain.value = 1.5; // Boost mic volume
          micSource.connect(gainNode);
          gainNode.connect(dest);
        }
      }

      // Create final output stream with video and mixed audio
      const outputStream = new MediaStream();

      // Add video tracks from screen
      screenStream.getVideoTracks().forEach((track) => {
        outputStream.addTrack(track);
      });

      // Add mixed audio
      dest.stream.getAudioTracks().forEach((track) => {
        outputStream.addTrack(track);
      });

      // Set up MediaRecorder with appropriate options
      const options = { mimeType: "video/webm;codecs=vp8,opus" };
      const mediaRecorder = new MediaRecorder(outputStream, options);
      screenMediaRecorderRef.current = mediaRecorder;

      // Handle data available event
      mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      });

      // Handle recording stop
      mediaRecorder.addEventListener("stop", () => {
        setIsScreenCapturing(false);

        try {
          if (audioChunksRef.current.length === 0) {
            setErrorMessage("No audio data was captured. Please try again.");
            return;
          }

          const videoBlob = new Blob(audioChunksRef.current, {
            type: "video/webm",
          });

          // Extract audio from video for transcription
          void extractAudioAndTranscribe(videoBlob);
        } catch (error) {
          console.error("Video processing error:", error);
          setErrorMessage("Error processing video. Please try again.");
        } finally {
          // Stop all tracks
          if (screenStreamRef.current) {
            screenStreamRef.current
              .getTracks()
              .forEach((track) => track.stop());
            screenStreamRef.current = null;
          }

          micStream.getTracks().forEach((track) => track.stop());

          // Close audio context
          void audioContext.close();
        }
      });

      // Start recording
      mediaRecorder.start(1000);
    } catch (error) {
      console.error("Error starting screen capture:", error);
      setIsScreenCapturing(false);
      setErrorMessage(
        "Error accessing screen capture or microphone. Please check permissions and try again.",
      );
    }
  };

  /**
   * Extracts audio from video blob and starts transcription
   */
  const extractAudioAndTranscribe = async (videoBlob: Blob) => {
    if (!videoBlob || videoBlob.size === 0) {
      setErrorMessage("No video data available to process.");
      return;
    }

    try {
      // Create audio element to extract audio
      const videoURL = URL.createObjectURL(videoBlob);
      const audioContext = new AudioContext();
      const audioElement = new Audio(videoURL);

      // Set up audio processing
      const source = audioContext.createMediaElementSource(audioElement);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
      source.connect(audioContext.destination); // Connect to speakers as well

      // Create a new MediaRecorder for the audio
      const audioRecorder = new MediaRecorder(destination.stream);
      const audioChunks: Blob[] = [];

      audioRecorder.addEventListener("dataavailable", (event) => {
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      });

      audioRecorder.addEventListener("stop", async () => {
        if (audioChunks.length === 0) {
          setErrorMessage("No audio was extracted from the recording.");
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        if (audioBlob.size === 0) {
          setErrorMessage("Audio extraction resulted in empty data.");
          return;
        }

        const audioURL = URL.createObjectURL(audioBlob);
        setAudioUrl(audioURL);

        // Start transcription
        if (transcriber) {
          void transcribeAudio(audioBlob);
        } else {
          setErrorMessage(
            "Transcription model is not ready. Please try again later.",
          );
        }
      });

      // Start playing the video to extract audio
      audioElement.oncanplay = () => {
        audioRecorder.start(1000); // Collect data every second
        void audioElement.play();
      };

      audioElement.onended = () => {
        audioRecorder.stop();
        void audioContext.close();
        URL.revokeObjectURL(videoURL);
      };

      audioElement.onerror = () => {
        setErrorMessage("Error playing the recorded video for processing.");
        URL.revokeObjectURL(videoURL);
      };
    } catch (error) {
      console.error("Error extracting audio:", error);
      setErrorMessage("Error extracting audio from video. Please try again.");
    }
  };

  /**
   * Converts an audio blob to Float32Array format required by Whisper
   */
  const convertAudioToFloat32 = async (
    audioBlob: Blob,
  ): Promise<Float32Array> => {
    // Create an audio context
    const audioContext = new AudioContext({
      sampleRate: 16000, // Whisper expects 16kHz audio
    });

    // Convert the Blob to an ArrayBuffer
    const arrayBuffer = await audioBlob.arrayBuffer();

    // Decode the audio data
    const audioBuffer = await audioContext.decodeAudioData(arrayBuffer);

    // Get the Float32Array data from the first channel
    const audioData = audioBuffer.getChannelData(0);

    return audioData;
  };

  /**
   * Transcribes the provided audio blob
   */
  const transcribeAudio = async (audioBlob: Blob) => {
    if (!transcriber) {
      setErrorMessage("Transcription model is not loaded.");
      return;
    }

    if (!audioBlob || audioBlob.size === 0) {
      setErrorMessage("No audio data available to transcribe.");
      return;
    }

    try {
      setIsTranscribing(true);

      // Convert audio to proper format (Float32Array)
      const audioData = await convertAudioToFloat32(audioBlob);

      // Try different approaches to call the transcriber
      let result: TranscriptionResult | { text: string }[] | string | undefined;
      const trans = transcriber as unknown;

      // Prioritize methods in likely order of existence
      if (typeof trans === "function") {
        // Directly callable as a function
        result = await (
          trans as (data: Float32Array) => Promise<TranscriptionResult>
        )(audioData);
      } else if (typeof (trans as TranscriberMethods).__call__ === "function") {
        // Python-style callable
        result = await (trans as TranscriberMethods).__call__!(audioData);
      } else if (typeof (trans as TranscriberMethods).call === "function") {
        // Standard method call
        result = await (trans as TranscriberMethods).call!(audioData);
      } else if (
        typeof (trans as TranscriberMethods).transcribe === "function"
      ) {
        // Specific method for transcription
        result = await (trans as TranscriberMethods).transcribe!(audioData);
      } else if (typeof (trans as TranscriberMethods).process === "function") {
        // Generic process method
        result = await (trans as TranscriberMethods).process!(audioData);
      } else if (typeof (trans as TranscriberMethods).generate === "function") {
        // Generate method
        result = await (trans as TranscriberMethods).generate!(audioData);
      } else {
        // Last resort - recreate the pipeline
        try {
          // Re-create the pipeline for this specific call
          const tempPipeline = await pipeline(
            "automatic-speech-recognition",
            "Xenova/whisper-tiny.en",
          );

          // Try to use the newly created pipeline
          if (typeof tempPipeline === "function") {
            result = await (
              tempPipeline as (
                data: Float32Array,
              ) => Promise<TranscriptionResult>
            )(audioData);
          } else if (
            typeof (tempPipeline as TranscriberMethods).call === "function"
          ) {
            result = await (tempPipeline as TranscriberMethods).call!(
              audioData,
            );
          } else {
            throw new Error("Could not create a usable pipeline");
          }
        } catch (err) {
          throw new Error(`Error using fallback pipeline: ${String(err)}`);
        }
      }

      // Handle different result formats
      if (
        result &&
        typeof result === "object" &&
        "text" in result &&
        typeof result.text === "string"
      ) {
        setTranscription(result.text);
      } else if (result && Array.isArray(result) && result.length > 0) {
        // Handle the case where result might be an array of chunks
        const text = result
          .map((chunk) =>
            typeof chunk === "object" && "text" in chunk
              ? String(chunk.text)
              : "",
          )
          .filter(Boolean)
          .join(" ");
        setTranscription(text);
      } else if (typeof result === "string") {
        // Handle the case where result might be directly a string
        setTranscription(result);
      } else {
        throw new Error("Invalid transcription result format");
      }
    } catch (error) {
      console.error("Transcription error:", error);
      // Safely access error message property
      const errorMessage =
        error instanceof Error ? error.message : String(error);
      setErrorMessage(`Error during transcription: ${errorMessage}`);
    } finally {
      setIsTranscribing(false);
    }
  };

  if (isModelLoading) {
    return (
      <div className="bg-muted rounded-md p-4 text-center">
        <p>Loading transcription model...</p>
        <p className="text-muted-foreground mt-2 text-xs">
          This may take a moment on first visit
        </p>
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="p-4 text-center text-red-500">
        <p>{errorMessage}</p>
        <Button
          onClick={() => {
            setErrorMessage(null);
            if (errorMessage.includes("Failed to load transcription model")) {
              // Force reload the component
              window.location.reload();
            }
          }}
          variant="outline"
          className="mt-4"
        >
          Try Again
        </Button>
      </div>
    );
  }

  return (
    <div className="bg-card w-full rounded-md border p-4">
      <h3 className="mb-4 text-xl font-medium">Video Call Transcription</h3>

      <div className="mb-6 flex justify-center space-x-4">
        <Button
          onClick={startScreenCapture}
          disabled={isScreenCapturing || isTranscribing}
          variant="default"
        >
          Record Video Call (Screen + Audio)
        </Button>
        <Button
          onClick={stopScreenCapture}
          disabled={!isScreenCapturing}
          variant="default"
        >
          Stop Recording
        </Button>
      </div>

      {isScreenCapturing && (
        <div className="mb-4 text-center">
          <p className="text-sm">
            Recording video call (capturing screen, system audio, and
            microphone)...
          </p>
        </div>
      )}

      {audioUrl && (
        <div className="mb-4">
          <p className="mb-2 font-medium">Audio Preview:</p>
          <audio src={audioUrl} controls className="w-full" />
        </div>
      )}

      {isTranscribing && (
        <div className="mb-4 text-center">
          <p>Transcribing audio...</p>
        </div>
      )}

      <div className="mt-4">
        <p className="mb-2 font-medium">Transcription:</p>
        <div className="bg-muted h-64 overflow-y-auto rounded-md p-4">
          {transcription ||
            "No transcription available yet. Record a video call to start. Both system audio (remote participants) and your microphone will be captured."}
        </div>
      </div>
    </div>
  );
}
