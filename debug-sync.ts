import { PrismaClient } from "@prisma/client";
import type { CalendarConnection } from "@prisma/client";
import { google } from "googleapis";

const prisma = new PrismaClient();

interface CalendarEvent {
  id: string;
  externalId: string;
  calendarId: string;
  title: string;
  description?: string | null;
  startTime: Date;
  endTime: Date;
  location?: string | null;
  attendees?: string | null;
  organizer?: string | null;
  isRecurring: boolean;
}

// Create a simplified version of the GoogleCalendarService
class GoogleCalendarDebugService {
  async fetchEvents(
    connection: CalendarConnection,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarEvent[]> {
    console.log("Fetching events using debug service...");

    // Create an OAuth2 client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

    // Set credentials
    oauth2Client.setCredentials({
      access_token: connection.accessToken,
    });

    // Create calendar service
    const calendar = google.calendar({ version: "v3", auth: oauth2Client });

    try {
      // Fetch events
      const response = await calendar.events.list({
        calendarId: connection.calendarId || "primary",
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      console.log(
        `Fetched ${response.data.items?.length || 0} events from Google Calendar`,
      );

      // Transform Google Calendar events to our format
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
      console.error("Error fetching events:", error);
      throw error;
    }
  }
}

async function main(): Promise<void> {
  try {
    console.log("Starting debug sync process");

    // Get all active calendar connections
    const connections = await prisma.calendarConnection.findMany({
      where: { isActive: true },
    });

    console.log(`Found ${connections.length} active calendar connections`);

    if (connections.length === 0) {
      console.log("No active calendar connections found. Exiting.");
      return;
    }

    // Create debug service
    const googleCalendarService = new GoogleCalendarDebugService();

    // Debug each connection
    for (const connection of connections) {
      console.log(
        `\nSyncing connection: ${connection.id} (${connection.provider} - ${connection.accountEmail})`,
      );

      try {
        if (connection.provider.toLowerCase() !== "google") {
          console.log(`Skipping non-Google provider: ${connection.provider}`);
          continue;
        }

        // Set date range for sync (next 7 days)
        const startDate = new Date();
        const endDate = new Date();
        endDate.setDate(endDate.getDate() + 7);
        console.log(
          `Fetching events from ${startDate.toISOString()} to ${endDate.toISOString()}`,
        );

        // Fetch events from calendar provider
        const events = await googleCalendarService.fetchEvents(
          connection,
          startDate,
          endDate,
        );
        console.log(`Fetched ${events.length} events from calendar provider`);

        if (events.length > 0) {
          console.log("First event:", JSON.stringify(events[0], null, 2));
        }

        // If we have events, try to add them to the database
        for (const event of events) {
          console.log(`Processing event: ${event.title}`);
          // Check if meeting already exists
          const existingMeeting = await prisma.meeting.findFirst({
            where: {
              externalId: event.externalId,
              calendarId: event.calendarId,
              userId: connection.userId,
            },
          });

          if (existingMeeting) {
            console.log(
              `Meeting already exists with ID: ${existingMeeting.id}`,
            );
          } else {
            // Create new meeting
            try {
              console.log(
                "Creating new meeting with data:",
                JSON.stringify(
                  {
                    title: event.title,
                    startTime: event.startTime,
                    endTime: event.endTime,
                    externalId: event.externalId,
                    calendarId: event.calendarId,
                  },
                  null,
                  2,
                ),
              );

              const newMeeting = await prisma.meeting.create({
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
              console.log(`Created new meeting with ID: ${newMeeting.id}`);
            } catch (error) {
              console.error("Error creating meeting:", error);
              console.error("Error details:", (error as Error).message);
              if ((error as any).meta) {
                console.error("Error metadata:", (error as any).meta);
              }
            }
          }
        }

        // Check if any meetings were added
        const meetings = await prisma.meeting.findMany({
          where: {
            userId: connection.userId,
            externalId: { not: null },
            calendarId: connection.calendarId,
          },
        });

        console.log(
          `Found ${meetings.length} meetings in the database for this connection`,
        );

        if (meetings.length > 0) {
          console.log("Sample meeting:", JSON.stringify(meetings[0], null, 2));
        }

        // Update lastSynced timestamp
        await prisma.calendarConnection.update({
          where: { id: connection.id },
          data: { lastSynced: new Date() },
        });
        console.log("Updated lastSynced timestamp");
      } catch (error) {
        console.error("Error syncing calendar:", error);
      }
    }
  } catch (error) {
    console.error("Top-level error:", error);
  }
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
