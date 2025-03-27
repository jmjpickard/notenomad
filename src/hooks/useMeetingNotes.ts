import { useState, useCallback } from "react";
import { toast } from "sonner";
import { api } from "~/trpc/react";

interface UseMeetingNotesOptions {
  meetingId: string;
  initialContent?: string;
}

/**
 * Hook for fetching and updating meeting notes
 */
export function useMeetingNotes({
  meetingId,
  initialContent,
}: UseMeetingNotesOptions) {
  const [content, setContent] = useState<string | null>(initialContent || null);
  const [isLoading, setIsLoading] = useState(!initialContent);
  const [error, setError] = useState<Error | null>(null);

  // tRPC utilities
  const trpc = api.useUtils();
  const getMeetingNoteMutation = api.notes.getMeetingNote.useQuery(
    { meetingId },
    { enabled: false },
  );

  const saveMeetingNoteMutation = api.notes.saveMeetingNote.useMutation({
    onSuccess: (data) => {
      if (data.note) {
        setContent(data.note.content);
      }
      // Invalidate the query to ensure fresh data
      trpc.notes.getMeetingNote.invalidate({ meetingId });
    },
    onError: (err) => {
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to save meeting note");
    },
  });

  /**
   * Fetches the note content for the given meeting
   */
  const fetchNote = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await getMeetingNoteMutation.refetch();

      if (result.error) {
        throw result.error;
      }

      setContent(result.data?.content || null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error(String(err)));
      toast.error("Failed to fetch meeting note");
    } finally {
      setIsLoading(false);
    }
  }, [meetingId, getMeetingNoteMutation]);

  /**
   * Saves the note content for the given meeting
   */
  const saveNote = useCallback(
    async (noteContent: string) => {
      try {
        await saveMeetingNoteMutation.mutateAsync({
          meetingId,
          content: noteContent,
        });

        return Promise.resolve();
      } catch (err) {
        const error = err instanceof Error ? err : new Error(String(err));
        setError(error);
        return Promise.reject(error);
      }
    },
    [meetingId, saveMeetingNoteMutation],
  );

  // Initialize by fetching the note if no initial content provided
  const initializeNote = useCallback(async () => {
    if (!initialContent) {
      await fetchNote();
    }
  }, [initialContent, fetchNote]);

  return {
    content,
    isLoading:
      isLoading ||
      getMeetingNoteMutation.isLoading ||
      saveMeetingNoteMutation.isPending,
    error,
    fetchNote,
    saveNote,
    initializeNote,
  };
}
