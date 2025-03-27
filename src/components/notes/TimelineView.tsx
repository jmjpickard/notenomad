"use client";

import { useState, useEffect, useMemo } from "react";
import { TimelineNoteItem } from "./TimelineNoteItem";
import { TimelineMeetingItem } from "./TimelineMeetingItem";
import { EnhancedNoteEditor } from "~/components/editor/EnhancedNoteEditor";
import { api } from "~/trpc/react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { useTheme } from "next-themes";

/**
 * Props for each note in the timeline
 */
interface TimelineNote {
  id: string;
  content: string;
  timeRef: Date;
  createdAt: Date;
  meetingId?: string | null;
}

/**
 * Props for each meeting in the timeline
 */
interface TimelineMeeting {
  id: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  location?: string | null;
  attendees?: string | null;
  notes?: { id: string; content: string; timeRef: Date }[];
}

/**
 * Type for timeline items which can be either notes or meetings
 */
type TimelineItem =
  | { type: "note"; data: TimelineNote }
  | { type: "meeting"; data: TimelineMeeting };

/**
 * Props for the TimelineView component
 */
interface TimelineViewProps {
  notes: TimelineNote[];
  meetings?: TimelineMeeting[];
  date: Date;
  onNoteAdded?: () => void;
  onNoteSaved?: (actionOrStartNewNote?: "delete" | "save" | boolean) => void;
  isAddingNote?: boolean;
  onAddNote?: () => void;
  showAddNoteCta?: boolean;
  saveInProgress?: boolean;
  registerSaveFunction?: (
    saveFunction: (content?: string) => Promise<void>,
  ) => void;
  onContentChange?: () => void;
  onLinkNoteToMeeting?: (noteId: string, meetingId: string) => void;
}

/**
 * Component that displays a chronological timeline of notes and meetings
 */
