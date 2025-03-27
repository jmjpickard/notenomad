"use client";

import { useEffect, useRef, useState } from "react";
import { BlockNoteEditor } from "./BlockNoteEditor";
import { useNoteStore } from "~/store/noteStore";
import { api } from "~/trpc/react";

/**
 * Props for the EnhancedNoteEditor component
 */
interface EnhancedNoteEditorProps {
  id: string; // 'day-YYYY-MM-DD' or 'meeting-uuid'
  initialContent?: string;
  className?: string;
  theme?: "light" | "dark";
  onContentSaved?: () => void;
  onContentChange?: (content: string) => void;
}

/**
 * Enhanced note editor with intelligent autosave functionality
 */
export const EnhancedNoteEditor = ({
  id,
  initialContent,
  className,
  theme = "light",
  onContentSaved,
  onContentChange,
}: EnhancedNoteEditorProps) => {
  const { setNoteContent, markAsSaved, isDirty, getContent } = useNoteStore();
  const [isActive, setIsActive] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const trpc = api.useUtils();

  // Mutation for saving/adding notes
  const saveDayNoteMutation = api.notes.saveDayNote.useMutation();
  const saveMeetingNoteMutation = api.notes.saveMeetingNote.useMutation();
  const addTimelineNoteMutation = api.notes.addTimelineNote.useMutation();

  // Get initial content from store or prop
  const editorContent =
    getContent(id) || initialContent || '[{"type":"paragraph","content":[]}]';

  // Initialize the store with any provided content
  useEffect(() => {
    if (initialContent && !getContent(id)) {
      setNoteContent(id, initialContent);
    }
  }, [id, initialContent, setNoteContent, getContent]);

  /**
   * Saves note content to the database via API
   */
  const saveNote = async (noteContent: string) => {
    // Don't save empty content
    if (!noteContent || noteContent === '[{"type":"paragraph","content":[]}]') {
      return;
    }

    try {
      const today = new Date();
      const formattedDate = today.toISOString().split("T")[0];

      // For day notes
      if (id.startsWith("day-")) {
        const dateString = id.replace("day-", "");
        await saveDayNoteMutation.mutateAsync({
          date: dateString,
          content: noteContent,
        });

        // Invalidate queries to ensure fresh data
        void trpc.notes.getDayNote.invalidate({ date: dateString });
      }
      // For meeting notes
      else if (id.startsWith("meeting-")) {
        // Extract the meeting ID, removing any timestamp or additional parts
        const meetingId = id.replace("meeting-", "").split("-")[0];

        void saveMeetingNoteMutation.mutateAsync({
          meetingId: meetingId!,
          content: noteContent,
        });

        // Invalidate queries to ensure fresh data
        void trpc.notes.getMeetingNote.invalidate({ meetingId: meetingId! });
      }
      // For new timeline notes
      else if (id.startsWith("new-note-")) {
        const dateString = id.replace("new-note-", "");
        void addTimelineNoteMutation.mutateAsync({
          date: dateString,
          content: noteContent,
          timeRef: new Date(),
        });

        // Invalidate queries to ensure fresh data
        void trpc.notes.getDayNote.invalidate({ date: dateString });
      }
      // For existing timeline notes (editing)
      else if (id.startsWith("timeline-note-")) {
        const noteId = id.replace("timeline-note-", "");
        void saveDayNoteMutation.mutateAsync({
          date: formattedDate as string,
          content: noteContent,
          noteId,
        });

        // Invalidate queries to ensure fresh data
        void trpc.notes.getDayNote.invalidate({ date: formattedDate });
      }

      // Update the store to reflect saved state
      markAsSaved(id);

      // Notify parent component if callback provided
      if (onContentSaved) {
        onContentSaved();
      }
    } catch (error) {
      console.error("Failed to save note:", error);
    }
  };

  /**
   * Handles content changes and schedules autosave
   */
  const scheduleAutosave = (content: string) => {
    // Update local state immediately
    setNoteContent(id, content);

    // Call the parent's onContentChange handler if provided
    if (onContentChange) {
      onContentChange(content);
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Only schedule an autosave if the editor is active and content is not empty
    if (
      isActive &&
      content &&
      content !== '[{"type":"paragraph","content":[]}]'
    ) {
      saveTimeoutRef.current = setTimeout(() => {
        void saveNote(content);
      }, 2000); // 2 second debounce
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={`w-full ${className || ""}`}>
      <BlockNoteEditor
        initialContent={editorContent}
        onContentChange={scheduleAutosave}
        onFocus={() => setIsActive(true)}
        onBlur={() => {
          setIsActive(false);
          // Save on blur if dirty
          if (isDirty(id)) {
            const content = getContent(id);
            if (content) void saveNote(content);
          }
        }}
        theme={theme}
        className="w-full"
      />
    </div>
  );
};
