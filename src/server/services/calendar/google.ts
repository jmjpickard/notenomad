import { google } from "googleapis";
import { db } from "~/server/db";
import { type CalendarConnection } from "@prisma/client";
import { env } from "~/env";
import {
  type CalendarEvent,
  type CalendarEventInput,
  type CalendarService,
} from "./interface";

/**
 * Implementation of the CalendarService interface for Google Calendar
 */
export class GoogleCalendarService implements CalendarService {
  /**
   * Creates a new OAuth2 client for Google APIs
   */
  private createOAuth2Client() {
    return new google.auth.OAuth2(
      env.GOOGLE_CLIENT_ID,
      env.GOOGLE_CLIENT_SECRET,
      `${env.AUTH_URL}/api/auth/callback/google`,
    );
  }

  /**
   * Authorizes with Google Calendar API using the provided code
   */
  async authorize(code: string, userId: string): Promise<CalendarConnection> {
    const oauth2Client = this.createOAuth2Client();

    try {
      const { tokens } = await oauth2Client.getToken(code);

      // Get user information to obtain email
      oauth2Client.setCredentials(tokens);
      const oauth2 = google.oauth2({ version: "v2", auth: oauth2Client });
      const userInfoResponse = await oauth2.userinfo.get();
      const email = userInfoResponse.data.email || "";
      const name = userInfoResponse.data.name || "";

      // Create or update the calendar connection in the database
      return await db.calendarConnection.upsert({
        where: {
          userId_provider_accountEmail: {
            userId,
            provider: "google",
            accountEmail: email,
          },
        },
        update: {
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          isActive: true,
          lastSynced: new Date(),
        },
        create: {
          provider: "google",
          accountEmail: email,
          accountName: name,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token!,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
          calendarId: "primary", // Default to primary calendar
          isActive: true,
          userId,
        },
      });
    } catch (error) {
      console.error("Failed to authorize with Google Calendar:", error);
      throw new Error("Could not authorize with Google Calendar");
    }
  }

  /**
   * Refreshes an expired access token
   */
  async refreshAccessToken(
    connection: CalendarConnection,
  ): Promise<CalendarConnection> {
    const oauth2Client = this.createOAuth2Client();

    try {
      oauth2Client.setCredentials({
        refresh_token: connection.refreshToken,
      });

      const { tokens } = await oauth2Client.refreshAccessToken();

      // Update the token in the database
      const updatedConnection = await db.calendarConnection.update({
        where: { id: connection.id },
        data: {
          accessToken: tokens.access_token,
          tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
        },
      });

      return updatedConnection;
    } catch (error) {
      console.error("Failed to refresh access token:", error);
      throw new Error("Could not refresh access token");
    }
  }

