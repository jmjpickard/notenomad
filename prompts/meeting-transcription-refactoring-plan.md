# Meeting Transcription Component Refactoring Plan

## Current Issues

The current `meeting-transcription.tsx` file is nearly 2000 lines long, which makes it:

- Difficult to maintain
- Hard to understand
- Challenging to test
- Prone to bugs due to complex state management

## Refactoring Strategy

We'll split the component into logical units following the separation of concerns principle:

1. Custom hooks for state and logic
2. UI components for different visual states
3. Utility functions for shared operations
4. Types for better type safety

## Directory Structure

```
src/components/transcription/
├── meeting-transcription.tsx       # Main component (orchestration)
├── use-transcription-methods.ts    # Hook for transcription logic
├── use-audio-capture.ts            # Hook for audio capturing
├── use-microphone-testing.ts       # Hook for microphone testing
├── types.ts                        # Shared TypeScript interfaces
├── components/                     # UI components
│   ├── recording-ui.tsx            # UI while recording
│   ├── microphone-test-ui.tsx      # UI for microphone testing
│   ├── transcription-status-ui.tsx # Status display during transcription
│   ├── manual-input-ui.tsx         # Manual transcription input
│   └── permission-request-ui.tsx   # Permission request UI
└── utils/                          # Helper utilities
    ├── audio-extraction.ts         # Audio extraction utilities
    ├── browser-detection.ts        # Browser detection logic
    └── transcription-utils.ts      # Shared transcription utilities
```

## Implementation Plan

### 1. Create Types (types.ts)

Extract all interfaces and types to improve type safety and documentation:

```typescript
// SpeechRecognition types omitted for brevity

export interface MeetingTranscriptionProps {
  onTranscriptionComplete: (text: string) => Promise<void>;
  onCancel: () => void;
}

export type MicrophoneTestResult =
  | "untested"
  | "working"
  | "not-working"
  | "denied";
export type NetworkStatus = "stable" | "unstable" | "disconnected";
export type BrowserType = "arc" | "standard";

export interface TranscriptionMethodsState {
  isModelLoading: boolean;
  transcriber: any | null;
  usingWebSpeechAPI: boolean;
  errorMessage: string | null;
}

// Additional types for each hook...
```

### 2. Extract Browser Detection (utils/browser-detection.ts)

```typescript
/**
 * Detects if the current browser is Arc
 */
export const isArcBrowser = (): boolean => {
  return (
    navigator.userAgent.includes("Arc") ||
    (navigator.userAgent.includes("Chrome") &&
      navigator.userAgent.includes("Apple"))
  );
};

/**
 * Checks if Web Speech API is supported
 */
export const isWebSpeechAPISupported = (): boolean => {
  return "webkitSpeechRecognition" in window || "SpeechRecognition" in window;
};
```

### 3. Extract Audio Utilities (utils/audio-extraction.ts)

```typescript
/**
 * Extracts audio from video blob
 */
export const extractAudioFromVideo = async (videoBlob: Blob): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    try {
      // Implementation...
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Plays a test tone to help initialize the audio system
 */
export const playTestTone = (audioContext: AudioContext): void => {
  try {
    // Implementation...
  } catch (err) {
    console.warn("Could not play test tone:", err);
  }
};
```

### 4. Implement Custom Hooks

#### use-transcription-methods.ts

```typescript
import { useState, useEffect } from "react";
import { pipeline } from "@huggingface/transformers";
import {
  isArcBrowser,
  isWebSpeechAPISupported,
} from "./utils/browser-detection";
import { TranscriptionMethodsState } from "./types";

export const useTranscriptionMethods = () => {
  const [state, setState] = useState<TranscriptionMethodsState>({
    isModelLoading: true,
    transcriber: null,
    usingWebSpeechAPI: false,
    errorMessage: null,
  });

  useEffect(() => {
    // Implementation of model loading logic...
  }, []);

  return {
    ...state,
    setErrorMessage: (message: string | null) =>
      setState((prev) => ({ ...prev, errorMessage: message })),
  };
};
```

