import { type CalendarConnection } from "@prisma/client";

/**
 * Represents a calendar event from an external provider
 */
export interface CalendarEvent {
  id: string;
  externalId: string;
  calendarId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string;
  organizer?: string;
  isRecurring: boolean;
}

/**
 * Input for creating or updating calendar events
 */
export interface CalendarEventInput {
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
}

/**
 * Interface for calendar service providers
 */
export interface CalendarService {
  /**
   * Authorizes with the calendar provider using the OAuth code
   */
  authorize(code: string, userId: string): Promise<CalendarConnection>;

  /**
   * Refreshes an expired access token
   */
  refreshAccessToken(
    connection: CalendarConnection,
  ): Promise<CalendarConnection>;

  /**
   * Fetches events from the calendar provider for a date range
   */
  fetchEvents(
    connection: CalendarConnection,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarEvent[]>;

  /**
   * Creates a new event in the calendar
   */
  createEvent(
    connection: CalendarConnection,
    eventDetails: CalendarEventInput,
  ): Promise<CalendarEvent>;

  /**
   * Updates an existing event in the calendar
   */
  updateEvent(
    connection: CalendarConnection,
    eventId: string,
    eventDetails: CalendarEventInput,
  ): Promise<CalendarEvent>;

  /**
   * Deletes an event from the calendar
   */
  deleteEvent(
    connection: CalendarConnection,
    eventId: string,
  ): Promise<boolean>;
}
