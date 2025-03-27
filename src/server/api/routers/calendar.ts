import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import { CalendarServiceFactory } from "~/server/services/calendar/factory";
import { CalendarSyncService } from "~/server/services/calendar/sync";

export const calendarRouter = createTRPCRouter({
  // Get all calendar connections for the authenticated user
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.calendarConnection.findMany({
      where: { userId: ctx.session.user.id },
    });
  }),

  // Get a single calendar connection by ID
  getConnection: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      return await ctx.db.calendarConnection.findFirst({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Delete a calendar connection
  deleteConnection: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.calendarConnection.deleteMany({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });
    }),

  // Toggle a calendar connection (active/inactive)
  toggleConnectionActive: protectedProcedure
    .input(z.object({ id: z.string(), isActive: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      return await ctx.db.calendarConnection.updateMany({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          isActive: input.isActive,
        },
      });
    }),

  // Manually sync calendars for the current user
  syncCalendars: protectedProcedure.mutation(async ({ ctx }) => {
    const syncService = new CalendarSyncService();
    await syncService.syncUserCalendars(ctx.session.user.id);

    return { success: true };
  }),

  // Get events for a specific date
  getEvents: protectedProcedure
    .input(
      z.object({
        date: z.string().refine((value) => !isNaN(new Date(value).getTime()), {
          message: "Invalid date format",
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);

      // Get start and end of day
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      const endOfDay = new Date(date);
      endOfDay.setHours(23, 59, 59, 999);

      // Get user's calendar connections
      const connections = await ctx.db.calendarConnection.findMany({
        where: {
          userId: ctx.session.user.id,
          isActive: true,
        },
      });

      if (connections.length === 0) {
        return { events: [] };
      }

      // First try to get events from the database that were synced
      const dbEvents = await ctx.db.meeting.findMany({
        where: {
          userId: ctx.session.user.id,
          externalId: { not: null },
          startTime: {
            gte: startOfDay,
            lte: endOfDay,
          },
        },
      });

      if (dbEvents.length > 0) {
        return { events: dbEvents };
      }

      // If no events found in DB, fetch events from each connected calendar
      const events = [];
      for (const connection of connections) {
        try {
          const calendarService = CalendarServiceFactory.getService(
            connection.provider,
          );

          const calendarEvents = await calendarService.fetchEvents(
            connection,
            startOfDay,
            endOfDay,
          );

          // Transform to Meeting format
          const meetingEvents = calendarEvents.map((event) => ({
            id: event.id,
            title: event.title,
            description: event.description,
            startTime: event.startTime,
            endTime: event.endTime,
            location: event.location,
            attendees: event.attendees,
            organizer: event.organizer,
            isRecurring: event.isRecurring,
            externalId: event.externalId,
            calendarId: event.calendarId,
            userId: ctx.session.user.id,
            createdAt: new Date(),
            updatedAt: new Date(),
          }));

          events.push(...meetingEvents);
        } catch (error) {
          console.error(
            `Error fetching events for connection ${connection.id}:`,
            error,
          );
          // Continue with other connections
        }
      }

      return { events };
    }),
});
