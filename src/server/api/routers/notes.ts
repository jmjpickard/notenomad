import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

// Validation schemas
const getDayNoteSchema = z.object({
  date: z.string().refine((value) => !isNaN(new Date(value).getTime()), {
    message: "Invalid date format",
  }),
});

const createDayNoteSchema = z.object({
  date: z.string().refine((value) => !isNaN(new Date(value).getTime()), {
    message: "Invalid date format",
  }),
  content: z.string(),
});

const saveDayNoteSchema = z.object({
  date: z.string().refine((value) => !isNaN(new Date(value).getTime()), {
    message: "Invalid date format",
  }),
  content: z.string(),
  noteId: z.string().optional(), // Optional note ID for updating existing notes
  timeRef: z.date().optional(), // Optional timeRef for timeline organization
});

const addTimelineNoteSchema = z.object({
  date: z.string().refine((value) => !isNaN(new Date(value).getTime()), {
    message: "Invalid date format",
  }),
  content: z.string(),
  timeRef: z.date().optional(),
  meetingId: z.string().optional(),
});

const getMeetingNoteSchema = z.object({
  meetingId: z.string(),
});

const createMeetingNoteSchema = z.object({
  meetingId: z.string(),
  content: z.string(),
});

const deleteNoteSchema = z.object({
  noteId: z.string(),
});

