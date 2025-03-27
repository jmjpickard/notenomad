"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { format } from "date-fns";
import { useTheme } from "next-themes";
import { BlockNoteEditor } from "./BlockNoteEditor";
import { useDayNotes } from "~/hooks/useDayNotes";

/**
 * Props for the DayNoteEditor component
 */
interface DayNoteEditorProps {
  date: Date;
  initialContent?: string;
  className?: string;
  onSaveCallback?: () => void;
  registerSaveFunction?: (
    saveFunction: (content?: string) => Promise<void>,
  ) => void;
  onContentChange?: () => void;
}

/**
 * A specialised notes editor for daily notes with appropriate context and storage
 */
export const DayNoteEditor = ({
  date,
  initialContent,
  className,
  onSaveCallback,
  registerSaveFunction,
  onContentChange,
}: DayNoteEditorProps) => {
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const [isInitialized, setIsInitialized] = useState(false);
  // Ensure we start with a valid empty BlockNote structure
  const currentContentRef = useRef<string>(
    initialContent && initialContent !== "[]"
      ? initialContent
      : '[{"type":"paragraph","content":[]}]',
  );
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Use the day notes hook for database integration
  const { content, isLoading, saveNote, initializeNote } = useDayNotes({
    date,
    initialContent,
  });

  // Initialize by fetching the note from the database if needed
  useEffect(() => {
    const initialize = async () => {
      try {
        await initializeNote();
        setIsInitialized(true);
      } catch (error) {
        console.error("Failed to initialize day note:", error);
      }
    };

    if (!isInitialized) {
      void initialize();
    }
  }, [isInitialized, initializeNote]);

  // Storage key for local fallback
  const formattedDate = format(date, "yyyy-MM-dd");
  const storageKey = `day-note-${formattedDate}`;

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
      console.error("Failed to save day note:", error);
      return Promise.reject(new Error(String(error)));
    }
  };

  /**
   * Handles content changes and schedules a debounced save
   */
  const handleContentChange = (content: string) => {
    // Update the current content reference
    currentContentRef.current = content;

    // Call the onContentChange callback if provided
    if (onContentChange) {
      onContentChange();
    }

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Set a new timeout for autosave
    saveTimeoutRef.current = setTimeout(() => {
      handleSave(content).catch((error) => {
        console.error("Error saving content:", error);
      });
    }, 5000); // 5 second debounce
  };

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  // Register the save function if provided
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

  useEffect(() => {
    if (registerSaveFunction && !isLoading) {
      registerSaveFunction(saveFunction);
    }

    // Reset when initialContent changes to prevent persisting between notes
    return () => {
      if (registerSaveFunction) {
        registerSaveFunction(async () => Promise.resolve());
      }
    };
  }, [registerSaveFunction, isLoading, initialContent, saveFunction]);

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
