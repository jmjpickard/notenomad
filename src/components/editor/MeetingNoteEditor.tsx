"use client";

import { useState, useEffect, useRef, useCallback } from "react";
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
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

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
      void initialize();
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
      return Promise.reject(new Error(String(error)));
    }
  };

  // Define the save function with useCallback to avoid dependency issues
  const saveFunction = useCallback(
    async (explicitContent?: string) => {
      if (explicitContent) {
        return handleSave(explicitContent);
      }
      // Use the tracked content reference instead of localStorage
      return saveNote(currentContentRef.current);
    },
    [handleSave, saveNote]
  );

  // Register the save function if provided
  useEffect(() => {
    if (registerSaveFunction && !isLoading) {
      registerSaveFunction(saveFunction);
    }
  }, [registerSaveFunction, isLoading, saveFunction]);

  // Handle content changes with debounced auto-save
  const handleContentChange = (noteContent: string) => {
    // Update the current content reference
    currentContentRef.current = noteContent;

    // Call the parent's onContentChange callback if provided
    if (onContentChange) {
      onContentChange();
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout for auto-saving
    saveTimeoutRef.current = setTimeout(() => {
      void handleSave(noteContent);
    }, 1000);
  };

  // Clean up timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

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
        onContentChange={handleContentChange}
        className="min-h-[300px]"
        theme={theme}
      />
    </div>
  );
};
