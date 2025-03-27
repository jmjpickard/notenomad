"use client";

import { useState, useEffect } from "react";
import { format, isWithinInterval } from "date-fns";
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

interface Attendee {
  email: string;
  [key: string]: unknown;
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
      void trpc.notes.getMeetingNote.invalidate({ meetingId: id });
      void trpc.meetings.getMeetingsByDate.invalidate({
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
      void trpc.meetings.getMeetingsByDate.invalidate({
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
      void trpc.meetings.getMeetingsByDate.invalidate({
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
  const attendeeList = attendees ? (JSON.parse(attendees) as Attendee[]) : [];

  const attendeeEmails: string[] = attendeeList.map((attendee) =>
    typeof attendee === "object" && "email" in attendee
      ? attendee.email
      : String(attendee),
  );

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
   * Saves a note to the database
   */
  const handleSaveNote = async (noteContent: string, noteId?: string) => {
    if (!noteContent) {
      return Promise.reject(new Error("Note content is required"));
    }

    try {
      await saveMeetingNoteMutation.mutateAsync({
        meetingId: id,
        content: noteContent,
      });

      markAsSaved(noteId ?? newNoteId);

      // If this is a new note, clear the form and close it
      if (!noteId) {
        setIsAddingNote(false);
      } else {
        setEditingNoteId(null);
      }

      if (onNoteSaved) {
        onNoteSaved("save");
      }
    } catch (error) {
      console.error("Error saving note:", error);
      toast.error("Failed to save meeting note. Please try again.");
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

  useEffect(() => {
    // Register save function if provided by parent
    if (registerSaveFunction) {
      registerSaveFunction(async (content) => {
        const noteContent = content ?? getContent(newNoteId);
        if (noteContent) {
          await handleSaveNote(noteContent);
        }
      });
    }
  }, [registerSaveFunction, newNoteId, getContent, handleSaveNote]);

  // Check if this meeting is currently happening
  useEffect(() => {
    const checkCurrentMeeting = () => {
      const now = new Date();
      const isNow = isWithinInterval(now, { start: startTime, end: endTime });
      setIsCurrentMeeting(isNow);
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
          void refetchTranscript().finally(() => {
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
    void trpc.meetings.getTranscript.invalidate({ meetingId: id });

    void refetchTranscript().finally(() => {
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

            {attendeeEmails.length > 0 && (
              <div className="flex items-center text-sm text-[#424242] dark:text-slate-300">
                <Users className="mr-2 h-4 w-4 text-[#607D8B]" />
                <span>{formatAttendees(attendeeEmails)}</span>
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
              <div className="mt-4 text-sm text-gray-500 dark:text-gray-400">
                <p>
                  Click &quot;Select Source&quot; and choose the tab or window
                  where your meeting is happening. Make sure to check
                  &quot;Share audio&quot; before clicking Share.
                </p>
              </div>
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
