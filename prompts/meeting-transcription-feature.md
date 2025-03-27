# Meeting Transcription Feature Implementation

## Overview

This document outlines the implementation plan for adding transcription functionality to meeting items in the timeline view. The feature will allow users to start transcription of a meeting, save the transcription text to the database, and manage these transcriptions through CRUD operations.

## Requirements

1. Add a "Start Transcription" button to each meeting item in the timeline view
2. When clicked, a screen share window should pop up for the user to select a meeting tab to record
3. Audio should only be stored temporarily and deleted after transcription
4. Show a loading state in the meeting item during transcription
5. Save the transcription text to the database
6. Implement CRUD API endpoints for managing transcriptions

## Database Changes

The database already has a `transcript` field in the `Meeting` model, which we'll use to store the transcription text:

```prisma
model Meeting {
  id          String   @id @default(cuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  transcript  String?  // We'll use this existing field
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  userId      String
  // ... other fields
}
```

## Implementation Steps

### 1. Backend API (tRPC Router)

Extend the `meetingsRouter` to include transcription-related operations:

```typescript
// src/server/api/routers/meetings.ts

// Add these validation schemas
const updateTranscriptSchema = z.object({
  meetingId: z.string(),
  transcript: z.string(),
});

const getTranscriptSchema = z.object({
  meetingId: z.string(),
});

// Add these procedures to the meetingsRouter
export const meetingsRouter = createTRPCRouter({
  // ... existing procedures

  // Save transcript for a meeting
  saveTranscript: protectedProcedure
    .input(updateTranscriptSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Ensure the meeting belongs to the user
      const meeting = await ctx.db.meeting.findFirst({
        where: {
          id: input.meetingId,
          userId,
        },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      // Update the meeting with the transcript
      const updatedMeeting = await ctx.db.meeting.update({
        where: { id: input.meetingId },
        data: {
          transcript: input.transcript,
          updatedAt: new Date(),
        },
      });

      return { meeting: updatedMeeting };
    }),

  // Get transcript for a meeting
  getTranscript: protectedProcedure
    .input(getTranscriptSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Ensure the meeting belongs to the user
      const meeting = await ctx.db.meeting.findFirst({
        where: {
          id: input.meetingId,
          userId,
        },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      return { transcript: meeting.transcript };
    }),

  // Delete transcript for a meeting
  deleteTranscript: protectedProcedure
    .input(getTranscriptSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Ensure the meeting belongs to the user
      const meeting = await ctx.db.meeting.findFirst({
        where: {
          id: input.meetingId,
          userId,
        },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      // Update the meeting to remove the transcript
      const updatedMeeting = await ctx.db.meeting.update({
        where: { id: input.meetingId },
        data: {
          transcript: null,
          updatedAt: new Date(),
        },
      });

      return { meeting: updatedMeeting };
    }),
});
```

### 2. Frontend Components

#### 2.1 Transcription Component with Fallback Mechanism

Create a reusable transcription component that can be used in the meeting item, with fallback to Web Speech API if Transformers.js is not supported:

