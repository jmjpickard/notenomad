"use client";

import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useTheme } from "next-themes";
import { BlockNoteEditor } from "./BlockNoteEditor";
import { useMeetingNotes } from "~/hooks/useMeetingNotes";

/**
 * Props for the MeetingNoteEditor component
 */
interface MeetingNoteEditorProps {
  meetingId: string;
  initialContent?: string;
  className?: string;
  onSaveCallback?: () => void;
  registerSaveFunction?: (
    saveFunction: (content?: string) => Promise<void>,
  ) => void;
  onContentChange?: () => void;
}

/**
 * A specialised notes editor for meeting-specific notes with appropriate context
 */
export const MeetingNoteEditor = ({
  meetingId,
  initialContent,
  className,
  onSaveCallback,
  registerSaveFunction,
  onContentChange,
}: MeetingNoteEditorProps) => {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const [isInitialized, setIsInitialized] = useState(false);
  const currentContentRef = useRef<string>(initialContent || "[]");

  // Use the meeting notes hook for database integration
  const { content, isLoading, saveNote, initializeNote } = useMeetingNotes({
    meetingId,
    initialContent,
  });

  // Initialize by fetching the note from the database if needed
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeNote();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize meeting note:", error);
      }
    };

    if (!isInitialized) {
      initialize();
    }
  }, [isInitialized, initializeNote]);

  // Storage key for local fallback
  const storageKey = `meeting-note-${meetingId}`;

  /**
   * Handles saving content both to local storage and via the API
   */
  const handleSave = async (noteContent: string) => {
    try {
      // Update the current content reference
      currentContentRef.current = noteContent;

      // Save to local storage as backup
      if (typeof window !== "undefined") {
        localStorage.setItem(storageKey, noteContent);
      }

      // Save to database
      await saveNote(noteContent);

      // Notify parent component if callback provided
      if (onSaveCallback) {
        onSaveCallback();
      }

      return Promise.resolve();
    } catch (error) {
      console.error("Failed to save meeting note:", error);
      return Promise.reject(error);
    }
  };

  // Register the save function if provided
  useEffect(() => {
    if (registerSaveFunction && !isLoading) {
      registerSaveFunction(async (explicitContent?: string) => {
        if (explicitContent) {
          return handleSave(explicitContent);
        }
        // Use the tracked content reference instead of localStorage
        return saveNote(currentContentRef.current);
      });
    }
  }, [registerSaveFunction, isLoading, saveNote]);

  if (isLoading) {
    return (
      <div className="flex h-[300px] items-center justify-center">
        Loading notes...
      </div>
    );
  }

  return (
    <div className={className}>
      <BlockNoteEditor
        initialContent={content || undefined}
        onSave={handleSave}
        autoSaveInterval={1000}
        className="min-h-[300px]"
        theme={theme}
        onContentChange={onContentChange}
      />
    </div>
  );
};
