"use client";

import { useState, useEffect, useRef } from "react";
import { format, isWithinInterval, isSameDay } from "date-fns";
import {
  Clock,
  MapPin,
  Plus,
  Users,
  Video,
  ExternalLink,
  Calendar,
  VideoIcon,
  X,
  Save,
  Mic,
  FileText,
  Loader2,
} from "lucide-react";
import { Button } from "~/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from "~/components/ui/card";
import { Badge } from "~/components/ui/badge";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { EnhancedNoteEditor } from "~/components/editor/EnhancedNoteEditor";
import { useTheme } from "next-themes";
import { useNoteStore } from "~/store/noteStore";
import { MeetingTranscription } from "~/components/ui/meeting-transcription";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "~/components/ui/dialog";

/**
 * Props for the TimelineMeetingItem component
 */
interface TimelineMeetingItemProps {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  location?: string | null;
  attendees?: string | null;
  notes?: { id: string; content: string; timeRef: Date }[];
  date: Date;
  onAddNote?: () => void;
  registerSaveFunction?: (
    saveFunction: (content?: string) => Promise<void>,
  ) => void;
  onNoteSaved?: (actionOrStartNewNote?: "delete" | "save" | boolean) => void;
}

/**
 * Component that displays a meeting in the timeline
 */
