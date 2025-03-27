import { type CalendarConnection, type Meeting } from "@prisma/client";
import { db } from "~/server/db";
import { CalendarServiceFactory } from "./factory";

/**
 * Service for synchronizing calendar events
 */
export class CalendarSyncService {
  /**
   * Synchronizes calendars for all users
   */
  async syncAllCalendars(): Promise<void> {
    // Fetch all active calendar connections
    const connections = await db.calendarConnection.findMany({
      where: { isActive: true },
    });

    // For each connection, sync events
    for (const connection of connections) {
      await this.syncCalendarConnection(connection);
    }
  }

  /**
   * Synchronizes calendars for a specific user
   */
  async syncUserCalendars(userId: string): Promise<void> {
    // Fetch all active calendar connections for a user
    const connections = await db.calendarConnection.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    // For each connection, sync events
    for (const connection of connections) {
      await this.syncCalendarConnection(connection);
    }
  }

  /**
   * Synchronizes events for a specific calendar connection
   */
  async syncCalendarConnection(connection: CalendarConnection): Promise<void> {
    try {
      const calendarService = CalendarServiceFactory.getService(
        connection.provider,
      );

      // Refresh token if necessary
      if (connection.tokenExpiry && connection.tokenExpiry < new Date()) {
        connection = await calendarService.refreshAccessToken(connection);
      }

      // Set date range for sync (e.g., next 30 days)
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + 30);

      // Fetch events from calendar provider
      const events = await calendarService.fetchEvents(
        connection,
        startDate,
        endDate,
      );

      // Fetch existing meetings from our database
      const existingMeetings = await db.meeting.findMany({
        where: {
          userId: connection.userId,
          externalId: { not: null },
          calendarId: connection.calendarId,
        },
      });

      // Create a map of existing meetings by externalId for faster lookup
      const existingMeetingsMap = new Map<string, Meeting>();
      for (const meeting of existingMeetings) {
        if (meeting.externalId) {
          existingMeetingsMap.set(meeting.externalId, meeting);
        }
      }

      // Process each event
      for (const event of events) {
        const existingMeeting = existingMeetingsMap.get(event.externalId);

        if (existingMeeting) {
          // Update existing meeting
          await db.meeting.update({
            where: { id: existingMeeting.id },
            data: {
              title: event.title,
              description: event.description,
              startTime: event.startTime,
              endTime: event.endTime,
              location: event.location,
              attendees: event.attendees,
              organizer: event.organizer,
              isRecurring: event.isRecurring,
              // Keep externalId and calendarId unchanged
            },
          });

          // Remove from map to track which meetings no longer exist
          existingMeetingsMap.delete(event.externalId);
        } else {
          // Create new meeting
          await db.meeting.create({
            data: {
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
              userId: connection.userId,
            },
          });
        }
      }

      // Optional: Handle deleted meetings
      // Uncomment if you want to delete meetings that no longer exist in the calendar
      /*
      for (const [_, meeting] of existingMeetingsMap) {
        await db.meeting.delete({
          where: { id: meeting.id },
        });
      }
      */

      // Update lastSynced timestamp
      await db.calendarConnection.update({
        where: { id: connection.id },
        data: { lastSynced: new Date() },
      });
    } catch (error) {
      console.error("Failed to sync calendar:", error);
      // Handle error (maybe mark connection as problematic after X failures)
    }
  }
}