```typescript
// src/components/ui/meeting-transcription.tsx
"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "~/components/ui/button";
import { Loader2, Mic, StopCircle } from "lucide-react";
import { toast } from "sonner";
import { pipeline } from "@huggingface/transformers";

interface MeetingTranscriptionProps {
  onTranscriptionComplete: (text: string) => Promise<void>;
  onCancel: () => void;
}

/**
 * Component for transcribing meeting audio from screen capture
 */
export function MeetingTranscription({
  onTranscriptionComplete,
  onCancel,
}: MeetingTranscriptionProps) {
  const [isModelLoading, setIsModelLoading] = useState(true);
  const [transcriber, setTranscriber] = useState<any>(null);
  const [isScreenCapturing, setIsScreenCapturing] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [usingWebSpeechAPI, setUsingWebSpeechAPI] = useState(false);

  // Refs for media handling
  const audioChunksRef = useRef<Blob[]>([]);
  const screenMediaRecorderRef = useRef<MediaRecorder | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const transcriptionTextRef = useRef<string>("");

  // Check if Web Speech API is supported
  const isWebSpeechAPISupported = () => {
    return 'webkitSpeechRecognition' in window || 'SpeechRecognition' in window;
  };

  // Load the transcription model
  useEffect(() => {
    const loadModel = async () => {
      try {
        setIsModelLoading(true);

        // First try to load Transformers.js with Whisper
        try {
          // Load the Whisper model for transcription
          // Start with the tiny model for faster loading, can be changed to larger models for more accuracy
          const whisperPipeline = await pipeline(
            "automatic-speech-recognition",
            "Xenova/whisper-tiny.en",
            { quantized: true },
          );
          setTranscriber(whisperPipeline);
          setUsingWebSpeechAPI(false);
        } catch (error) {
          console.error("Failed to load Transformers.js model:", error);

          // If Transformers.js fails, check if Web Speech API is available as fallback
          if (isWebSpeechAPISupported()) {
            console.log("Using Web Speech API as fallback");
            setUsingWebSpeechAPI(true);
          } else {
            throw new Error("No transcription methods are available in this browser");
          }
        }
      } catch (error) {
        console.error("Failed to initialize transcription:", error);
        setErrorMessage("Failed to initialize transcription. Please try again or use a different browser.");
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

  /**
   * Starts screen capture including audio for a meeting
   */
  const startScreenCapture = async () => {
    try {
      audioChunksRef.current = [];
      transcriptionTextRef.current = "";
      setIsScreenCapturing(true);
      setErrorMessage(null);

      // Request access to screen with audio
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: true,
      });

      screenStreamRef.current = screenStream;

      if (usingWebSpeechAPI) {
        // Use Web Speech API for transcription
        startWebSpeechTranscription(screenStream);
      } else {
        // Use Transformers.js for transcription via recording
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
      }
    } catch (error) {
      console.error("Error starting screen capture:", error);
      setIsScreenCapturing(false);
      setErrorMessage(
        "Error accessing screen capture. Please check permissions and try again.",
      );
      onCancel();
    }
  };

  /**
   * Uses Web Speech API for transcription
   */
  const startWebSpeechTranscription = (stream: MediaStream) => {
    try {
      // Create a new audio context
      const audioContext = new AudioContext();
      const source = audioContext.createMediaStreamSource(stream);

      // Initialize Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;

      // Configure recognition
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Default to English

      // Listen for results
      recognition.onresult = (event) => {
        for (let i = event.resultIndex; i < event.results.length; i++) {
          if (event.results[i].isFinal) {
            transcriptionTextRef.current += event.results[i][0].transcript + " ";
          }
        }
      };

      // Handle errors
      recognition.onerror = (event) => {
        console.error("Speech recognition error", event.error);
        setErrorMessage(`Speech recognition error: ${event.error}`);
      };

      // Start recognition
      recognition.start();

      // Connect audio source to keep the audio context alive
      const destination = audioContext.createMediaStreamDestination();
      source.connect(destination);
    } catch (error) {
      console.error("Error setting up Web Speech API:", error);
      setErrorMessage("Error setting up speech recognition. Please try again.");
      onCancel();
    }
  };

  /**
   * Extracts audio from video blob and starts transcription
   */
  const extractAudioAndTranscribe = async (videoBlob: Blob) => {
    if (!videoBlob || videoBlob.size === 0) {
      setErrorMessage("No video data available to process.");
      onCancel();
      return;
    }

    try {
      setIsTranscribing(true);
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
        if (event.data && event.data.size > 0) {
          audioChunks.push(event.data);
        }
      });

      audioRecorder.addEventListener("stop", async () => {
        if (audioChunks.length === 0) {
          setErrorMessage("No audio was extracted from the recording.");
          onCancel();
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: "audio/webm" });
        if (audioBlob.size === 0) {
          setErrorMessage("Audio extraction resulted in empty data.");
          onCancel();
          return;
        }

        // Start transcription
        if (transcriber) {
          transcribeAudio(audioBlob);
        } else {
          setErrorMessage("Transcription model is not ready. Please try again later.");
          onCancel();
        }
      });

      // Start playing the video to extract audio
      audioElement.oncanplay = () => {
        audioRecorder.start(1000); // Collect data every second
        audioElement.play();
      };

      audioElement.onended = () => {
        audioRecorder.stop();
        URL.revokeObjectURL(videoURL);
      };
    } catch (error) {
      console.error("Error extracting audio:", error);
      setErrorMessage("Error extracting audio from video. Please try again.");
      setIsTranscribing(false);
      onCancel();
    }
  };

  /**
   * Transcribes the provided audio blob using Transformers.js
   */
  const transcribeAudio = async (audioBlob: Blob) => {
    if (!transcriber) {
      setErrorMessage("Transcription model is not loaded.");
      onCancel();
      return;
    }

    try {
      const arrayBuffer = await audioBlob.arrayBuffer();

      // Run transcription
      const result = await transcriber(new Uint8Array(arrayBuffer));

      // Pass the transcribed text to the caller
      if (result && result.text) {
        await onTranscriptionComplete(result.text);
      } else {
        setErrorMessage("Transcription failed to produce readable text.");
        onCancel();
      }
    } catch (error) {
      console.error("Transcription error:", error);
      setErrorMessage("Error during transcription. Please try again.");
      onCancel();
    } finally {
      setIsTranscribing(false);
    }
  };

  /**
   * Stops screen capturing
   */
  const stopScreenCapture = () => {
    if (usingWebSpeechAPI) {
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

      // Complete with the accumulated text
      if (transcriptionTextRef.current) {
        onTranscriptionComplete(transcriptionTextRef.current);
      } else {
        setErrorMessage("No transcription was produced.");
        onCancel();
      }
    } else if (screenMediaRecorderRef.current && isScreenCapturing) {
      // Stop media recorder for Transformers.js approach
      screenMediaRecorderRef.current.stop();
    }
  };

  // Handle error display
  useEffect(() => {
    if (errorMessage) {
      toast.error(errorMessage);
    }
  }, [errorMessage]);

  // Start screen capture when component mounts
  useEffect(() => {
    if (!isModelLoading && (transcriber || usingWebSpeechAPI) && !isScreenCapturing && !isTranscribing) {
      startScreenCapture();
    }
  }, [isModelLoading, transcriber, usingWebSpeechAPI]);

  if (isModelLoading) {
    return (
      <div className="flex items-center justify-center p-4">
        <Loader2 className="h-5 w-5 animate-spin text-[#4A90E2] mr-2" />
        <span className="text-sm text-[#607D8B]">Loading transcription model...</span>
      </div>
    );
  }

  return (
    <div className="p-4">
      {isScreenCapturing ? (
        <div className="flex flex-col items-center space-y-4">
          <div className="flex items-center space-x-2 text-[#607D8B]">
            <Mic className="h-5 w-5 text-red-500 animate-pulse" />
            <span>
              {usingWebSpeechAPI ? "Recording with Web Speech API..." : "Recording in progress..."}
            </span>
          </div>
          <Button
            size="sm"
            variant="destructive"
            onClick={stopScreenCapture}
            className="flex items-center gap-1"
          >
            <StopCircle className="h-4 w-4" />
            <span>Stop Recording</span>
          </Button>
        </div>
      ) : isTranscribing ? (
        <div className="flex items-center justify-center p-4">
          <Loader2 className="h-5 w-5 animate-spin text-[#4A90E2] mr-2" />
          <span className="text-sm text-[#607D8B]">Transcribing audio...</span>
        </div>
      ) : null}
    </div>
  );
}
```

