import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { CalendarServiceFactory } from "~/server/services/calendar/factory";

// Validation schemas
const getMeetingsByDateSchema = z.object({
  date: z.string().refine((value) => !isNaN(new Date(value).getTime()), {
    message: "Invalid date format",
  }),
});

const createMeetingSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  startTime: z.string().refine((value) => !isNaN(new Date(value).getTime()), {
    message: "Invalid start time format",
  }),
  endTime: z.string().refine((value) => !isNaN(new Date(value).getTime()), {
    message: "Invalid end time format",
  }),
  location: z.string().optional(),
  attendees: z.string().optional(),
  organizer: z.string().optional(),
  addToCalendar: z.boolean().optional(),
  calendarConnectionId: z.string().optional(),
});

const linkNoteToMeetingSchema = z.object({
  noteId: z.string(),
  meetingId: z.string(),
});

const updateTranscriptSchema = z.object({
  meetingId: z.string(),
  transcript: z.string(),
});

const getTranscriptSchema = z.object({
  meetingId: z.string(),
});

export const meetingsRouter = createTRPCRouter({
  // Get meetings for a specific date
  getMeetingsByDate: protectedProcedure
    .input(getMeetingsByDateSchema)
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);

      // Format date to match database storage format (start of day)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(startOfDay);
      endOfDay.setHours(23, 59, 59, 999);

      // Find meetings for this day
      const meetings = await ctx.db.meeting.findMany({
        where: {
          userId: ctx.session.user.id,
          // Find meetings for this specific day
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
        orderBy: {
          startTime: "asc",
        },
        select: {
          id: true,
          title: true,
          description: true,
          startTime: true,
          endTime: true,
          location: true,
          attendees: true,
          transcript: true,
          notes: {
            select: {
              id: true,
              content: true,
              timeRef: true,
            },
          },
        },
      });

      return { meetings };
    }),

  // Create a new meeting
  createMeeting: protectedProcedure
    .input(createMeetingSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Create meeting in the database
      const meeting = await ctx.db.meeting.create({
        data: {
          title: input.title,
          description: input.description,
          startTime: new Date(input.startTime),
          endTime: new Date(input.endTime),
          location: input.location,
          attendees: input.attendees,
          organizer: input.organizer,
          userId,
        },
      });

      // If the user wants to add to calendar
      if (input.addToCalendar && input.calendarConnectionId) {
        try {
          // Get the calendar connection
          const calendarConnection = await ctx.db.calendarConnection.findFirst({
            where: {
              id: input.calendarConnectionId,
              userId,
            },
          });

          if (!calendarConnection) {
            throw new Error("Calendar connection not found");
          }

          // Create an event in the calendar
          const calendarService = CalendarServiceFactory.getService(
            calendarConnection.provider,
          );

          // Format attendees if any
          const attendeesArray = input.attendees
            ? input.attendees.split(",").map((email) => email.trim())
            : [];

          const calendarEvent = await calendarService.createEvent(
            calendarConnection,
            {
              title: input.title,
              description: input.description,
              startTime: new Date(input.startTime),
              endTime: new Date(input.endTime),
              location: input.location,
              attendees: attendeesArray,
            },
          );

          // Update the meeting with external ID and calendar ID
          await ctx.db.meeting.update({
            where: { id: meeting.id },
            data: {
              externalId: calendarEvent.externalId,
              calendarId: calendarEvent.calendarId,
            },
          });
        } catch (error) {
          console.error("Failed to create calendar event:", error);
          // We don't throw here, as the meeting is already created in our system
          // But we could log or notify the user of the issue
        }
      }

      return { meeting };
    }),

  // Link a note to a meeting
  linkNoteToMeeting: protectedProcedure
    .input(linkNoteToMeetingSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Ensure both note and meeting belong to the user
      const note = await ctx.db.note.findFirst({
        where: {
          id: input.noteId,
          userId,
        },
      });

      const meeting = await ctx.db.meeting.findFirst({
        where: {
          id: input.meetingId,
          userId,
        },
      });

      if (!note || !meeting) {
        throw new Error("Note or meeting not found");
      }

      // Link the note to the meeting
      const updatedNote = await ctx.db.note.update({
        where: { id: input.noteId },
        data: {
          meetingId: input.meetingId,
        },
      });

      return { note: updatedNote };
    }),

  // Save transcript for a meeting
  saveTranscript: protectedProcedure
    .input(updateTranscriptSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Ensure the meeting belongs to the user
      const meeting = await ctx.db.meeting.findFirst({
        where: {
          id: input.meetingId,
          userId,
        },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      // Sanitize and format transcript text
      const sanitizedTranscript = input.transcript
        .trim()
        .replace(/\n{3,}/g, "\n\n"); // Replace multiple newlines with double newlines

      console.log(
        "Saving transcript for meeting:",
        input.meetingId,
        "Length:",
        sanitizedTranscript.length,
      );

      // Update the meeting with the transcript
      const updatedMeeting = await ctx.db.meeting.update({
        where: { id: input.meetingId },
        data: {
          transcript: sanitizedTranscript,
          updatedAt: new Date(),
        },
      });

      return { meeting: updatedMeeting };
    }),

  // Get transcript for a meeting
  getTranscript: protectedProcedure
    .input(getTranscriptSchema)
    .query(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Ensure the meeting belongs to the user
      const meeting = await ctx.db.meeting.findFirst({
        where: {
          id: input.meetingId,
          userId,
        },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      return { transcript: meeting.transcript };
    }),

  // Delete transcript for a meeting
  deleteTranscript: protectedProcedure
    .input(getTranscriptSchema)
    .mutation(async ({ ctx, input }) => {
      const userId = ctx.session.user.id;

      // Ensure the meeting belongs to the user
      const meeting = await ctx.db.meeting.findFirst({
        where: {
          id: input.meetingId,
          userId,
        },
      });

      if (!meeting) {
        throw new Error("Meeting not found");
      }

      // Update the meeting to remove the transcript
      const updatedMeeting = await ctx.db.meeting.update({
        where: { id: input.meetingId },
        data: {
          transcript: null,
          updatedAt: new Date(),
        },
      });

      return { meeting: updatedMeeting };
    }),
});