  /**
   * Fetches events from Google Calendar for a date range
   */
  async fetchEvents(
    connection: CalendarConnection,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarEvent[]> {
    // Check if token needs refresh
    if (
      connection.tokenExpiry &&
      connection.tokenExpiry < new Date() &&
      connection.refreshToken
    ) {
      connection = await this.refreshAccessToken(connection);
    }

    const oauth2Client = this.createOAuth2Client();

    try {
      oauth2Client.setCredentials({
        access_token: connection.accessToken,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      const response = await calendar.events.list({
        calendarId: connection.calendarId || "primary",
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      // Transform Google Calendar events to our CalendarEvent interface format
      return (
        response.data.items?.map((event) => ({
          id: `cal-${event.id}`,
          externalId: event.id || "",
          calendarId: connection.calendarId || "primary",
          title: event.summary || "Untitled Event",
          description: event.description,
          startTime: new Date(event.start?.dateTime || event.start?.date || ""),
          endTime: new Date(event.end?.dateTime || event.end?.date || ""),
          location: event.location,
          attendees: event.attendees
            ? JSON.stringify(event.attendees)
            : undefined,
          organizer: event.organizer?.email,
          isRecurring: !!event.recurringEventId,
        })) || []
      );
    } catch (error) {
      console.error("Failed to fetch events from Google Calendar:", error);
      throw new Error("Could not fetch events from Google Calendar");
    }
  }

  /**
   * Creates a new event in Google Calendar
   */
  async createEvent(
    connection: CalendarConnection,
    eventDetails: CalendarEventInput,
  ): Promise<CalendarEvent> {
    // Check if token needs refresh
    if (
      connection.tokenExpiry &&
      connection.tokenExpiry < new Date() &&
      connection.refreshToken
    ) {
      connection = await this.refreshAccessToken(connection);
    }

    const oauth2Client = this.createOAuth2Client();

    try {
      oauth2Client.setCredentials({
        access_token: connection.accessToken,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      // Format the attendees
      const attendeesArray = eventDetails.attendees?.map((email) => ({
        email,
      }));

      // Create the event
      const response = await calendar.events.insert({
        calendarId: connection.calendarId || "primary",
        requestBody: {
          summary: eventDetails.title,
          description: eventDetails.description,
          start: {
            dateTime: eventDetails.startTime.toISOString(),
          },
          end: {
            dateTime: eventDetails.endTime.toISOString(),
          },
          location: eventDetails.location,
          attendees: attendeesArray,
        },
      });

      const event = response.data;

      return {
        id: `cal-${event.id}`,
        externalId: event.id || "",
        calendarId: connection.calendarId || "primary",
        title: event.summary || "Untitled Event",
        description: event.description,
        startTime: new Date(event.start?.dateTime || event.start?.date || ""),
        endTime: new Date(event.end?.dateTime || event.end?.date || ""),
        location: event.location,
        attendees: event.attendees
          ? JSON.stringify(event.attendees)
          : undefined,
        organizer: event.organizer?.email,
        isRecurring: !!event.recurringEventId,
      };
    } catch (error) {
      console.error("Failed to create event in Google Calendar:", error);
      throw new Error("Could not create event in Google Calendar");
    }
  }

  /**
   * Updates an existing event in Google Calendar
   */
  async updateEvent(
    connection: CalendarConnection,
    eventId: string,
    eventDetails: CalendarEventInput,
  ): Promise<CalendarEvent> {
    // Check if token needs refresh
    if (
      connection.tokenExpiry &&
      connection.tokenExpiry < new Date() &&
      connection.refreshToken
    ) {
      connection = await this.refreshAccessToken(connection);
    }

    const oauth2Client = this.createOAuth2Client();

    try {
      oauth2Client.setCredentials({
        access_token: connection.accessToken,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      // Format the attendees
      const attendeesArray = eventDetails.attendees?.map((email) => ({
        email,
      }));

      // Update the event
      const response = await calendar.events.update({
        calendarId: connection.calendarId || "primary",
        eventId,
        requestBody: {
          summary: eventDetails.title,
          description: eventDetails.description,
          start: {
            dateTime: eventDetails.startTime.toISOString(),
          },
          end: {
            dateTime: eventDetails.endTime.toISOString(),
          },
          location: eventDetails.location,
          attendees: attendeesArray,
        },
      });

      const event = response.data;

      return {
        id: `cal-${event.id}`,
        externalId: event.id || "",
        calendarId: connection.calendarId || "primary",
        title: event.summary || "Untitled Event",
        description: event.description,
        startTime: new Date(event.start?.dateTime || event.start?.date || ""),
        endTime: new Date(event.end?.dateTime || event.end?.date || ""),
        location: event.location,
        attendees: event.attendees
          ? JSON.stringify(event.attendees)
          : undefined,
        organizer: event.organizer?.email,
        isRecurring: !!event.recurringEventId,
      };
    } catch (error) {
      console.error("Failed to update event in Google Calendar:", error);
      throw new Error("Could not update event in Google Calendar");
    }
  }

  /**
   * Deletes an event from Google Calendar
   */
  async deleteEvent(
    connection: CalendarConnection,
    eventId: string,
  ): Promise<boolean> {
    // Check if token needs refresh
    if (
      connection.tokenExpiry &&
      connection.tokenExpiry < new Date() &&
      connection.refreshToken
    ) {
      connection = await this.refreshAccessToken(connection);
    }

    const oauth2Client = this.createOAuth2Client();

    try {
      oauth2Client.setCredentials({
        access_token: connection.accessToken,
      });

      const calendar = google.calendar({ version: "v3", auth: oauth2Client });

      // Delete the event
      await calendar.events.delete({
        calendarId: connection.calendarId || "primary",
        eventId,
      });

      return true;
    } catch (error) {
      console.error("Failed to delete event from Google Calendar:", error);
      throw new Error("Could not delete event from Google Calendar");
    }
  }
}