#### 2.2 Update TimelineMeetingItem

Update the TimelineMeetingItem component to include the transcription functionality:

```typescript
// src/components/notes/TimelineMeetingItem.tsx

// Add these imports
import { useState } from "react";
import { api } from "~/trpc/react";
import { MeetingTranscription } from "~/components/ui/meeting-transcription";
import { Button } from "~/components/ui/button";
import { Mic, FileText, Loader2, X } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "~/components/ui/dialog";

interface TimelineMeetingItemProps {
  // ... existing props
}

export const TimelineMeetingItem = ({
  // ... existing props
}: TimelineMeetingItemProps) => {
  // ... existing state variables
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);

  // tRPC mutations
  const saveTranscriptMutation = api.meetings.saveTranscript.useMutation({
    onSuccess: () => {
      toast.success("Transcription saved successfully");
      setIsTranscribing(false);
      trpc.meetings.getMeetingsByDate.invalidate({
        date: format(date, "yyyy-MM-dd"),
      });
    },
    onError: () => {
      toast.error("Failed to save transcription");
      setIsTranscribing(false);
    },
  });

  // Get transcript query
  const { data: transcriptData, refetch: refetchTranscript } =
    api.meetings.getTranscript.useQuery(
      { meetingId: id },
      { enabled: showTranscript }
    );

  /**
   * Starts the transcription process
   */
  const handleStartTranscription = () => {
    setIsTranscribing(true);
  };

  /**
   * Cancels the transcription process
   */
  const handleCancelTranscription = () => {
    setIsTranscribing(false);
  };

  /**
   * Handles transcription completion
   */
  const handleTranscriptionComplete = async (text: string) => {
    try {
      await saveTranscriptMutation.mutateAsync({
        meetingId: id,
        transcript: text,
      });
    } catch (error) {
      console.error("Error saving transcription:", error);
    }
  };

  /**
   * Displays the transcript
   */
  const handleViewTranscript = () => {
    setShowTranscript(true);
    setIsTranscriptLoading(true);
    refetchTranscript().finally(() => {
      setIsTranscriptLoading(false);
    });
  };

  /**
   * Deletes the transcript
   */
  const handleDeleteTranscript = async () => {
    try {
      await api.meetings.deleteTranscript.mutate({ meetingId: id });
      toast.success("Transcription deleted");
      setShowTranscript(false);
      trpc.meetings.getMeetingsByDate.invalidate({
        date: format(date, "yyyy-MM-dd"),
      });
    } catch (error) {
      toast.error("Failed to delete transcription");
    }
  };

  // ... existing code

  // Add to the return JSX in the CardFooter section:
  return (
    <Card className={cardClassName}>
      {/* ... existing card content */}

      <CardFooter className="flex items-center justify-between pt-0 pb-3">
        <button
          className="flex items-center gap-1 text-sm text-[#607D8B] hover:text-[#2C3E50] dark:text-slate-400 dark:hover:text-slate-300"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>

        <div className="flex items-center gap-2">
          {meetingLink && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 border-[#4A90E2] text-[#4A90E2] hover:bg-[#F5F5F5] hover:text-[#2C3E50] dark:border-[#4A90E2] dark:text-[#4A90E2] dark:hover:bg-slate-800 dark:hover:text-slate-300"
              onClick={handleJoinMeeting}
            >
              <Video className="h-4 w-4" />
              <span>Join</span>
              <ExternalLink className="ml-1 h-3 w-3" />
            </Button>
          )}

          {/* Transcription buttons */}
          {transcriptData?.transcript ? (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 border-[#4A90E2] text-[#4A90E2] hover:bg-[#F5F5F5] hover:text-[#2C3E50] dark:border-[#4A90E2] dark:text-[#4A90E2] dark:hover:bg-slate-800 dark:hover:text-slate-300"
              onClick={handleViewTranscript}
            >
              <FileText className="h-4 w-4" />
              <span>View Transcript</span>
            </Button>
          ) : (
            !isTranscribing && (
              <Button
                size="sm"
                variant="outline"
                className="flex items-center gap-1 border-[#4A90E2] text-[#4A90E2] hover:bg-[#F5F5F5] hover:text-[#2C3E50] dark:border-[#4A90E2] dark:text-[#4A90E2] dark:hover:bg-slate-800 dark:hover:text-slate-300"
                onClick={handleStartTranscription}
              >
                <Mic className="h-4 w-4" />
                <span>Transcribe</span>
              </Button>
            )
          )}

          {!isAddingNote && !editingNoteId && (
            <Button
              size="sm"
              variant="outline"
              className="flex items-center gap-1 border-[#4A90E2] text-[#4A90E2] hover:bg-[#F5F5F5] hover:text-[#2C3E50] dark:border-[#4A90E2] dark:text-[#4A90E2] dark:hover:bg-slate-800 dark:hover:text-slate-300"
              onClick={handleAddNote}
            >
              <Plus className="h-4 w-4" />
              <span>Add note</span>
            </Button>
          )}
        </div>
      </CardFooter>

      {/* Transcription dialog */}
      {isTranscribing && (
        <Dialog open={isTranscribing} onOpenChange={setIsTranscribing}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Meeting Transcription</DialogTitle>
            </DialogHeader>
            <MeetingTranscription
              onTranscriptionComplete={handleTranscriptionComplete}
              onCancel={handleCancelTranscription}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View transcript dialog */}
      <Dialog open={showTranscript} onOpenChange={setShowTranscript}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader className="flex flex-row items-center justify-between">
            <DialogTitle>Meeting Transcript</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowTranscript(false)}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogHeader>

          {isTranscriptLoading ? (
            <div className="flex items-center justify-center p-8">
              <Loader2 className="h-6 w-6 animate-spin text-[#4A90E2]" />
            </div>
          ) : (
            <div className="max-h-[60vh] overflow-y-auto">
              <div className="space-y-4">
                <div className="whitespace-pre-wrap rounded-md bg-slate-50 p-4 dark:bg-slate-900">
                  {transcriptData?.transcript}
                </div>
                <div className="flex justify-end">
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={handleDeleteTranscript}
                    className="flex items-center gap-1"
                  >
                    <span>Delete Transcript</span>
                  </Button>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};
```