export const notesRouter = createTRPCRouter({
  // Day notes procedures
  getDayNote: protectedProcedure
    .input(getDayNoteSchema)
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);

      // Format date to match database storage format (start of day)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      // Try to find an existing day note with notes included
      const dayNote = await ctx.db.dayNote.findFirst({
        where: {
          userId: ctx.session.user.id,
          date: {
            // Find notes for this specific day
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: {
          notes: {
            orderBy: {
              createdAt: "asc", // Order notes by createdAt for timeline view instead of timeRef
            },
          },
        },
      });

      if (!dayNote) {
        return { content: null, notes: [] };
      }

      // We know the notes array exists because we included it in the query
      const notes = dayNote.notes;

      // Return all notes for timeline display
      return {
        content: notes.length > 0 ? notes[0]?.content : null,
        notes: notes.map((note) => ({
          id: note.id,
          content: note.content,
          timeRef: note.timeRef,
          createdAt: note.createdAt,
        })),
      };
    }),

  saveDayNote: protectedProcedure
    .input(saveDayNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const parsedDate = new Date(input.date);
      const timeRef = input.timeRef || new Date(); // Use provided timeRef or current time

      // Format date to match database storage format (start of day)
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);

      // Check for existing day note
      let dayNote = await ctx.db.dayNote.findFirst({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
          },
        },
        include: {
          notes: true,
        },
      });

      // Create the day note if it doesn't exist
      if (!dayNote) {
        dayNote = await ctx.db.dayNote.create({
          data: {
            date: startOfDay,
            userId: ctx.session.user.id,
          },
          include: {
            notes: true,
          },
        });
      }

      // Ensure the notes property exists (TypeScript safety)
      if (!Array.isArray(dayNote.notes)) {
        dayNote.notes = [];
      }

      // At this point, dayNote should never be null as we create it if it doesn't exist
      if (!dayNote) {
        throw new Error("Failed to create or find day note");
      }

      const validContent =
        input.content || '[{"type":"paragraph","content":[]}]';

      // Check if we need to update an existing note
      if (input.noteId) {
        // If noteId is provided, update that specific note
        const updatedNote = await ctx.db.note.update({
          where: {
            id: input.noteId,
            userId: ctx.session.user.id,
          },
          data: {
            content: validContent,
            timeRef: timeRef,
          },
        });

        return { success: true, note: updatedNote };
      }

      // Check if there are existing notes we can update
      const hasExistingNotes =
        dayNote.notes !== undefined &&
        Array.isArray(dayNote.notes) &&
        dayNote.notes.length > 0;

      if (hasExistingNotes && dayNote.notes[0]?.id) {
        // If notes exist for this day, update the first one
        // This prevents creating multiple notes for the same day
        const updatedNote = await ctx.db.note.update({
          where: {
            id: dayNote.notes[0].id,
            userId: ctx.session.user.id,
          },
          data: {
            content: validContent,
            timeRef: timeRef,
          },
        });

        return { success: true, note: updatedNote };
      } else {
        // Create a new note only if no notes exist for this day
        const newNote = await ctx.db.note.create({
          data: {
            content: validContent,
            userId: ctx.session.user.id,
            dayNoteId: dayNote.id,
            timeRef: timeRef,
          },
        });

        return { success: true, note: newNote };
      }
    }),

  // Add a new procedure to create a new timeline note
  addTimelineNote: protectedProcedure
    .input(addTimelineNoteSchema)
    .mutation(async ({ ctx, input }) => {
      const parsedDate = new Date(input.date);
      const timeRef = input.timeRef || new Date(); // Use provided timeRef or current time

      // Format date to match database storage format (start of day)
      const startOfDay = new Date(parsedDate);
      startOfDay.setHours(0, 0, 0, 0);

      // Check for existing day note
      let dayNote = await ctx.db.dayNote.findFirst({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      // Create the day note if it doesn't exist
      if (!dayNote) {
        dayNote = await ctx.db.dayNote.create({
          data: {
            date: startOfDay,
            userId: ctx.session.user.id,
          },
        });
      }

      // Create a new timeline note - ensure content is clean by validating
      const validContent =
        input.content || '[{"type":"paragraph","content":[]}]';
      const newNote = await ctx.db.note.create({
        data: {
          content: validContent,
          userId: ctx.session.user.id,
          dayNoteId: dayNote.id,
          timeRef: timeRef,
          meetingId: input.meetingId,
        },
      });

      return { success: true, note: newNote };
    }),

  // Meeting notes procedures
  getMeetingNote: protectedProcedure
    .input(getMeetingNoteSchema)
    .query(async ({ ctx, input }) => {
      // Check if the meeting exists and belongs to the user
      const meeting = await ctx.db.meeting.findFirst({
        where: {
          id: input.meetingId,
          userId: ctx.session.user.id,
        },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      // Try to find an existing note for the meeting
      const note = await ctx.db.note.findFirst({
        where: {
          meetingId: input.meetingId,
          userId: ctx.session.user.id,
        },
      });

      if (!note) {
        return { content: null };
      }

      return { content: note.content };
    }),

  saveMeetingNote: protectedProcedure
    .input(createMeetingNoteSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if the meeting exists and belongs to the user
      const meeting = await ctx.db.meeting.findFirst({
        where: {
          id: input.meetingId,
          userId: ctx.session.user.id,
        },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      // Check for existing note for this meeting
      const existingNote = await ctx.db.note.findFirst({
        where: {
          meetingId: input.meetingId,
          userId: ctx.session.user.id,
        },
      });

      // If there's already a note, update it
      if (existingNote) {
        const validContent =
          input.content || '[{"type":"paragraph","content":[]}]';
        const updatedNote = await ctx.db.note.update({
          where: {
            id: existingNote.id,
          },
          data: {
            content: validContent,
          },
        });

        return { success: true, note: updatedNote };
      }

      // Otherwise create a new note
      const validContent =
        input.content || '[{"type":"paragraph","content":[]}]';
      const newNote = await ctx.db.note.create({
        data: {
          content: validContent,
          userId: ctx.session.user.id,
          meetingId: input.meetingId,
        },
      });

      return { success: true, note: newNote };
    }),

  // Delete a specific note
  deleteNote: protectedProcedure
    .input(deleteNoteSchema)
    .mutation(async ({ ctx, input }) => {
      // Check if the note exists and belongs to the user
      const note = await ctx.db.note.findFirst({
        where: {
          id: input.noteId,
          userId: ctx.session.user.id,
        },
      });

      if (!note) {
        throw new Error("Note not found");
      }

      // Delete the note
      await ctx.db.note.delete({
        where: {
          id: input.noteId,
        },
      });

      return { success: true };
    }),
});
