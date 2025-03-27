"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "~/components/ui/card";
import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;

/**
 * Component for video call recording and transcription
 */
export default function Transcription() {
  const [isRecording, setIsRecording] = useState(false);
  const [isScreenCapturing, setIsScreenCapturing] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [transcription, setTranscription] = useState<string>("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [transcriber, setTranscriber] = useState<any>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const screenMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const screenStreamRef = useRef<MediaStream | null>(null);

  /**
   * Loads the transcription model when the component mounts
   */
  useEffect(() => {
    const loadModel = async () => {
      try {
        const transcriber = await pipeline(
          "automatic-speech-recognition",
          "Xenova/whisper-tiny.en",
        );
        setTranscriber(transcriber);
        setIsModelLoading(false);
      } catch (error) {
        console.error("Error loading transcription model:", error);
        setErrorMessage(
          "Failed to load transcription model. Please refresh and try again.",
        );
      }
    };

    loadModel();

    return () => {
      stopAllRecordings();
    };
  }, []);

  /**
   * Starts recording audio from the user's microphone
   */
  const startRecording = async () => {
    try {
      audioChunksRef.current = [];
      setIsRecording(true);
      setErrorMessage(null);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorder.addEventListener("stop", () => {
        setIsRecording(false);

        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          // Create a URL for the audio blob
          const url = URL.createObjectURL(audioBlob);
          setAudioUrl(url);

          // Start transcription if model is loaded
          if (transcriber) {
            transcribeAudio(audioBlob);
          }
        } catch (error) {
          console.error("Audio processing error:", error);
          setErrorMessage("Error processing audio. Please try again.");
        } finally {
          // Stop all tracks from the stream
          stream.getTracks().forEach((track) => track.stop());
        }
      });

      mediaRecorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
      setErrorMessage(
        "Error accessing microphone. Please check permissions and try again.",
      );
    }
  };

  /**
   * Starts screen capture including audio for a video call
   */
  const startScreenCapture = async () => {
    try {
      audioChunksRef.current = [];
      setIsScreenCapturing(true);
      setErrorMessage(null);

      // Request access to screen with audio
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;

      // Create media recorder for the screen capture
      const mediaRecorder = new MediaRecorder(screenStream);
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

      mediaRecorder.start();
    } catch (error) {
      console.error("Error starting screen capture:", error);
      setIsScreenCapturing(false);
      setErrorMessage(
        "Error accessing screen capture. Please check permissions and try again.",
      );
    }
  };

  /**
   * Extracts audio from video blob and starts transcription
   */
  const extractAudioAndTranscribe = async (videoBlob: Blob) => {
    try {
      // Create audio element to extract audio
      const videoURL = URL.createObjectURL(videoBlob);
      const audioContext = new AudioContext();
      const audioElement = new Audio(videoURL);

      // Set up audio processing
      const source = audioContext.createMediaElementSource(audioElement);
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);

      // Create a new MediaRecorder for the audio
      const audioRecorder = new MediaRecorder(destination.stream);
      const audioChunks: Blob[] = [];

      audioRecorder.addEventListener("dataavailable", (event) => {
        audioChunks.push(event.data);
      });

      audioRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        const audioURL = URL.createObjectURL(audioBlob);
        setAudioUrl(audioURL);

        // Start transcription
        if (transcriber) {
          transcribeAudio(audioBlob);
        }
      });

      // Start playing the video to extract audio
      audioElement.oncanplay = () => {
        audioRecorder.start();
        audioElement.play();
      };

      audioElement.onended = () => {
        audioRecorder.stop();
        URL.revokeObjectURL(videoURL);
      };
    } catch (error) {
      console.error("Error extracting audio:", error);
      setErrorMessage("Error extracting audio from video. Please try again.");
    }
  };

  /**
   * Transcribes the provided audio blob
   */
  const transcribeAudio = async (audioBlob: Blob) => {
    if (!transcriber) return;

    try {
      setIsTranscribing(true);
      const arrayBuffer = await audioBlob.arrayBuffer();

      const result = await transcriber(new Uint8Array(arrayBuffer));
      setTranscription(result.text);
    } catch (error) {
      console.error("Transcription error:", error);
      setErrorMessage("Error during transcription. Please try again.");
    } finally {
      setIsTranscribing(false);
    }
  };

  /**
   * Stops the ongoing recording
   */
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  /**
   * Stops screen capturing
   */
  const stopScreenCapture = () => {
    if (screenMediaRecorderRef.current && isScreenCapturing) {
      screenMediaRecorderRef.current.stop();
    }
  };

  /**
   * Stops all active recordings
   */
  const stopAllRecordings = () => {
    stopRecording();
    stopScreenCapture();
  };

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Video Call Recording & Transcription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {errorMessage ? (
            <div className="text-center text-red-500">
              <p>{errorMessage}</p>
              <Button
                onClick={() => setErrorMessage(null)}
                variant="outline"
                className="mt-4"
              >
                Try Again
              </Button>
            </div>
          ) : (
            <>
              <div className="flex flex-col space-y-4">
                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={startRecording}
                    disabled={
                      isRecording || isScreenCapturing || isModelLoading
                    }
                    variant="default"
                  >
                    Record Microphone
                  </Button>
                  <Button
                    onClick={stopRecording}
                    disabled={!isRecording}
                    variant="default"
                  >
                    Stop Recording
                  </Button>
                </div>

                <div className="flex justify-center space-x-4">
                  <Button
                    onClick={startScreenCapture}
                    disabled={
                      isRecording || isScreenCapturing || isModelLoading
                    }
                    variant="default"
                  >
                    Record Video Call
                  </Button>
                  <Button
                    onClick={stopScreenCapture}
                    disabled={!isScreenCapturing}
                    variant="default"
                  >
                    Stop Recording
                  </Button>
                </div>
              </div>

              {isModelLoading && (
                <div className="text-center">
                  <p>Loading transcription model...</p>
                </div>
              )}

              {audioUrl && (
                <div className="mt-4">
                  <p className="mb-2 text-center">Recording Preview:</p>
                  <audio src={audioUrl} controls className="w-full" />
                </div>
              )}

              {isTranscribing && (
                <div className="mt-4 text-center">
                  <p>Transcribing audio...</p>
                </div>
              )}

              {transcription && (
                <div className="mt-4">
                  <p className="mb-2 font-medium">Transcription:</p>
                  <div className="bg-muted h-32 overflow-y-auto rounded-md p-2">
                    {transcription}
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-muted-foreground text-xs">
        <p>All processing happens locally on your device for privacy.</p>
      </CardFooter>
    </Card>
  );
}