## Next.js Configuration Update

Update the Next.js configuration to support the transcription library:

```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Disable node-specific modules for browser usage
      sharp$: false,
      "onnxruntime-node$": false,
    };
    return config;
  },
};

export default nextConfig;
```

## Dependencies

Add the required packages:

```bash
npm install @huggingface/transformers
```

## Performance Optimizations

### Model Loading Strategy

To improve the initial load time and user experience:

1. **Progressive Loading**: Implement a two-stage approach:

   - First, use Web Speech API for immediate transcription
   - Then load the Whisper model in the background for higher quality transcription

2. **Caching Strategy**:

   - Use IndexedDB to cache the downloaded model for faster subsequent loads
   - Add a `<link rel="preload">` tag for the model in critical pages

3. **Model Size Selection**:
   - Start with the smallest model (`Xenova/whisper-tiny.en`: ~150MB)
   - Provide an option to use larger models for higher accuracy if needed

### Audio Processing Optimizations

1. **Chunked Processing**: Process audio in small chunks rather than waiting for the entire recording
2. **Web Workers**: Move transcription to a web worker to avoid blocking the main thread
3. **Memory Management**: Clean up audio blobs and temporary files immediately after use

## Browser Compatibility

Based on our research, we need to ensure compatibility across different browsers:

