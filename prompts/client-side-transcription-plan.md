# Client-Side Transcription Implementation Plan Using Transformers.js

## Overview

This document outlines a detailed implementation plan for adding client-side audio transcription capabilities to our NextJS application using Hugging Face's Transformers.js library. This approach runs the transcription model entirely in the user's browser, providing several advantages:

- **Cost**: Completely free (no API costs)
- **Privacy**: Audio data never leaves the user's device
- **Offline capability**: Works without internet after initial model download
- **Integration**: Seamless integration with our NextJS application

## Implementation Steps

### 1. Project Configuration

First, we need to update our NextJS configuration to properly support Transformers.js:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Disable node-specific modules
      sharp$: false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};

export default nextConfig;
```

### 2. Dependencies Installation

Install the required packages:

```bash
npm install @huggingface/transformers
```

### 3. Transcription Component

Create a reusable transcription component:

```tsx
// src/components/ui/transcription.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { pipeline, env } from "@huggingface/transformers";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Set the model location
env.allowLocalModels = false;

/**
 * Component for transcribing audio from a user's microphone
 */
export function Transcription() {
  const [transcriber, setTranscriber] = useState<any>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Load the transcription model
  useEffect(() => {
    const loadModel = async () => {
      try {
        // 'Xenova/whisper-tiny.en' is a good balance between size and accuracy for English
        const transcriber = await pipeline(
          "automatic-speech-recognition",
          "Xenova/whisper-tiny.en",
        );
        setTranscriber(transcriber);
        setIsModelLoading(false);
      } catch (error) {
        console.error("Error loading transcription model:", error);
      }
    };

    loadModel();

    // Cleanup function
    return () => {
      if (mediaRecorderRef.current && isRecording) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  /**
   * Starts recording audio from the user's microphone
   */
  const startRecording = async () => {
    if (!transcriber) return;

    try {
      audioChunksRef.current = [];
      setIsRecording(true);

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener("dataavailable", (event) => {
        audioChunksRef.current.push(event.data);
      });

      mediaRecorder.addEventListener("stop", async () => {
        setIsRecording(false);
        setIsProcessing(true);

        try {
          const audioBlob = new Blob(audioChunksRef.current, {
            type: "audio/webm",
          });

          // Convert blob to array buffer
          const arrayBuffer = await audioBlob.arrayBuffer();

          // Run transcription
          const result = await transcriber(new Uint8Array(arrayBuffer));
          setTranscription(result.text);
        } catch (error) {
          console.error("Transcription error:", error);
        } finally {
          setIsProcessing(false);

          // Stop all tracks from the stream
          stream.getTracks().forEach((track) => track.stop());
        }
      });

      mediaRecorder.start();
    } catch (error) {
      console.error("Error starting recording:", error);
      setIsRecording(false);
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

  return (
    <Card className="mx-auto w-full max-w-md">
      <CardHeader>
        <CardTitle>Audio Transcription</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isModelLoading ? (
            <p className="text-center">Loading transcription model...</p>
          ) : (
            <>
              <div className="flex justify-center space-x-4">
                <Button
                  onClick={startRecording}
                  disabled={isRecording || isProcessing}
                  variant="default"
                >
                  Start Recording
                </Button>
                <Button
                  onClick={stopRecording}
                  disabled={!isRecording || isProcessing}
                  variant="secondary"
                >
                  Stop Recording
                </Button>
              </div>

              <div className="bg-muted mt-4 min-h-24 rounded-md p-3">
                {isProcessing ? (
                  <p className="text-center">Processing audio...</p>
                ) : (
                  <p>{transcription || "Transcription will appear here..."}</p>
                )}
              </div>
            </>
          )}
        </div>
      </CardContent>
      <CardFooter className="text-muted-foreground text-xs">
        <p>Audio is processed locally and never leaves your device.</p>
      </CardFooter>
    </Card>
  );
}
```

### 4. Integration with Video Calls

For our video call transcription, we'll need to:

1. Capture the audio stream from the call
2. Process it in chunks for real-time transcription
3. Display the results alongside the video call

```tsx
// src/components/features/video-call-transcription.tsx
"use client";

import { useState, useEffect, useRef } from "react";
import { pipeline, env } from "@huggingface/transformers";

env.allowLocalModels = false;

interface VideoCallTranscriptionProps {
  audioStream: MediaStream; // Audio stream from the video call
}

/**
 * Component for real-time transcription of video call audio
 */
export function VideoCallTranscription({
  audioStream,
}: VideoCallTranscriptionProps) {
  const [transcriber, setTranscriber] = useState<any>(null);
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [transcription, setTranscription] = useState("");
  const [isTranscribing, setIsTranscribing] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const processingInterval = useRef<NodeJS.Timeout | null>(null);

  // Load the transcription model
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
      }
    };

    loadModel();

    return () => {
      if (processingInterval.current) {
        clearInterval(processingInterval.current);
      }
      if (mediaRecorderRef.current && isTranscribing) {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  // Start transcribing when audio stream is available and model is loaded
  useEffect(() => {
    if (audioStream && transcriber && !isTranscribing) {
      startTranscribing();
    }

    return () => {
      stopTranscribing();
    };
  }, [audioStream, transcriber]);

  /**
   * Starts transcribing the audio stream in chunks
   */
  const startTranscribing = () => {
    if (!audioStream || !transcriber) return;

    try {
      setIsTranscribing(true);

      const chunks: Blob[] = [];
      const mediaRecorder = new MediaRecorder(audioStream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.addEventListener("dataavailable", async (event) => {
        chunks.push(event.data);

        // Process the last few seconds of audio
        if (chunks.length > 0) {
          const audioBlob = new Blob(chunks, { type: "audio/webm" });
          const arrayBuffer = await audioBlob.arrayBuffer();

          try {
            const result = await transcriber(new Uint8Array(arrayBuffer));
            setTranscription(result.text);

            // Keep only the last 3 chunks to avoid memory issues
            while (chunks.length > 3) {
              chunks.shift();
            }
          } catch (error) {
            console.error("Transcription error:", error);
          }
        }
      });

      // Start recording in 3-second chunks
      mediaRecorder.start(3000);
    } catch (error) {
      console.error("Error starting transcription:", error);
      setIsTranscribing(false);
    }
  };

  /**
   * Stops the ongoing transcription
   */
  const stopTranscribing = () => {
    if (mediaRecorderRef.current && isTranscribing) {
      mediaRecorderRef.current.stop();
      setIsTranscribing(false);
    }

    if (processingInterval.current) {
      clearInterval(processingInterval.current);
      processingInterval.current = null;
    }
  };

  if (isModelLoading) {
    return (
      <div className="bg-muted rounded-md p-4">
        Loading transcription model...
      </div>
    );
  }

  return (
    <div className="bg-card w-full rounded-md border p-4">
      <h3 className="mb-2 font-medium">Live Transcription</h3>
      <div className="bg-muted h-32 overflow-y-auto rounded-md p-2">
        {transcription || "Waiting for speech..."}
      </div>
    </div>
  );
}
```

### 5. Creating a Demo Page

Let's create a simple page to test our transcription component:

```tsx
// src/app/transcription/page.tsx
import { Transcription } from "@/components/ui/transcription";

export const metadata = {
  title: "Audio Transcription - NoteNomad",
  description: "Transcribe audio to text directly in your browser",
};

export default function TranscriptionPage() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Audio Transcription</h1>
          <p className="text-muted-foreground">
            Transcribe audio to text directly in your browser
          </p>
        </div>

        <Transcription />

        <div className="text-muted-foreground mt-8 text-center text-sm">
          <p>
            This transcription is powered by Hugging Face's Transformers.js and
            runs entirely in your browser. Your audio never leaves your device,
            ensuring complete privacy.
          </p>
        </div>
      </div>
    </div>
  );
}
```

### 6. Optimizing for Production

For production use, we need to optimize our setup:

1. **Model Caching**: Implement proper caching strategies for the transcription model
2. **Progressive Loading**: Show appropriate loading states during model download
3. **Error Handling**: Implement robust error handling for all possible failure points

### 7. Future Enhancements

Once the basic implementation is complete, we can consider these enhancements:

1. **Multiple Languages**: Support for languages beyond English
2. **Accuracy Improvements**: Use larger models when needed for higher accuracy
3. **Transcription Management**: Save and manage transcriptions within the app
4. **Speaker Diarization**: Identify different speakers in the transcription
5. **Real-time Caption Display**: Show captions in real-time during video calls

## Technical Considerations

### Model Selection

For our implementation, we use `Xenova/whisper-tiny.en` which is a good balance of:

- Size: ~150MB, reasonable for web download
- Speed: Fast enough for near real-time transcription
- Accuracy: Good for clear English speech

For higher accuracy at the cost of size, consider:

- `Xenova/whisper-small.en`: Better accuracy, ~500MB
- `Xenova/whisper-base.en`: Good general purpose, ~250MB

### Browser Compatibility

This implementation should work on modern browsers that support:

- WebAssembly
- MediaRecorder API
- Web Audio API

Older browsers may not be compatible.

### Performance Considerations

1. **Initial Load Time**: The first load requires downloading the model (~150MB for tiny)
2. **Memory Usage**: The model requires significant RAM when active
3. **CPU Usage**: Transcription is CPU-intensive and may affect performance

## Implementation Timeline

1. **Week 1**: Setup and configuration

   - Update NextJS config
   - Install dependencies
   - Create basic transcription component

2. **Week 2**: Core functionality

   - Implement audio recording
   - Connect with Transformers.js
   - Test basic transcription

3. **Week 3**: Integration and optimization

   - Integrate with video call features
   - Optimize performance
   - Implement error handling

4. **Week 4**: Testing and refinement
   - User testing
   - Address feedback
   - Documentation

## Conclusion

This implementation plan provides a comprehensive approach to adding client-side transcription capabilities to our NextJS application using Transformers.js. By processing audio directly in the browser, we can offer free, private, and offline-capable transcription services without relying on external APIs.
