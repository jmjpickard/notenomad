import VideoCallTranscriptionWrapper from "./client-wrapper";

export const metadata = {
  title: "Video Call Transcription - NoteNomad",
  description: "Record and transcribe video calls",
};

/**
 * Page for video call recording and transcription
 */
export default function TranscriptionPage() {
  return (
    <div className="container py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="space-y-2 text-center">
          <h1 className="text-3xl font-bold">Video Call Transcription</h1>
          <p className="text-muted-foreground">
            Record and transcribe your video calls with privacy
          </p>
        </div>

        <VideoCallTranscriptionWrapper />

        <div className="text-muted-foreground mt-8 text-center text-sm">
          <p>
            This tool runs entirely in your browser. Your recordings and
            transcriptions never leave your device, ensuring complete privacy.
          </p>
          <p className="mt-2">
            To record a video call, click "Record Video Call" and select the
            browser tab or application window containing your video call.
          </p>
        </div>
      </div>
    </div>
  );
}
