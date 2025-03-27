"use client";

import { useState, useEffect } from "react";
import { DayNoteEditor } from "~/components/editor";

/**
 * Props for the NotesSection component
 */
interface NotesSectionProps {
  date?: Date;
}

/**
 * Displays the day's notes with a rich text editor
 */
export function NotesSection({ date = new Date() }: NotesSectionProps) {
  const [isClient, setIsClient] = useState(false);

  // Ensure we're running on the client before rendering the editor
  useEffect(() => {
    setIsClient(true);
  }, []);

  return (
    <div className="h-full">
      <h3 className="font-fraunces mb-4 text-xl font-semibold text-[#2C3E50]">
        Notes
      </h3>
      {isClient ? (
        <DayNoteEditor date={date} className="w-full" />
      ) : (
        <div className="flex h-40 items-center justify-center rounded-md border border-dashed border-[#E0E0E0] bg-[#F5F5F5] p-4">
          <p className="text-center text-sm text-[#607D8B]">
            Loading notes editor...
          </p>
        </div>
      )}
    </div>
  );
}
