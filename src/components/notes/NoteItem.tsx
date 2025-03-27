"use client";

import { useState } from "react";
import { Edit3, Calendar, Clock } from "lucide-react";
import { Button } from "~/components/ui/button";
import { DayNoteEditor, MeetingNoteEditor } from "~/components/editor";

/**
 * Props for the NoteItem component
 */
interface NoteItemProps {
  _id: string;
  type: "day" | "meeting";
  title?: string;
  preview: string;
  date?: Date;
  meetingId?: string;
  meetingTime?: string;
  onSaved?: () => void;
}

/**
 * A component that displays a note preview and allows in-place editing
 */
export const NoteItem = ({
  _id,
  type,
  title,
  preview,
  date,
  meetingId,
  meetingTime,
  onSaved,
}: NoteItemProps) => {
  const [isEditing, setIsEditing] = useState(false);

  /**
   * Handles toggling the edit mode
   */
  const toggleEdit = () => {
    setIsEditing(!isEditing);
  };

  /**
   * Handler for when note is saved
   */
  const handleSaved = () => {
    setIsEditing(false);
    if (onSaved) onSaved();
  };

  return (
    <div className="space-y-2 rounded-md border border-[#E0E0E0] p-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-[#607D8B]">
          {type === "day" ? (
            <>
              <Calendar className="h-4 w-4" />
              <span className="text-sm">Day Notes</span>
            </>
          ) : (
            <>
              <Clock className="h-4 w-4" />
              <span className="text-sm">{meetingTime}</span>
            </>
          )}
        </div>
        <button
          onClick={toggleEdit}
          className="rounded-md p-1 hover:bg-[#F5F5F5]"
        >
          <Edit3 className="h-4 w-4 text-[#607D8B]" />
        </button>
      </div>

      {title && <h3 className="font-medium text-[#2C3E50]">{title}</h3>}

      {isEditing ? (
        <div className="mt-2">
          {type === "day" && date ? (
            <DayNoteEditor date={date} onSaveCallback={handleSaved} />
          ) : meetingId ? (
            <MeetingNoteEditor
              meetingId={meetingId}
              onSaveCallback={handleSaved}
            />
          ) : null}
          <div className="mt-2 flex justify-end">
            <Button
              variant="ghost"
              onClick={() => setIsEditing(false)}
              className="text-[#607D8B]"
            >
              Cancel
            </Button>
          </div>
        </div>
      ) : (
        <div
          className="prose max-w-none cursor-pointer rounded-md bg-[#F9F9F9] p-4 text-[#424242] hover:bg-[#F5F5F5]"
          onClick={toggleEdit}
        >
          {preview}
        </div>
      )}
    </div>
  );
};