1. **Primary Approach**: Transformers.js with Whisper model for modern browsers
2. **Fallback Mechanism**: Web Speech API for browsers that don't support WebGPU or have issues with Transformers.js
3. **Browser Support Matrix**:
   - Chrome (v90+): Full support
   - Edge (v90+): Full support
   - Firefox: Web Speech API fallback
   - Safari: Web Speech API fallback
   - Mobile browsers: Limited support, primarily Web Speech API

## Testing Plan

1. Test starting transcription from a meeting item
2. Verify that screen sharing dialog appears
3. Test recording from a meeting tab
4. Test the transcription process with both Transformers.js and Web Speech API fallback
5. Test saving the transcription to the database
6. Test viewing and deleting the saved transcription
7. Test in various browsers to ensure compatibility
8. Test with different meeting durations (short, medium, long)
9. Test with different audio qualities and background noise levels

## Potential Issues and Solutions

1. **Large file handling**: If meetings are lengthy, the audio files could be large.

   - Solution: Process audio in chunks and stream the processing.

2. **Browser compatibility**: Media capture APIs vary across browsers.

   - Solution: Implement Web Speech API fallback and comprehensive error handling.

3. **Transcription accuracy**: The model may struggle with accents or background noise.

   - Solution: Provide options to edit transcription before saving.

4. **Performance**: Loading the transcription model might be slow.

   - Solution: Show clear loading states, implement progressive enhancement, and use background loading.

5. **Privacy concerns**: Users might worry about their audio being processed.
   - Solution: Add clear messaging about client-side processing and temporary storage.

## Future Enhancements

1. Add support for multiple languages
2. Implement speaker diarization (identify different speakers)
3. Provide real-time transcription during meetings
4. Allow editing transcriptions before saving
5. Export transcriptions to different formats
6. Summarize transcriptions using AI
7. Provide confidence scores for transcribed sections
8. Add keyboard shortcuts for controlling transcription

## Conclusion

This implementation plan outlines the steps required to add meeting transcription functionality to the timeline view. The feature leverages client-side transcription using Hugging Face's Transformers.js library with a Web Speech API fallback for maximum browser compatibility. The approach ensures privacy by keeping all processing on the user's device, with no audio data being sent to external servers. The transcribed text is then stored in the database for future reference and can be managed through the provided CRUD operations.