export const TimelineView = ({
  notes,
  meetings = [],
  date,
  onNoteAdded,
  onNoteSaved,
  isAddingNote: externalIsAddingNote,
  onAddNote: externalAddNote,
  showAddNoteCta = false,
  saveInProgress = false,
  registerSaveFunction,
  onContentChange,
  onLinkNoteToMeeting,
}: TimelineViewProps) => {
  const [internalIsAddingNote, setInternalIsAddingNote] = useState(false);
  const [activeMeetingId, setActiveMeetingId] = useState<string | null>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  // Generate a note ID for the new note
  const formattedDate = date.toISOString().split("T")[0];
  const newNoteId = `new-note-${formattedDate}`;

  // Use external state if provided, otherwise use internal state
  const isAddingNote =
    externalIsAddingNote !== undefined
      ? externalIsAddingNote
      : internalIsAddingNote;
  const setIsAddingNote = externalAddNote
    ? () => externalAddNote()
    : setInternalIsAddingNote;

  // Combine notes and meetings into a single timeline
  const timelineItems = useMemo(() => {
    const items: TimelineItem[] = [
      ...notes.map((note) => ({
        type: "note" as const,
        data: note,
      })),
      ...meetings.map((meeting) => ({
        type: "meeting" as const,
        data: meeting,
      })),
    ];

    // Sort by time reference (for notes) or start time (for meetings)
    return items.sort((a, b) => {
      const timeA =
        a.type === "note"
          ? new Date(a.data.timeRef).getTime()
          : new Date(a.data.startTime).getTime();
      const timeB =
        b.type === "note"
          ? new Date(b.data.timeRef).getTime()
          : new Date(b.data.startTime).getTime();
      return timeA - timeB;
    });
  }, [notes, meetings]);

  // tRPC utilities
  const trpc = api.useUtils();

  // tRPC mutations
  const addTimelineNoteMutation = api.notes.addTimelineNote.useMutation({
    onSuccess: (data) => {
      if (!externalIsAddingNote) setInternalIsAddingNote(false);

      // If this note was created for a meeting, link it
      if (activeMeetingId && data.note && onLinkNoteToMeeting) {
        onLinkNoteToMeeting(data.note.id, activeMeetingId);
        setActiveMeetingId(null);
      }

      // Invalidate the query to ensure UI updates
      trpc.notes.getDayNote.invalidate({ date: formattedDate });

      toast.success("Note added");
      if (onNoteAdded) onNoteAdded();
    },
    onError: () => {
      toast.error("Failed to add note");
    },
  });

  /**
   * Handles adding a new note to the timeline
   */
  const handleAddNote = (meetingId?: string) => {
    if (meetingId) {
      setActiveMeetingId(meetingId);
    } else {
      setActiveMeetingId(null);
    }
    setIsAddingNote(true);
  };

  /**
   * Handles saving a new note
   */
  const handleSaveNewNote = async (content?: string) => {
    try {
      // Use empty BlockNote structure if no content is provided
      const validContent =
        content && content.trim() !== ""
          ? content
          : '[{"type":"paragraph","content":[]}]';

      await addTimelineNoteMutation.mutateAsync({
        date: date.toISOString(),
        content: validContent,
        timeRef: new Date(),
        meetingId: activeMeetingId || undefined,
      });
      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  };

  /**
   * Handles new note being saved by EnhancedNoteEditor
   */
  const handleNewNoteSaved = () => {
    if (!externalIsAddingNote) setInternalIsAddingNote(false);
    setActiveMeetingId(null);
    if (onNoteSaved) onNoteSaved();
  };

  /**
   * Handles canceling the new note creation
   */
  const handleCancelNewNote = () => {
    if (!externalIsAddingNote) setInternalIsAddingNote(false);
    setActiveMeetingId(null);
  };

  /**
   * Handles saving a note and starting a new one
   */
  const handleSaveAndAddNew = () => {
    if (onNoteSaved) onNoteSaved(true);
  };

  // Register the save function for the parent component using useEffect
  useEffect(() => {
    if (registerSaveFunction && isAddingNote) {
      registerSaveFunction(handleSaveNewNote);
    }
  }, [registerSaveFunction, isAddingNote]);

  return (
    <div className="h-full space-y-6 overflow-y-auto">
      {/* Render timeline items in chronological order */}
      {timelineItems.map((item, index) => {
        if (item.type === "note") {
          return (
            <TimelineNoteItem
              key={item.data.id}
              id={item.data.id}
              content={item.data.content}
              timeRef={new Date(item.data.timeRef)}
              date={date}
              isLastNote={index === timelineItems.length - 1}
              onSaved={(action) => onNoteSaved && onNoteSaved(action)}
              onAddNoteAfter={
                index === timelineItems.length - 1
                  ? () => handleAddNote()
                  : undefined
              }
              registerSaveFunction={registerSaveFunction}
              onContentChange={onContentChange}
            />
          );
        } else {
          return (
            <TimelineMeetingItem
              key={item.data.id}
              id={item.data.id}
              title={item.data.title}
              description={item.data.description}
              startTime={new Date(item.data.startTime)}
              endTime={new Date(item.data.endTime)}
              location={item.data.location}
              attendees={item.data.attendees}
              notes={item.data.notes}
              date={date}
              onAddNote={() => handleAddNote(item.data.id)}
              registerSaveFunction={registerSaveFunction}
              onNoteSaved={onNoteSaved}
            />
          );
        }
      })}

      {/* Show empty state if no timeline items */}
      {timelineItems.length === 0 && !isAddingNote && (
        <div
          className="cursor-pointer rounded-md border border-dashed border-[#E0E0E0] p-6 text-center text-[#607D8B] hover:border-[#4A90E2]"
          onClick={() => handleAddNote()}
        >
          Click to add a note...
        </div>
      )}

      {/* Form for adding a new note */}
      {isAddingNote && (
        <div
          className={`space-y-2 rounded-md border ${
            activeMeetingId
              ? "border-blue-200 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/20"
              : "border-[#E0E0E0]"
          } p-4`}
        >
          <div className="mb-2 flex items-center gap-2 text-[#607D8B]">
            <span className="text-sm">
              {activeMeetingId ? "New Meeting Note" : "New Note"}
            </span>
          </div>
          <div className="relative">
            <EnhancedNoteEditor
              id={newNoteId}
              initialContent=""
              className="min-h-[200px]"
              theme={theme}
              onContentSaved={handleNewNoteSaved}
            />
          </div>

          {/* Add another note CTA */}
          {showAddNoteCta && (
            <div className="mt-4 flex justify-end">
              <button
                className="flex items-center gap-1 text-sm text-[#4A90E2] hover:text-[#2171CD]"
                onClick={handleSaveAndAddNew}
              >
                <Plus className="h-4 w-4" />
                Add another note
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
