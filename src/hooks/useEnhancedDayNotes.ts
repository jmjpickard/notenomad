import { useState, useCallback, useEffect } from "react";
import { format } from "date-fns";
import { useNoteStore } from "~/store/noteStore";
import { api } from "~/trpc/react";

interface UseEnhancedDayNotesOptions {
  date: Date;
}

/**
 * Hook for fetching and updating day notes using the centralized store
 */
export function useEnhancedDayNotes({ date }: UseEnhancedDayNotesOptions) {
  const { getContent, setNoteContent, markAsSaved, isDirty } = useNoteStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Format date for store key
  const formattedDate = format(date, "yyyy-MM-dd");
  const noteId = `day-${formattedDate}`;

  // tRPC utilities
  const trpc = api.useUtils();
  const getDayNoteQuery = api.notes.getDayNote.useQuery(
    { date: formattedDate },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );

  const saveDayNoteMutation = api.notes.saveDayNote.useMutation({
    onSuccess: (data) => {
      if (data.note) {
        // Update the store
        setNoteContent(noteId, data.note.content);
        markAsSaved(noteId);
      }
      // Invalidate the query to ensure fresh data
      trpc.notes.getDayNote.invalidate({ date: formattedDate });
    },
    onError: (err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
    },
  });

  /**
   * Initially loads note content from the API if not in the store
   */
  useEffect(() => {
    const loadInitialContent = async () => {
      setIsLoading(true);
      try {
        // If we already have content in the store, use that
        if (getContent(noteId)) {
          setIsLoading(false);
          return;
        }

        // Otherwise, try to fetch from API
        const result = await getDayNoteQuery.refetch();
        if (result.data?.content) {
          setNoteContent(noteId, result.data.content);
          markAsSaved(noteId);
        }
      } catch (err) {
        console.error("Error loading note content:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialContent();
  }, [
    noteId,
    formattedDate,
    getContent,
    setNoteContent,
    markAsSaved,
    getDayNoteQuery.refetch,
  ]);

  /**
   * Saves the note content to the database
   */
  const saveNote = useCallback(async () => {
    try {
      const content = getContent(noteId);
      if (!content || !isDirty(noteId)) return;

      await saveDayNoteMutation.mutateAsync({
        date: formattedDate,
        content,
      });

      return true;
    } catch (err) {
      console.error("Error saving note:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, [noteId, formattedDate, getContent, isDirty, saveDayNoteMutation]);

  return {
    content: getContent(noteId),
    isLoading: isLoading || getDayNoteQuery.isLoading,
    isDirty: isDirty(noteId),
    error,
    saveNote,
  };
}