export const TimelineMeetingItem = ({
  id,
  title,
  description,
  startTime,
  endTime,
  location,
  attendees,
  notes = [],
  date,
  onAddNote,
  registerSaveFunction,
  onNoteSaved,
}: TimelineMeetingItemProps) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isCurrentMeeting, setIsCurrentMeeting] = useState(false);
  const [isToday, setIsToday] = useState(false);
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const { setNoteContent, getContent, markAsSaved } = useNoteStore();

  // tRPC utilities
  const trpc = api.useUtils();

  // Add transcription-related state variables
  const [isTranscribing, setIsTranscribing] = useState(false);
  const [showTranscript, setShowTranscript] = useState(false);
  const [isTranscriptLoading, setIsTranscriptLoading] = useState(false);

  // tRPC mutations
  const saveMeetingNoteMutation = api.notes.saveMeetingNote.useMutation({
    onSuccess: () => {
      // Invalidate queries to refresh data
      trpc.notes.getMeetingNote.invalidate({ meetingId: id });
      trpc.meetings.getMeetingsByDate.invalidate({
        date: format(date, "yyyy-MM-dd"),
      });
      toast.success("Meeting note saved");
    },
    onError: () => {
      toast.error("Failed to save meeting note");
    },
  });

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

  const deleteTranscriptMutation = api.meetings.deleteTranscript.useMutation({
    onSuccess: () => {
      toast.success("Transcription deleted");
      setShowTranscript(false);
      trpc.meetings.getMeetingsByDate.invalidate({
        date: format(date, "yyyy-MM-dd"),
      });
    },
    onError: () => {
      toast.error("Failed to delete transcription");
    },
  });

  // Get transcript query
  const { data: transcriptData, refetch: refetchTranscript } =
    api.meetings.getTranscript.useQuery(
      { meetingId: id },
      { enabled: showTranscript },
    );

  // Generate a note ID for the new note
  const newNoteId = `meeting-${id}-${Date.now()}`;

  // Format the meeting times
  const formattedStartTime = format(new Date(startTime), "h:mm a");
  const formattedEndTime = format(new Date(endTime), "h:mm a");
  const duration = `${formattedStartTime} - ${formattedEndTime}`;

  // Parse attendees from string to array
  const attendeeList = attendees
    ? JSON.parse(attendees).map((attendee: any) => attendee.email || attendee)
    : [];

  /**
   * Formats a list of attendees for display
   */
  const formatAttendees = (attendeesList: string[]) => {
    if (attendeesList.length === 0) return "No attendees";
    if (attendeesList.length <= 2) return attendeesList.join(", ");
    return `${attendeesList[0]}, ${attendeesList[1]}, +${
      attendeesList.length - 2
    } more`;
  };

  /**
   * Extracts meeting link from location or description if it exists
   */
  const extractMeetingLink = () => {
    // Check location first for Zoom/Teams/Meet links
    if (location) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const match = location.match(urlRegex);
      if (match && isVideoConferenceLink(match[0])) {
        return match[0];
      }
    }

    // Then check description
    if (description) {
      const urlRegex = /(https?:\/\/[^\s]+)/g;
      const match = description.match(urlRegex);
      if (match && isVideoConferenceLink(match[0])) {
        return match[0];
      }
    }

    return null;
  };

  /**
   * Check if URL is a video conference link
   */
  const isVideoConferenceLink = (url: string) => {
    return (
      url.includes("zoom.") ||
      url.includes("teams.") ||
      url.includes("meet.google.") ||
      url.includes("whereby.") ||
      url.includes("webex.")
    );
  };

  /**
   * Determines the meeting provider from the URL
   */
  const getMeetingProvider = (url: string | null) => {
    if (!url) return null;

    if (url.includes("zoom.")) return "zoom";
    if (url.includes("teams.")) return "teams";
    if (url.includes("meet.google.")) return "google";
    if (url.includes("whereby.")) return "whereby";
    if (url.includes("webex.")) return "webex";

    return "generic";
  };

  /**
   * Returns the appropriate icon component for the meeting provider
   */
  const getMeetingProviderIcon = (provider: string | null) => {
    switch (provider) {
      case "zoom":
        return <VideoIcon className="h-4 w-4 text-blue-500" />;
      case "teams":
        return <VideoIcon className="h-4 w-4 text-purple-500" />;
      case "google":
        return <VideoIcon className="h-4 w-4 text-red-500" />;
      case "whereby":
        return <VideoIcon className="h-4 w-4 text-teal-500" />;
      case "webex":
        return <VideoIcon className="h-4 w-4 text-green-500" />;
      default:
        return null;
    }
  };

  const meetingLink = extractMeetingLink();
  const provider = getMeetingProvider(meetingLink);
  const providerIcon = getMeetingProviderIcon(provider);

  /**
   * Handles creating a note for this meeting
   */
  const handleAddNote = () => {
    setIsExpanded(true);
    setIsAddingNote(true);
    setEditingNoteId(null);

    // Also call the parent's onAddNote if provided
    if (onAddNote) {
      onAddNote();
    }
  };

  /**
   * Handles editing an existing note
   */
  const handleEditNote = (noteId: string) => {
    setIsExpanded(true);
    setEditingNoteId(noteId);
    setIsAddingNote(false);
  };

  /**
   * Handles canceling the new note creation or editing
   */
  const handleCancelNote = () => {
    setIsAddingNote(false);
    setEditingNoteId(null);
  };

  /**
   * Handles when a note is saved
   */
  const handleNoteSaved = () => {
    setIsAddingNote(false);
    setEditingNoteId(null);

    // Notify parent component if callback provided
    if (onNoteSaved) {
      onNoteSaved();
    }
  };

  /**
   * Handles saving a new note or updating an existing note
   */
  const handleSaveNote = async (content?: string) => {
    try {
      // Use the provided content or get it from the store
      const editorId = editingNoteId || newNoteId;
      const validContent = content || getContent(editorId);

      if (
        !validContent ||
        validContent === '[{"type":"paragraph","content":[]}]'
      ) {
        toast.info("Cannot save empty note");
        return Promise.resolve();
      }

      // Save the meeting note via API
      await saveMeetingNoteMutation.mutateAsync({
        meetingId: id,
        content: validContent,
      });

      // Update the store to reflect saved state
      markAsSaved(editorId);

      // Update UI state
      handleNoteSaved();
      return Promise.resolve();
    } catch (error) {
      toast.error("Failed to save meeting note");
      return Promise.reject(error);
    }
  };

  /**
   * Handles content changes from the editor
   */
  const handleContentChange = (content: string, noteId: string) => {
    setNoteContent(noteId, content);
  };

  /**
   * Handles joining the meeting by opening the meeting link
   */
  const handleJoinMeeting = () => {
    if (meetingLink) {
      window.open(meetingLink, "_blank");
    } else if (location) {
      // If no video meeting link but there is a location, show a toast
      toast.info(`Meeting location: ${location}`);
    }
  };

  // Register the save function for the parent component
  useEffect(() => {
    if (registerSaveFunction && (isAddingNote || editingNoteId)) {
      registerSaveFunction(handleSaveNote);
    }
  }, [registerSaveFunction, isAddingNote, editingNoteId]);

  // Check if this meeting is currently happening
  useEffect(() => {
    const checkCurrentMeeting = () => {
      const now = new Date();
      const isNow = isWithinInterval(now, { start: startTime, end: endTime });
      setIsCurrentMeeting(isNow);
      setIsToday(isSameDay(now, startTime));
    };

    checkCurrentMeeting();
    const interval = setInterval(checkCurrentMeeting, 60000); // Check every minute

    return () => clearInterval(interval);
  }, [startTime, endTime]);

  // Determine card styling based on meeting status
  const cardClassName = isCurrentMeeting
    ? "border-[#4A90E2] bg-[#F5F5F5] shadow-md dark:border-[#4A90E2] dark:bg-slate-800"
    : meetingLink
      ? "border-[#E0E0E0] bg-[#F9F9F9] dark:border-[#607D8B] dark:bg-slate-900"
      : "border-[#E0E0E0] bg-[#F9F9F9] dark:border-[#607D8B] dark:bg-slate-900";

  /**
   * Starts the transcription process
   */
  const handleStartTranscription = () => {
    console.log("Starting transcription process for meeting:", id);
    setIsTranscribing(true);
  };

  /**
   * Cancels the transcription process
   */
  const handleCancelTranscription = () => {
    console.log("Cancelling transcription process");
    setIsTranscribing(false);
  };

  /**
   * Handles transcription completion
   */
  const handleTranscriptionComplete = async (text: string) => {
    console.log("handleTranscriptionComplete received text:", text);
    try {
      if (!text || text.trim() === "") {
        console.error("Empty transcription text received");
        toast.error("No transcription text was generated");
        setIsTranscribing(false);
        return;
      }

      // Sanitize the transcription text
      const sanitizedText = text.trim();

      console.log("Starting saveTranscriptMutation with meetingId:", id);
      const result = await saveTranscriptMutation.mutateAsync({
        meetingId: id,
        transcript: sanitizedText,
      });
      console.log("saveTranscriptMutation completed successfully:", result);

      // Show success message and close transcription dialog
      toast.success("Transcription saved successfully");

      // Close the dialog with a slight delay to ensure mutation completes
      setTimeout(() => {
        setIsTranscribing(false);

        // Show the transcript immediately after saving
        setShowTranscript(true);
        setIsTranscriptLoading(true);

        // Give the database a moment to update
        setTimeout(() => {
          refetchTranscript().finally(() => {
            setIsTranscriptLoading(false);
          });
        }, 500);
      }, 500);
    } catch (error) {
      console.error("Error saving transcription:", error);
      toast.error("Failed to save transcription. Please try again.");
      setIsTranscribing(false);
    }
  };

  /**
   * Displays the transcript
   */
  const handleViewTranscript = () => {
    setShowTranscript(true);
    setIsTranscriptLoading(true);

    // Always fetch fresh data when viewing transcript
    trpc.meetings.getTranscript.invalidate({ meetingId: id });

    refetchTranscript().finally(() => {
      setIsTranscriptLoading(false);
    });
  };

  /**
   * Deletes the transcript
   */
  const handleDeleteTranscript = async () => {
    try {
      await deleteTranscriptMutation.mutateAsync({ meetingId: id });
    } catch (error) {
      console.error("Error deleting transcription:", error);
    }
  };

  return (
    <Card className={cardClassName}>
      <CardHeader className="pb-2">
        <div className="flex flex-col space-y-1">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-[#4A90E2]" />
                  {providerIcon && (
                    <span className="mt-0.5">{providerIcon}</span>
                  )}
                </div>
                <h3 className="text-lg font-semibold text-[#2C3E50] dark:text-slate-200">
                  {title}
                </h3>
                {isCurrentMeeting && (
                  <Badge className="bg-[#4A90E2] text-white dark:bg-[#4A90E2]">
                    Now
                  </Badge>
                )}
                {meetingLink && !isCurrentMeeting && (
                  <Badge className="flex items-center gap-1 bg-[#4A90E2] text-white">
                    {provider === "google"
                      ? "Google Meet"
                      : provider === "zoom"
                        ? "Zoom"
                        : provider === "teams"
                          ? "Teams"
                          : provider === "whereby"
                            ? "Whereby"
                            : provider === "webex"
                              ? "Webex"
                              : "Video"}
                  </Badge>
                )}
              </div>
              <div className="flex items-center text-sm text-[#424242] dark:text-slate-300">
                <Clock className="mr-1 h-4 w-4" />
                <span>{duration}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {meetingLink && isCurrentMeeting && (
                <Button
                  size="sm"
                  className="flex items-center gap-1 bg-[#4A90E2] text-white hover:bg-[#357ABD] dark:bg-[#4A90E2] dark:hover:bg-[#357ABD]"
                  onClick={handleJoinMeeting}
                >
                  <Video className="h-4 w-4" />
                  <span>Join Call Now</span>
                  <ExternalLink className="ml-1 h-3 w-3" />
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-sm text-[#4A90E2] hover:text-[#2C3E50] dark:text-[#4A90E2] dark:hover:text-slate-300"
                onClick={() => setIsExpanded(!isExpanded)}
              >
                {isExpanded ? "Show less" : "Show more"}
              </Button>
            </div>
          </div>
        </div>
      </CardHeader>

      {isExpanded && (
        <CardContent className="pb-3">
          {description && (
            <div className="mb-3 text-sm">
              <p className="text-[#424242] dark:text-slate-300">
                {description}
              </p>
            </div>
          )}

          <div className="space-y-2">
            {location && (
              <div className="flex items-center text-sm text-[#424242] dark:text-slate-300">
                <MapPin className="mr-2 h-4 w-4 text-[#607D8B]" />
                <span>{location}</span>
              </div>
            )}

            {attendeeList.length > 0 && (
              <div className="flex items-center text-sm text-[#424242] dark:text-slate-300">
                <Users className="mr-2 h-4 w-4 text-[#607D8B]" />
                <span>{formatAttendees(attendeeList)}</span>
              </div>
            )}
          </div>

          {notes.length > 0 && (
            <div className="mt-4">
              <h4 className="mb-2 text-sm font-semibold text-[#2C3E50] dark:text-slate-200">
                Meeting Notes:
              </h4>
              <div className="space-y-2">
                {notes.map((note) => (
                  <div
                    key={note.id}
                    className="cursor-pointer rounded border border-[#E0E0E0] bg-white p-2 text-sm hover:border-[#4A90E2] dark:border-slate-700 dark:bg-slate-800 dark:hover:border-[#4A90E2]"
                    onClick={() => handleEditNote(note.id)}
                  >
                    {editingNoteId === note.id ? (
                      <div className="pt-2">
                        <EnhancedNoteEditor
                          id={note.id}
                          initialContent={note.content}
                          className="min-h-[200px]"
                          theme={theme}
                          onContentSaved={handleNoteSaved}
                          onContentChange={(content) =>
                            handleContentChange(content, note.id)
                          }
                        />
                      </div>
                    ) : (
                      <>
                        <div className="text-xs text-[#607D8B] dark:text-slate-400">
                          {format(new Date(note.timeRef), "h:mm a")}
                        </div>
                        <div
                          className="prose-sm mt-1 text-[#424242] dark:text-slate-300"
                          dangerouslySetInnerHTML={{ __html: note.content }}
                        />
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {isAddingNote && (
            <div className="mt-4 space-y-2">
              <h4 className="mb-2 text-sm font-semibold text-[#2C3E50] dark:text-slate-200">
                New Meeting Note:
              </h4>
              <div className="relative">
                <EnhancedNoteEditor
                  id={newNoteId}
                  initialContent=""
                  className="min-h-[200px]"
                  theme={theme}
                  onContentSaved={handleNoteSaved}
                  onContentChange={(content) =>
                    handleContentChange(content, newNoteId)
                  }
                />
              </div>
              <div className="mt-2 flex justify-end space-x-2">
                <Button
                  variant="outline"
                  onClick={handleCancelNote}
                  className="flex items-center gap-1 border-[#607D8B] text-[#607D8B] hover:bg-[#F5F5F5] dark:border-slate-600 dark:text-slate-300 dark:hover:bg-slate-800"
                >
                  <X className="h-4 w-4" />
                  <span>Cancel</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      )}

      <CardFooter className="flex items-center justify-between pt-0 pb-3">
        <button
          className="flex items-center gap-1 text-sm text-[#607D8B] hover:text-[#2C3E50] dark:text-slate-400 dark:hover:text-slate-300"
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? "Show less" : "Show more"}
        </button>

        <div className="flex items-center gap-2">
          {meetingLink && !isCurrentMeeting && (
            <Button
              size="sm"
              className="flex items-center gap-1 bg-[#4A90E2] text-white hover:bg-[#357ABD] dark:bg-[#4A90E2] dark:hover:bg-[#357ABD]"
              onClick={handleJoinMeeting}
            >
              <Video className="h-4 w-4" />
              <span>Join Call</span>
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
        <Dialog
          open={isTranscribing}
          onOpenChange={(open) => {
            console.log("Transcription dialog openChange:", open);
            if (!open) {
              // Only allow closing if not in the middle of processing
              // This prevents accidental closing during transcription
              console.log(
                "Dialog closing requested, isTranscribing:",
                isTranscribing,
              );
              if (!saveTranscriptMutation.isPending) {
                console.log("Allowing dialog to close");
                setIsTranscribing(false);
              } else {
                console.log("Preventing dialog from closing during mutation");
                // Keep dialog open
                return false;
              }
            }
          }}
        >
          <DialogContent
            className="sm:max-w-md"
            onEscapeKeyDown={(e) => {
              // Prevent escape key from closing dialog during transcription
              if (saveTranscriptMutation.isPending) {
                e.preventDefault();
              }
            }}
            onPointerDownOutside={(e) => {
              // Prevent clicking outside from closing dialog during transcription
              if (saveTranscriptMutation.isPending) {
                e.preventDefault();
              }
            }}
          >
            <DialogHeader>
              <DialogTitle>Meeting Transcription</DialogTitle>
              <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                Capture and transcribe audio from your meeting. When prompted,
                select the tab or window with your meeting and make sure to
                check "Share audio".
              </p>
            </DialogHeader>
            <div className="rounded-md border border-amber-200 bg-amber-50 p-3 dark:border-amber-800 dark:bg-amber-900/30">
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
                    Important
                  </h3>
                  <div className="mt-1 text-sm text-amber-700 dark:text-amber-500">
                    <p>
                      You must enable "Share audio" when selecting your screen
                      to capture the meeting audio. Otherwise, no transcription
                      will be produced.
                    </p>
                  </div>
                </div>
              </div>
            </div>
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
                <div className="rounded-md bg-slate-50 p-4 whitespace-pre-wrap dark:bg-slate-900">
                  {transcriptData?.transcript}
                </div>
                <div className="flex justify-end">
                  <Button
                    size="sm"
                    variant="outline"
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
