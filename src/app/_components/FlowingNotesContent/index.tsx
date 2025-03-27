"use client";

import { useState, useEffect, useCallback } from "react";
import { addDays, subDays, format } from "date-fns";
import { DayHeader } from "../DayHeader";
import { Card } from "~/components/ui/card";
import { api } from "~/trpc/react";
import { useTheme } from "next-themes";
import { useNoteStore } from "~/store/noteStore";
import { toast } from "sonner";
import { TimelineView } from "~/components/notes";

/**
 * Component that implements the "single flowing note" concept that combines meetings and notes
 */
export function FlowingNotesContent() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const [isAddingNote, setIsAddingNote] = useState(false);
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [selectedMeetingId, setSelectedMeetingId] = useState<string | null>(
    null,
  );
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  // Access the note store
  const { getContent, setNoteContent } = useNoteStore();

  // Get meetings for the current date
  const formattedDate = format(currentDate, "yyyy-MM-dd");
  const noteId = `day-${formattedDate}`;

  const {
    data: meetingsData,
    isLoading: isLoadingMeetings,
    refetch: refetchMeetings,
  } = api.meetings.getMeetingsByDate.useQuery(
    { date: formattedDate },
    { enabled: true },
  );

  // Get day notes for the current date
  const {
    data: dayNotesData,
    isLoading: isLoadingDayNotes,
    refetch: refetchDayNotes,
  } = api.notes.getDayNote.useQuery(
    { date: formattedDate },
    {
      enabled: true,
      refetchOnWindowFocus: false,
      refetchOnMount: true,
    },
  );

  // Link note to meeting mutation
  const linkNoteToMeetingMutation = api.meetings.linkNoteToMeeting.useMutation({
    onSuccess: () => {
      refetchAllData();
      toast.success("Note linked to meeting");
    },
    onError: (error) => {
      toast.error(`Failed to link note to meeting: ${error.message}`);
    },
  });

  // Function to format time from Date objects
  const formatTimeRange = (startTime: Date, endTime: Date) => {
    return `${format(startTime, "HH:mm")} - ${format(endTime, "HH:mm")}`;
  };

  /**
   * Refetches all data for the current date
   */
  const refetchAllData = () => {
    refetchDayNotes();
    refetchMeetings();
  };

  /**
   * Navigates to the previous day and refetches data
   */
  const handlePreviousDay = () => {
    setCurrentDate((prevDate) => {
      const newDate = subDays(prevDate, 1);
      return newDate;
    });
  };

  /**
   * Navigates to the next day and refetches data
   */
  const handleNextDay = () => {
    setCurrentDate((prevDate) => {
      const newDate = addDays(prevDate, 1);
      return newDate;
    });
  };

  /**
   * Resets to today's date and refetches data
   */
  const handleToday = () => {
    setCurrentDate(new Date());
  };

  /**
   * Effect to refetch data when the date changes
   */
  useEffect(() => {
    // These lines ensure we're not affected by cached data from other days
    if (getContent(noteId) === null && dayNotesData?.content) {
      setNoteContent(noteId, dayNotesData.content);
    }

    refetchAllData();

    // Reset state when date changes
    setIsAddingNote(false);
    setEditingNoteId(null);
    setSelectedMeetingId(null);
    setSaveFunction(null);
  }, [currentDate, getContent, noteId, dayNotesData?.content]);

  /**
   * Opens the note editor for a new note
   */
  const handleAddNote = () => {
    setIsAddingNote(true);
    setSelectedMeetingId(null);
  };

  /**
   * Links a note to a meeting
   */
  const handleLinkNoteToMeeting = (noteId: string, meetingId: string) => {
    linkNoteToMeetingMutation.mutate({
      noteId,
      meetingId,
    });
  };

  /**
   * Refreshes the notes data after saving or deleting
   */
  const handleNoteSaved = (
    actionOrStartNewNote?: "delete" | "save" | boolean,
  ) => {
    refetchDayNotes();

    // Handle boolean parameter (startNewNote)
    if (typeof actionOrStartNewNote === "boolean") {
      setIsAddingNote(actionOrStartNewNote);
    } else {
      setIsAddingNote(false);
    }

    setEditingNoteId(null);
    setSelectedMeetingId(null);

    // Only show toast for save action, not for delete
    if (actionOrStartNewNote !== "delete") {
      toast.success("Note saved successfully");
    }
  };

  /**
   * Closes the editor without saving
   */
  const handleCloseEditor = () => {
    setIsAddingNote(false);
    setEditingNoteId(null);
    setSelectedMeetingId(null);
  };

  // Check if any note is being edited
  const isEditingAnyNote =
    isAddingNote || editingNoteId !== null || selectedMeetingId !== null;

  /**
   * Registers a save function for auto-saving
   */
  const [saveFunction, setSaveFunction] = useState<
    ((content?: string) => Promise<void>) | null
  >(null);

  // Register save function with useCallback to prevent recreating on each render
  const registerSaveFunction = useCallback(
    (fn: (content?: string) => Promise<void>) => {
      setSaveFunction(() => fn);
    },
    [],
  );

  /**
   * Handles content change in the editor
   */
  const handleContentChange = () => {
    // This function will be called when content changes in the editor
    // We can use it to update dirty state if needed
  };

  // Render the editor or the list of notes
  const renderContent = () => {
    // Show loading state
    if (isLoadingDayNotes || isLoadingMeetings) {
      return (
        <div className="flex min-h-[300px] items-center justify-center">
          <p>Loading...</p>
        </div>
      );
    }

    // Get the notes array and meetings from the data
    const notes = dayNotesData?.notes || [];
    const meetings = meetingsData?.meetings || [];

    // Render the timeline view with notes and meetings
    return (
      <TimelineView
        notes={notes}
        meetings={meetings}
        date={currentDate}
        isAddingNote={isAddingNote}
        onAddNote={handleAddNote}
        onNoteAdded={refetchAllData}
        onNoteSaved={handleNoteSaved}
        registerSaveFunction={registerSaveFunction}
        onContentChange={handleContentChange}
        onLinkNoteToMeeting={handleLinkNoteToMeeting}
      />
    );
  };

  return (
    <div className="container mx-auto h-full overflow-y-auto px-4 py-6">
      <DayHeader
        date={currentDate}
        onChangeDate={setCurrentDate}
        onPreviousDay={handlePreviousDay}
        onNextDay={handleNextDay}
        onToday={handleToday}
      />

      <div className="m-auto mt-4 w-full p-4 px-4 md:w-4/5 md:px-0">
        {renderContent()}
      </div>
    </div>
  );
}
