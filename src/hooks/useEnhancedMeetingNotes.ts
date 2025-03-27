import { useState, useCallback, useEffect } from "react";
import { useNoteStore } from "~/store/noteStore";
import { api } from "~/trpc/react";

interface UseEnhancedMeetingNotesOptions {
  meetingId: string;
}

/**
 * Hook for fetching and updating meeting notes using the centralized store
 */
export function useEnhancedMeetingNotes({
  meetingId,
}: UseEnhancedMeetingNotesOptions) {
  const { getContent, setNoteContent, markAsSaved, isDirty } = useNoteStore();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // Format key for store
  const noteId = `meeting-${meetingId}`;

  // tRPC utilities
  const trpc = api.useUtils();
  const getMeetingNoteQuery = api.notes.getMeetingNote.useQuery(
    { meetingId },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );

  const saveMeetingNoteMutation = api.notes.saveMeetingNote.useMutation({
    onSuccess: (data) => {
      if (data.note) {
        // Update the store
        setNoteContent(noteId, data.note.content);
        markAsSaved(noteId);
      }
      // Invalidate the query to ensure fresh data
      void trpc.notes.getMeetingNote.invalidate({ meetingId });
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
        const result = await getMeetingNoteQuery.refetch();
        if (result.data?.content) {
          setNoteContent(noteId, result.data.content);
          markAsSaved(noteId);
        }
      } catch (err) {
        console.error("Error loading meeting note content:", err);
        setError(err instanceof Error ? err : new Error(String(err)));
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialContent();
  }, [
    noteId,
    meetingId,
    getContent,
    setNoteContent,
    markAsSaved,
    getMeetingNoteQuery.refetch,
    getMeetingNoteQuery,
  ]);

  /**
   * Saves the note content to the database
   */
  const saveNote = useCallback(async () => {
    try {
      const content = getContent(noteId);
      if (!content || !isDirty(noteId)) return;

      await saveMeetingNoteMutation.mutateAsync({
        meetingId,
        content,
      });

      return true;
    } catch (err) {
      console.error("Error saving meeting note:", err);
      setError(err instanceof Error ? err : new Error(String(err)));
      return false;
    }
  }, [noteId, meetingId, getContent, isDirty, saveMeetingNoteMutation]);

  return {
    content: getContent(noteId),
    isLoading: isLoading || getMeetingNoteQuery.isLoading,
    isDirty: isDirty(noteId),
    error,
    saveNote,
  };
}
