"use client";

import dynamic from "next/dynamic";

/**
 * Client component wrapper that dynamically imports the video call transcription component with SSR disabled
 */
const VideoCallTranscriptionWrapper = dynamic(
  () =>
    import("~/components/features/video-call-transcription").then((mod) => ({
      default: mod.VideoCallTranscription,
    })),
  { ssr: false },
);

export default VideoCallTranscriptionWrapper;
