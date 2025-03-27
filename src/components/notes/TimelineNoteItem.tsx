"use client";

import { useState, useEffect, useRef } from "react";
import { format } from "date-fns";
import { Clock, Trash2, Save, X } from "lucide-react";
import { Button } from "~/components/ui/button";
import { EnhancedNoteEditor } from "~/components/editor/EnhancedNoteEditor";
import { api } from "~/trpc/react";
import { useTheme } from "next-themes";
import { BlockNoteView } from "@blocknote/mantine";
import { useCreateBlockNote } from "@blocknote/react";
import { noteNomadTheme } from "~/components/editor/theme";
import { useNoteStore } from "~/store/noteStore";
import { toast } from "sonner";

/**
 * Props for the TimelineNoteItem component
 */
interface TimelineNoteItemProps {
  id: string;
  content: string;
  timeRef: Date;
  date: Date;
  isLastNote?: boolean;
  onSaved?: (action?: "delete" | "save") => void;
  onAddNoteAfter?: () => void;
  registerSaveFunction?: (
    saveFunction: (content?: string) => Promise<void>,
  ) => void;
  onContentChange?: () => void;
}

/**
 * Component that displays a note in a chronological timeline with time reference
 */
export const TimelineNoteItem = ({
  id,
  content,
  timeRef,
  date,
  isLastNote = false,
  onSaved,
  onAddNoteAfter,
  registerSaveFunction,
  onContentChange,
}: TimelineNoteItemProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";
  const noteStore = useNoteStore();

  // Create a unique editor ID for this note
  const editorId = `timeline-note-${id}`;

  // Create a read-only editor for displaying formatted content
  const readOnlyEditor = useCreateBlockNote({
    initialContent: (() => {
      try {
        return JSON.parse(content);
      } catch (error) {
        console.error("Error parsing note content:", error);
        return [{ type: "paragraph", content: [] }];
      }
    })(),
  });

  // Set editor to read-only
  useEffect(() => {
    readOnlyEditor.isEditable = false;
  }, [readOnlyEditor]);

  // Apply the appropriate theme based on current theme setting
  const appliedTheme =
    theme === "dark" ? noteNomadTheme.dark : noteNomadTheme.light;

  // Save and delete mutations
  const trpc = api.useUtils();
  const saveDayNoteMutation = api.notes.saveDayNote.useMutation({
    onSuccess: () => {
      // Invalidate the getDayNote query to ensure fresh data
      const dateString = format(date, "yyyy-MM-dd");
      trpc.notes.getDayNote.invalidate({ date: dateString });

      setLastSaved(new Date());
      setIsSaving(false);

      if (onSaved) onSaved("save");
    },
    onError: () => {
      setIsSaving(false);
    },
  });

  const deleteNoteMutation = api.notes.deleteNote.useMutation({
    onSuccess: () => {
      // Invalidate the getDayNote query to ensure fresh data
      const dateString = format(date, "yyyy-MM-dd");
      trpc.notes.getDayNote.invalidate({ date: dateString });

      setIsDeleting(false);

      toast.success("Note deleted");

      if (onSaved) onSaved("delete");
    },
    onError: (error) => {
      setIsDeleting(false);
      toast.error(`Failed to delete note: ${error.message}`);
    },
  });

  // Update content change handler
  useEffect(() => {
    if (onContentChange && noteStore.isDirty(editorId)) {
      onContentChange();
    }
  }, [onContentChange, noteStore.isDirty, editorId, noteStore]);

  /**
   * Handles saving the existing note
   */
  const handleSaveExistingNote = async (contentToSave?: string) => {
    try {
      // Get content from the note store if not provided
      const saveContent = contentToSave || noteStore.getContent(editorId);
      if (!saveContent) return Promise.resolve();

      setIsSaving(true);

      // Format date string
      const dateString = format(date, "yyyy-MM-dd");

      await saveDayNoteMutation.mutateAsync({
        date: dateString,
        content: saveContent,
        noteId: id,
      });

      return Promise.resolve();
    } catch (error) {
      setIsSaving(false);
      return Promise.reject(error);
    }
  };

  /**
   * Manually saves the current note content
   */
  const saveNote = async () => {
    await handleSaveExistingNote();
  };

  // Register save function when in edit mode
  useEffect(() => {
    if (isEditing && registerSaveFunction) {
      registerSaveFunction(handleSaveExistingNote);
    }
  }, [isEditing, registerSaveFunction]);

  /**
   * Handles toggling the edit mode
   */
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  /**
   * Handles deleting the note
   */
  const handleDeleteNote = async () => {
    if (window.confirm("Are you sure you want to delete this note?")) {
      setIsDeleting(true);
      try {
        await deleteNoteMutation.mutateAsync({
          noteId: id,
        });
      } catch (error) {
        console.error("Error deleting note:", error);
        setIsDeleting(false);
      }
    }
  };

  /**
   * Handler for when note is saved and user wants to exit edit mode
   */
  const handleSavedAndExit = async () => {
    await saveNote();
    setIsEditing(false);
  };

  /**
   * Formats the time for display
   */
  const formattedTime = format(new Date(timeRef), "HH:mm");

  return (
    <div className="relative">
      <div className="space-y-2 rounded-md border border-[#E0E0E0] bg-white p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-[#607D8B]">
            <Clock className="h-4 w-4" />
            <span className="text-sm">{formattedTime}</span>
            {lastSaved && isEditing && (
              <span className="text-xs text-[#9E9E9E]">
                Last saved: {format(lastSaved, "HH:mm")}
              </span>
            )}
          </div>
          {!isEditing ? (
            <button
              onClick={handleDeleteNote}
              className="rounded-md p-1 hover:bg-[#F5F5F5]"
              disabled={isDeleting}
            >
              <Trash2 className="h-4 w-4 text-[#F44336]" />
            </button>
          ) : (
            <div className="flex items-center gap-1">
              {isSaving && (
                <span className="text-xs text-[#9E9E9E]">Saving...</span>
              )}
              {noteStore.isDirty(editorId) && !isSaving && (
                <span className="text-xs text-[#9E9E9E]">Unsaved changes</span>
              )}
            </div>
          )}
        </div>

        {isEditing ? (
          <div className="mt-2 w-full">
            <EnhancedNoteEditor
              id={editorId}
              initialContent={content}
              className="w-full"
              theme={theme}
              onContentSaved={saveNote}
            />
            <div className="mt-2 flex justify-end space-x-2">
              <Button
                variant="outline"
                onClick={() => setIsEditing(false)}
                className="flex items-center gap-1 text-[#607D8B]"
              >
                <X className="h-4 w-4" />
                <span>Cancel</span>
              </Button>
              <Button
                variant="default"
                onClick={handleSavedAndExit}
                className="flex items-center gap-1 bg-[#4A6572] text-white hover:bg-[#344955]"
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                <span>Save & Exit</span>
              </Button>
              <Button
                variant="outline"
                onClick={saveNote}
                className="flex items-center gap-1 border-[#4A6572] text-[#4A6572] hover:bg-[#F5F5F5]"
                disabled={isSaving}
              >
                <Save className="h-4 w-4" />
                <span>Save</span>
              </Button>
            </div>
          </div>
        ) : (
          <div
            className="w-full cursor-pointer rounded-md bg-[#F9F9F9] text-[#424242] hover:bg-[#F5F5F5]"
            onClick={toggleEdit}
          >
            <BlockNoteView
              editor={readOnlyEditor}
              theme={appliedTheme}
              className="prose w-full max-w-none"
            />
          </div>
        )}
      </div>

      {/* Timeline connector that shows chronological flow */}
      {!isLastNote && (
        <div className="absolute top-full left-[24px] h-6 w-[2px] bg-[#E0E0E0]" />
      )}

      {/* Add a note button that appears if this is the last note */}
      {isLastNote && onAddNoteAfter && (
        <div
          className="mt-2 cursor-pointer rounded-md p-2 pl-8 text-sm text-[#607D8B] hover:text-[#424242]"
          onClick={onAddNoteAfter}
        >
          + Add a note...
        </div>
      )}
    </div>
  );
};
