# Arc Browser WebSpeechAPI Troubleshooting

This document outlines fixes for WebSpeechAPI issues in Arc browser, where the speech recognition dialog doesn't appear and transcription fails.

## Key Issues with Arc Browser Implementation

1. **Arc Browser Detection**: Arc has specific quirks with WebSpeechAPI permission handling.

2. **Permission Dialog Timing**: In Arc, the microphone permission dialog sometimes doesn't appear due to timing issues.

3. **Audio Context Initialization**: There might be issues with how the audio context is being initialized in Arc.

## Recommended Fixes

### Fix 1: Improve Arc Browser Detection

```typescript
// Current implementation
const isArcBrowser = useRef(
  /Arc/.test(navigator.userAgent) ||
    (/Chrome/.test(navigator.userAgent) && /Apple/.test(navigator.userAgent)),
);

// Add after detection initialization
useEffect(() => {
  if (isArcBrowser.current) {
    console.log("Arc browser detected! Using specialized handling");
  }
}, []);
```

### Fix 2: Explicit Permission Request Before Recognition

For Arc browser, we need to explicitly request microphone permission before initializing WebSpeech:

```typescript
const requestMicrophonePermission = async () => {
  try {
    console.log("Explicitly requesting microphone permission for Arc...");

    // Try a more explicit permission request
    const constraints = {
      audio: {
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
        // Use a higher sample rate for Arc
        sampleRate: 48000,
        channelCount: 2,
      },
    };

    // Request with a timeout to ensure dialog appears
    const permissionPromise = navigator.mediaDevices.getUserMedia(constraints);

    // Create a timeout promise
    const timeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error("Permission request timed out")), 5000);
    });

    // Race the permission request against the timeout
    const stream = await Promise.race([permissionPromise, timeoutPromise]);

    // If we get here, permission was granted
    console.log("✓ Microphone permission explicitly granted for Arc");
    setMicPermissionGranted(true);

    // Play a test tone to activate audio system in Arc
    const audioContext = new AudioContext();
    playTestTone(audioContext);

    // Stop the stream after a moment
    setTimeout(() => {
      stream.getTracks().forEach((track) => track.stop());
      // Now proceed with screen capture
      startScreenCapture();
    }, 500);
  } catch (error) {
    console.error("Failed to get explicit microphone permission:", error);

    // For Arc, show a more detailed error message
    if (isArcBrowser.current) {
      toast.error(
        "Arc browser requires microphone permission for speech recognition. Please check browser settings.",
        { duration: 7000 },
      );

      // Still proceed, but show warning
      setMicPermissionGranted(false);
      startScreenCapture();
    } else {
      toast.error(
        "Microphone permission was denied. Recording without microphone.",
      );
      startScreenCapture();
    }
  }
};
```

### Fix 3: Modify Speech Recognition Initialization for Arc

The WebSpeechAPI configuration for Arc needs to be adjusted:

```typescript
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

  // Arc-specific configuration
  if (isArcBrowser.current) {
    console.log("Configuring SpeechRecognition specifically for Arc browser");
    recognition.continuous = false; // Arc works better with non-continuous mode
    recognition.interimResults = true;
    recognition.maxAlternatives = 1; // Reduce complexity for Arc

    // Explicitly set English for Arc
    recognition.lang = "en-US";

    // Add custom properties that might help with Arc
    try {
      (recognition as any).interimResultsTimeout = 5000;
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
```

### Fix 4: Modify the startWebSpeechTranscription Function for Arc

```typescript
const startWebSpeechTranscription = (stream: MediaStream) => {
  try {
    console.log("Starting Web Speech API transcription");
    console.log("Audio tracks in stream:", stream.getAudioTracks().length);
    transcriptionTextRef.current = "";
    setNetworkStatus("stable");
    setHasDetectedAudio(false);

    // Add browser detection info to transcript for debugging
    transcriptionTextRef.current = `Transcription starting in ${isArcBrowser.current ? "Arc" : "standard"} browser mode...\n\n`;

    // For Arc browser, we need to add an extra delay
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
    setErrorMessage("Speech recognition failed. Trying alternative method...");
    switchToTransformersJs(stream);
  }
};

// Arc-specific recognition initialization
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

  // Arc-specific setup continues...
  // (Rest of your recognition setup code)

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
```

### Fix 5: Add a More Explicit Microphone Permission Dialog for Arc

Add a clearer permission request UI specific to Arc:

```tsx
{
  isArcBrowser.current && showMicPermissionRequest && !isScreenCapturing ? (
    <div className="flex flex-col items-center space-y-4">
      <div className="rounded-md border border-amber-200 bg-amber-50 p-4 text-sm">
        <h3 className="mb-2 font-medium text-amber-800">
          Arc Browser: Microphone Permission Required
        </h3>
        <p className="mb-3 text-amber-700">
          Arc browser requires explicit permission for microphone access. When
          you click the button below, make sure to allow the permission dialog.
        </p>
        <div className="flex flex-col gap-3">
          <Button
            onClick={requestMicrophonePermission}
            className="bg-[#4A90E2] text-white hover:bg-[#357ABD]"
          >
            <Mic className="mr-2 h-4 w-4" />
            Grant Microphone Access
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setShowMicPermissionRequest(false);
              startScreenCapture();
            }}
          >
            Skip and Continue Anyway
          </Button>
        </div>
        <div className="mt-3 rounded border border-gray-200 bg-white p-3">
          <p className="mb-2 font-medium">If no permission dialog appears:</p>
          <ol className="ml-4 list-decimal space-y-1 text-[#607D8B]">
            <li>Click the lock icon or microphone icon in the URL bar</li>
            <li>In Arc: Click the site controls → Permissions → Microphone</li>
            <li>Toggle permission to "Allow" for this site</li>
            <li>Refresh the page and try again</li>
          </ol>
        </div>
      </div>
    </div>
  ) : null;
}
```

### Fix 6: Add Explicit Fallback for Arc

Add an explicit fallback button if WebSpeech keeps failing in Arc:

```tsx
{
  isArcBrowser.current &&
    isScreenCapturing &&
    usingWebSpeechAPI &&
    !hasDetectedAudio && (
      <div className="mt-3 border-t border-gray-200 pt-3">
        <p className="mb-2 font-medium text-amber-600">
          Arc Browser Troubleshooting:
        </p>
        <ul className="list-disc pl-5 text-[#607D8B]">
          <li>Arc may require manually enabling microphone in site settings</li>
          <li>Try clicking the site controls button in the Arc toolbar</li>
          <li>
            <Button
              size="sm"
              variant="outline"
              className="mt-1"
              onClick={() => {
                // Force switch to transformers.js for Arc
                if (screenStreamRef.current) {
                  switchToTransformersJs(screenStreamRef.current);
                }
              }}
            >
              Switch to Alternative Method
            </Button>
          </li>
        </ul>
      </div>
    );
}
```

## Summary of Issues

The key issues with Arc browser and WebSpeechAPI appear to be:

1. **Permission Handling**: Arc handles permissions differently from Chrome, requiring explicit permission requests.

2. **Recognition Configuration**: Arc works better with non-continuous recognition mode and fewer alternatives.

3. **Timing Issues**: Arc needs specific delays and audio context setup to properly initialize the speech recognition.

4. **UI Guidance**: Arc users need clearer instructions on how to enable microphone permissions.

## Implementation Notes

- These fixes focus specifically on Arc browser compatibility
- The approach uses feature detection and browser-specific code paths
- For persistent issues, consider defaulting to the Transformers.js method for Arc