#### use-microphone-testing.ts

```typescript
import { useState, useRef } from "react";
import { toast } from "sonner";
import { MicrophoneTestResult } from "./types";
import { playTestTone } from "./utils/audio-extraction";

interface MicrophoneTestingOptions {
  onError: (message: string | null) => void;
}

export const useMicrophoneTesting = ({ onError }: MicrophoneTestingOptions) => {
  const [isMicrophoneTesting, setIsMicrophoneTesting] = useState(false);
  const [microphoneTestResult, setMicrophoneTestResult] =
    useState<MicrophoneTestResult>("untested");
  const [audioLevel, setAudioLevel] = useState<number>(0);
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const microphoneTestTimeout = useRef<NodeJS.Timeout | null>(null);

  // Implementation of testMicrophone function
  const testMicrophone = async () => {
    // Implementation...
  };

  // Implementation of requestMicrophoneAccess function
  const requestMicrophoneAccess = async () => {
    // Implementation...
  };

  return {
    isMicrophoneTesting,
    microphoneTestResult,
    audioLevel,
    micPermissionGranted,
    testMicrophone,
    requestMicrophoneAccess,
  };
};
```

### 5. Implement UI Components

#### components/microphone-test-ui.tsx

```typescript
import { Mic } from "lucide-react";
import { Button } from "~/components/ui/button";
import { MicrophoneTestResult } from "../types";

interface MicrophoneTestUIProps {
  audioLevel: number;
  microphoneTestResult: MicrophoneTestResult;
  onCancel: () => void;
}

export const MicrophoneTestUI = ({
  audioLevel,
  microphoneTestResult,
  onCancel,
}: MicrophoneTestUIProps) => {
  return (
    <div className="flex flex-col items-center space-y-4">
      {/* UI implementation... */}
    </div>
  );
};
```

### 6. Refactor Main Component

The main component will orchestrate the hooks and UI components:

```typescript
// meeting-transcription.tsx
"use client";

import { useState } from "react";
import { useTranscriptionMethods } from "./use-transcription-methods";
import { useAudioCapture } from "./use-audio-capture";
import { useMicrophoneTesting } from "./use-microphone-testing";
import { MicrophoneTestUI } from "./components/microphone-test-ui";
// Additional imports...

export const MeetingTranscription = ({
  onTranscriptionComplete,
  onCancel,
}: MeetingTranscriptionProps) => {
  // State management
  const [showManualInput, setShowManualInput] = useState(false);
  const [hasAutoTranscriptionFailed, setHasAutoTranscriptionFailed] = useState(false);
  const [manualTranscription, setManualTranscription] = useState<string>("");

  // Custom hooks
  const {
    isModelLoading,
    transcriber,
    usingWebSpeechAPI,
    errorMessage,
    setErrorMessage
  } = useTranscriptionMethods();

  // Additional hooks...

  // Functions for handling manual transcription
  const handleSubmitManualTranscription = async () => {
    // Implementation...
  };

  const handleCancelManualTranscription = () => {
    // Implementation...
  };

  // Render appropriate UI based on current state
  if (isModelLoading) {
    return <LoadingUI />;
  }

  if (isMicrophoneTesting) {
    return (
      <MicrophoneTestUI
        audioLevel={audioLevel}
        microphoneTestResult={microphoneTestResult}
        onCancel={() => setIsMicrophoneTesting(false)}
      />
    );
  }

  // Additional rendering logic...
};
```

## Benefits of This Approach

1. **Maintainability**: Each file has a single responsibility, making it easier to understand and modify
2. **Testability**: Isolated logic in hooks and utilities can be unit tested independently
3. **Reusability**: Hooks and utilities can be reused in other components
4. **Readability**: Smaller files are easier to read and understand
5. **Collaboration**: Multiple developers can work on different parts simultaneously

## Implementation Strategy

1. Create the directory structure
2. Extract types first to establish a foundation
3. Extract utility functions that don't depend on state
4. Implement custom hooks one by one
5. Create UI components
6. Refactor the main component last

This approach allows for incremental refactoring and testing at each step.
