import { useState, useCallback } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "~/trpc/react";

interface UseDayNotesOptions {
  date: Date;
  initialContent?: string;
}

/**
 * Hook for fetching and updating day notes
 */
export function useDayNotes({ date, initialContent }: UseDayNotesOptions) {
  const [content, setContent] = useState<string | null>(initialContent || null);
  const [isLoading, setIsLoading] = useState(!initialContent);
  const [error, setError] = useState<Error | null>(null);

  // tRPC utilities
  const trpc = api.useUtils();
  const getDayNoteMutation = api.notes.getDayNote.useQuery(
    { date: format(date, "yyyy-MM-dd") },
    { enabled: false },
  );

  const saveDayNoteMutation = api.notes.saveDayNote.useMutation({
    onSuccess: (data) => {
      if (data.note) {
        setContent(data.note.content);
      }
      // Invalidate the query to ensure fresh data
      trpc.notes.getDayNote.invalidate({ date: format(date, "yyyy-MM-dd") });
    },
    onError: (err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to save note");
    },
  });

  /**
   * Fetches the note content for the given date
   */
  const fetchNote = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const formattedDate = format(date, "yyyy-MM-dd");
      const result = await getDayNoteMutation.refetch();

      if (result.error) {
        throw result.error;
      }

      setContent(result.data?.content || null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to fetch note");
    } finally {
      setIsLoading(false);
    }
  }, [date, getDayNoteMutation]);

  /**
   * Saves the note content for the given date
   */
  const saveNote = useCallback(
    async (noteContent: string) => {
      try {
        // Ensure content is valid BlockNote structure
        let validContent = noteContent;
        try {
          const parsed = JSON.parse(noteContent);
          // If parsed content is empty array or invalid structure, use a proper empty BlockNote structure
          if (
            !Array.isArray(parsed) ||
            parsed.length === 0 ||
            !parsed[0]?.type
          ) {
            validContent = '[{"type":"paragraph","content":[]}]';
          } else {
            console.log("Content is valid BlockNote structure");
          }
        } catch (error) {
          console.error("Error parsing content:", error);
          validContent = '[{"type":"paragraph","content":[]}]';
        }

        const formattedDate = format(date, "yyyy-MM-dd");

        // Get the current note ID if available
        const currentNoteId = getDayNoteMutation.data?.notes?.[0]?.id;

        const result = await saveDayNoteMutation.mutateAsync({
          date: formattedDate,
          content: validContent,
          noteId: currentNoteId, // Pass the note ID if it exists
        });

        return Promise.resolve();
      } catch (err) {
        console.error("saveNote error:", err);
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return Promise.reject(error);
      }
    },
    [date, saveDayNoteMutation, getDayNoteMutation.data],
  );

  // Initialize by fetching the note if no initial content provided
  const initializeNote = useCallback(async () => {
    if (!initialContent) {
      try {
        // Skip auto-fetch for brand new notes
        const formattedDate = format(date, "yyyy-MM-dd");
        const result = await getDayNoteMutation.refetch();

        // Only set content if we found something - prevents UI reset for new notes
        if (result.data?.content) {
          setContent(result.data.content);
        }
      } catch (error) {
        console.error("Error initializing note:", error);
      } finally {
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  }, [initialContent, getDayNoteMutation, date]);

  return {
    content,
    isLoading:
      isLoading ||
      getDayNoteMutation.isLoading ||
      saveDayNoteMutation.isPending,
    error,
    fetchNote,
    saveNote,
    initializeNote,
  };
}
