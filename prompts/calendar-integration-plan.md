# Calendar Integration Implementation Plan

## Overview

This document outlines the implementation plan for integrating calendar functionality into the NoteMomad application. The goal is to allow users to connect to multiple calendar providers (Google Calendar initially, with Microsoft/Outlook and Yahoo as potential future additions), view meetings in the timeline alongside notes, and create/link notes to meetings.

## 1. Database Schema Updates

### 1.1 Update Meeting Model

Enhance the existing `Meeting` model with additional fields:

```prisma
model Meeting {
  id            String   @id @default(cuid())
  title         String
  description   String?
  startTime     DateTime
  endTime       DateTime
  transcript    String?  @db.Text
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt
  location      String?
  attendees     String?  @db.Text
  organizer     String?
  isRecurring   Boolean  @default(false)
  externalId    String?  // Store external calendar event ID
  calendarId    String?  // Reference to the source calendar

  createdBy User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String

  notes Note[]
}
```

### 1.2 Add CalendarConnection Model

Create a new model to store calendar provider connections:

```prisma
model CalendarConnection {
  id            String   @id @default(cuid())
  provider      String   // e.g., "google", "outlook", "yahoo"
  accountEmail  String
  accountName   String?
  refreshToken  String   @db.Text
  accessToken   String?  @db.Text
  tokenExpiry   DateTime?
  calendarId    String?  // External calendar ID
  isActive      Boolean  @default(true)
  lastSynced    DateTime?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId String

  @@unique([userId, provider, accountEmail])
}
```

### 1.3 Update User Model

Add the relationship to link `User` with `CalendarConnection`:

```prisma
model User {
  // Existing fields...
  calendarConnections CalendarConnection[]
}
```

## 2. Backend Implementation

### 2.1 Authentication Setup with NextAuth.js

Extend the current authentication system to include Google Calendar scopes:

```typescript
// pages/api/auth/[...nextauth].js or src/server/auth/[...nextauth].ts
import NextAuth from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export default NextAuth({
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      authorization: {
        params: {
          scope:
            "https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/calendar",
        },
      },
    }),
    // Other providers...
  ],
  callbacks: {
    async jwt({ token, account }) {
      // Save the access token and refresh token to the token
      if (account) {
        token.accessToken = account.access_token;
        token.refreshToken = account.refresh_token;
        token.providerAccountId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      // Send properties to the client
      session.accessToken = token.accessToken;
      return session;
    },
    async signIn({ user, account, profile }) {
      // Store or update CalendarConnection in database
      if (account.provider === "google") {
        // Create or update CalendarConnection record
        // with account.refresh_token and account.access_token
      }
      return true;
    },
  },
  // ...other config
});
```

### 2.2 Calendar Service Interface

Create a common interface for all calendar providers:

```typescript
// src/server/services/calendar/interface.ts
interface CalendarService {
  authorize(code: string): Promise<CalendarConnection>;
  refreshAccessToken(
    connection: CalendarConnection,
  ): Promise<CalendarConnection>;
  fetchEvents(
    connection: CalendarConnection,
    startDate: Date,
    endDate: Date,
  ): Promise<CalendarEvent[]>;
  createEvent(
    connection: CalendarConnection,
    eventDetails: CalendarEventInput,
  ): Promise<CalendarEvent>;
  updateEvent(
    connection: CalendarConnection,
    eventId: string,
    eventDetails: CalendarEventInput,
  ): Promise<CalendarEvent>;
  deleteEvent(
    connection: CalendarConnection,
    eventId: string,
  ): Promise<boolean>;
}
```

### 2.3 Google Calendar Service Implementation

Implement the Google Calendar provider using the googleapis package:

```typescript
// src/server/services/calendar/google.ts
import { google } from "googleapis";
import { prisma } from "~/server/db";
import type { CalendarConnection } from "@prisma/client";

export class GoogleCalendarService implements CalendarService {
  async authorize(code: string): Promise<CalendarConnection> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + "/api/auth/callback/google",
    );

    const { tokens } = await oauth2Client.getToken(code);

    // Store the connection in the database
    // Return the connection
  }

  async refreshAccessToken(
    connection: CalendarConnection,
  ): Promise<CalendarConnection> {
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.NEXTAUTH_URL + "/api/auth/callback/google",
    );

    oauth2Client.setCredentials({
      refresh_token: connection.refreshToken,
    });

    const { tokens } = await oauth2Client.refreshAccessToken();

    // Update the token in the database
    const updatedConnection = await prisma.calendarConnection.update({
      where: { id: connection.id },
      data: {
        accessToken: tokens.access_token,
        tokenExpiry: tokens.expiry_date ? new Date(tokens.expiry_date) : null,
      },
    });

    return updatedConnection;
  }

  async fetchEvents(
    connection: CalendarConnection,
    startDate: Date,
    endDate: Date,
  ) {
    // Check if token needs refresh
    if (connection.tokenExpiry && connection.tokenExpiry < new Date()) {
      connection = await this.refreshAccessToken(connection);
    }

    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
    );

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

    // Transform Google Calendar events to our Meeting model format
    return response.data.items.map((event) => ({
      id: `cal-${event.id}`,
      externalId: event.id,
      calendarId: connection.calendarId || "primary",
      title: event.summary || "Untitled Event",
      description: event.description,
      startTime: new Date(event.start.dateTime || event.start.date),
      endTime: new Date(event.end.dateTime || event.end.date),
      location: event.location,
      attendees: event.attendees ? JSON.stringify(event.attendees) : null,
      organizer: event.organizer ? event.organizer.email : null,
      isRecurring: !!event.recurringEventId,
    }));
  }

  // Implement other methods...
}
```

### 2.4 Calendar Factory Service

Create a factory to instantiate the appropriate provider:

```typescript
// src/server/services/calendar/factory.ts
class CalendarServiceFactory {
  static getService(provider: string): CalendarService {
    switch (provider.toLowerCase()) {
      case "google":
        return new GoogleCalendarService();
      case "microsoft":
      case "outlook":
        return new MicrosoftCalendarService();
      case "yahoo":
        return new YahooCalendarService();
      default:
        throw new Error(`Unsupported calendar provider: ${provider}`);
    }
  }
}
```

### 2.5 Calendar Sync Service

Create a service to handle periodic synchronization:

```typescript
// src/server/services/calendar/sync.ts
class CalendarSyncService {
  async syncAllCalendars(): Promise<void> {
    // Fetch all active calendar connections
    const connections = await prisma.calendarConnection.findMany({
      where: { isActive: true },
    });

    // For each connection, sync events
    for (const connection of connections) {
      await this.syncCalendarConnection(connection);
    }
  }

  async syncUserCalendars(userId: string): Promise<void> {
    // Fetch all active calendar connections for a user
    const connections = await prisma.calendarConnection.findMany({
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
      const existingMeetings = await prisma.meeting.findMany({
        where: {
          userId: connection.userId,
          externalId: { not: null },
          calendarId: connection.calendarId,
        },
      });

      // Compare and update meetings
      // ...

      // Update lastSynced timestamp
      await prisma.calendarConnection.update({
        where: { id: connection.id },
        data: { lastSynced: new Date() },
      });
    } catch (error) {
      console.error("Failed to sync calendar:", error);
      // Handle error (maybe mark connection as problematic after X failures)
    }
  }
}
```

### 2.6 TRPC Router for Calendar API

Add a new router to handle calendar operations:

```typescript
// src/server/api/routers/calendar.ts
import { z } from "zod";
import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";

export const calendarRouter = createTRPCRouter({
  // Get all calendar connections for the authenticated user
  getConnections: protectedProcedure.query(async ({ ctx }) => {
    return await ctx.db.calendarConnection.findMany({
      where: { userId: ctx.session.user.id },
    });
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

      // Fetch events from each connected calendar
      const events = [];
      for (const connection of connections) {
        const calendarService = CalendarServiceFactory.getService(
          connection.provider,
        );
        const calendarEvents = await calendarService.fetchEvents(
          connection,
          startOfDay,
          endOfDay,
        );

        events.push(...calendarEvents);
      }

      return { events };
    }),

  // Other calendar procedures...
});
```

### 2.7 Update Meetings Router

Enhance the existing meetings router to include calendar functionality:

```typescript
// src/server/api/routers/meetings.ts
export const meetingsRouter = createTRPCRouter({
  // Get meetings for a specific date (with calendar meetings)
  getMeetingsByDate: protectedProcedure
    .input(getMeetingsByDateSchema)
    .query(async ({ ctx, input }) => {
      // Implementation with calendar data...
    }),

  // Create a meeting and optionally add to calendar
  createMeeting: protectedProcedure
    .input(createMeetingSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation with calendar integration...
    }),

  // Link a note to a meeting
  linkNoteToMeeting: protectedProcedure
    .input(linkNoteToMeetingSchema)
    .mutation(async ({ ctx, input }) => {
      // Implementation...
    }),
});
```

### 2.8 Backend Cron Job for Sync

Implement a scheduled job to periodically sync calendars:

```typescript
// src/server/tasks/calendarSync.ts
export async function syncCalendarsTask(): Promise<void> {
  const syncService = new CalendarSyncService();
  await syncService.syncAllCalendars();
}
```

## 3. Frontend Implementation

### 3.1 Calendar Connection UI

Create components for managing calendar connections:

- Calendar Connection Settings Page (`src/app/settings/calendars/page.tsx`)
- Calendar Provider Selection Component (`src/components/calendar/ProviderSelection.tsx`)
- Calendar Connection List Component (`src/components/calendar/ConnectionList.tsx`)
- Connection Status Indicator Component (`src/components/calendar/ConnectionStatus.tsx`)

### 3.2 Unified Timeline Component

Enhance the existing TimelineView component to display meetings:

#### 3.2.1 TimelineItem Component

Create a base component that can render either notes or meetings:

```typescript
// src/components/timeline/TimelineItem.tsx
interface TimelineItemProps {
  type: "note" | "meeting";
  id: string;
  content?: string;
  title?: string;
  timeRef: Date;
  startTime?: Date;
  endTime?: Date;
  attendees?: string[];
  location?: string;
  // ...other props
}
```

#### 3.2.2 TimelineMeetingItem Component

Create a component to display meetings in the timeline:

```typescript
// src/components/timeline/TimelineMeetingItem.tsx
interface TimelineMeetingItemProps {
  id: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  attendees?: string[];
  // ...other props
}
```

#### 3.2.3 Update TimelineView Component

Modify the existing TimelineView to handle both notes and meetings:

```typescript
// src/components/notes/TimelineView.tsx (updated)
interface TimelineViewProps {
  notes: TimelineNote[];
  meetings: TimelineMeeting[]; // Add meetings
  date: Date;
  // ...existing props
}
```

### 3.3 Meeting-Note Linking

Create components to handle linking notes to meetings:

- Meeting Note Editor (`src/components/notes/MeetingNoteEditor.tsx`)
- Meeting Notes List (`src/components/notes/MeetingNotesList.tsx`)
- Note-Meeting Link Button (`src/components/notes/NoteMeetingLink.tsx`)

### 3.4 Calendar State Management

Create state management hooks and stores for calendar data:

```typescript
// src/hooks/useCalendarConnections.ts
export function useCalendarConnections() {
  // Implementation using TRPC to fetch and manage calendar connections
  const { data, isLoading, error } = api.calendar.getConnections.useQuery();
  return { connections: data || [], isLoading, error };
}

// src/store/calendarStore.ts
interface CalendarState {
  connections: CalendarConnection[];
  isLoading: boolean;
  error: Error | null;
  // ...other state
}
```

## 4. Calendar Sync Process

### 4.1 Authentication Flow

1. User signs in with Google account (already set up with NextAuth.js)
2. System requests calendar scopes during authentication
3. NextAuth.js handles the OAuth flow and stores the tokens
4. Backend retrieves the tokens and creates a CalendarConnection record
5. Initial calendar sync is triggered

### 4.2 Periodic Sync

1. Cron job runs every X minutes (configurable)
2. For each active connection:
   - Check if token needs refreshing
   - Fetch recent events from the calendar provider
   - Compare with local database and update as needed

### 4.3 On-Demand Sync

1. User can manually trigger a sync from UI
2. System performs same process as periodic sync
3. UI shows sync status and last sync time

### 4.4 Data Mapping

Define how external calendar events map to internal Meeting model:

| Calendar Provider Field | Meeting Model Field |
| ----------------------- | ------------------- |
| Event ID                | externalId          |
| Title                   | title               |
| Description             | description         |
| Start Time              | startTime           |
| End Time                | endTime             |
| Location                | location            |
| Attendees               | attendees           |
| Organizer               | organizer           |
| Recurrence              | isRecurring         |

## 5. TimelineView Integration

### 5.1 Data Preparation

Combine notes and meetings in a unified timeline:

```typescript
// Example in page component
const { data: notesData } = api.notes.getDayNote.useQuery({
  date: formattedDate,
});

const { data: meetingsData } = api.calendar.getEvents.useQuery({
  date: formattedDate,
});

// Combine and sort by time
const timelineItems = useMemo(() => {
  const notes = notesData?.notes || [];
  const meetings = meetingsData?.events || [];

  return [
    ...notes.map((note) => ({
      ...note,
      type: "note" as const,
      time: new Date(note.timeRef),
    })),
    ...meetings.map((meeting) => ({
      ...meeting,
      type: "meeting" as const,
      time: new Date(meeting.startTime),
    })),
  ].sort((a, b) => a.time.getTime() - b.time.getTime());
}, [notesData, meetingsData]);
```

### 5.2 Rendering Logic

Modify TimelineView to render different item types:

```tsx
{
  timelineItems.map((item, index) =>
    item.type === "note" ? (
      <TimelineNoteItem
        key={`note-${item.id}`}
        id={item.id}
        content={item.content}
        timeRef={item.time}
        // ...other props
      />
    ) : (
      <TimelineMeetingItem
        key={`meeting-${item.id}`}
        id={item.id}
        title={item.title}
        startTime={item.startTime}
        endTime={item.endTime}
        // ...other props
      />
    ),
  );
}
```

### 5.3 Visual Style

Define a consistent visual language to differentiate items:

- Notes: Current styling with text editor focus
- Meetings: Calendar-style card with time block visualization
- Common: Chronological order, time indicator, action buttons

## 6. Implementation Phases

### Phase 1: Database and Core Backend (Week 1)

- Update Prisma schema
- Create migration
- Implement Google Calendar service interface
- Create TRPC endpoints for calendar management

### Phase 2: Authentication and Calendar Connection (Week 2)

- Implement OAuth flow with NextAuth.js for Google Calendar
- Create UI for managing calendar connections
- Implement token refresh and basic event fetching

### Phase 3: Calendar Sync and Meeting Display (Week 3)

- Implement full calendar sync process
- Create backend job for periodic sync
- Modify TimelineView to display meetings
- Create TimelineMeetingItem component

### Phase 4: Meeting-Note Integration (Week 4)

- Implement note-meeting linking
- Create specialized UI for meeting notes
- Polish timeline integration

### Phase 5: Testing and Refinement (Week 5)

- Test with Google Calendar provider
- Optimize sync process
- Handle edge cases
- Improve error handling

## 7. Required Dependencies

- Google Calendar API: `googleapis`
- NextAuth.js: For OAuth authentication
- Date/Time Handling: `date-fns` (already in project)

## 8. Considerations and Challenges

### 8.1 Authentication Security

- Secure storage of refresh tokens
- Proper token refresh handling
- User permission management

### 8.2 Sync Efficiency

- Incremental sync to minimize API calls
- Webhook-based updates when available
- Proper handling of recurring events

### 8.3 User Experience

- Clear visualization of different item types
- Intuitive controls for linking notes to meetings
- Performance considerations for large calendars

### 8.4 Error Handling

- API rate limits and quotas
- Network failures during sync
- Credentials expiration

## 9. Future Enhancements

- Calendar write-back (update external calendars)
- Meeting attendance confirmation
- Meeting invitation management
- Advanced recurring meeting handling
- Calendar sharing between users
- Calendar view alongside timeline
- Support for additional providers (Outlook, Yahoo)

## 10. UI Mockups

### 10.1 TimelineView with Meetings

```
+------------------------------------------+
| [Date Navigation] [Add Note] [Settings]  |
+------------------------------------------+
|                                          |
| 09:00 AM                                 |
| +--------------------------------------+ |
| | MEETING: Weekly Status Update       | |
| | 09:00 - 10:00 AM                    | |
| | Attendees: John, Sarah, Mike        | |
| | Location: Conference Room A         | |
| | [Add Note] [Join Meeting]           | |
| +--------------------------------------+ |
|                                          |
| 10:15 AM                                 |
| +--------------------------------------+ |
| | Note: Meeting follow-up             | |
| | Project timeline needs adjustment...| |
| | [Edit] [Delete]                     | |
| +--------------------------------------+ |
|                                          |
| 11:30 AM                                 |
| +--------------------------------------+ |
| | MEETING: Client Call - Acme Inc     | |
| | 11:30 AM - 12:00 PM                 | |
| | Attendees: Client Team, You         | |
| | [Add Note] [Join Meeting]           | |
| +--------------------------------------+ |
|                                          |
| 12:15 PM                                 |
| +--------------------------------------+ |
| | Note: Lunch ideas                   | |
| | Consider trying the new cafe...     | |
| | [Edit] [Delete]                     | |
| +--------------------------------------+ |
|                                          |
+------------------------------------------+
```

### 10.2 Calendar Connections Page

```
+------------------------------------------+
| Calendar Connections                     |
+------------------------------------------+
| Connected Calendars:                     |
|                                          |
| [Google] john.doe@gmail.com              |
| Last synced: 5 minutes ago               |
| [Sync Now] [Remove]                      |
|                                          |
| Add a new calendar:                      |
|                                          |
| [Google Calendar]                        |
|                                          |
| Sync Settings:                           |
| [x] Auto-sync every 15 minutes           |
| [x] Show calendar events in timeline     |
| [ ] Create notes for new meetings        |
|                                          |
+------------------------------------------+
```

### 10.3 Meeting Note Connection

```
+------------------------------------------+
| Meeting: Weekly Status Update            |
+------------------------------------------+
| Time: Monday, March 25, 2024 09:00-10:00 |
| Location: Conference Room A              |
| Attendees: John, Sarah, Mike             |
|                                          |
| Connected Notes:                         |
|                                          |
| 09:15 AM - Meeting agenda review         |
| 09:45 AM - Action items discussion       |
|                                          |
| [Add New Note]                           |
|                                          |
+------------------------------------------+
```

## 11. Conclusion

This implementation plan provides a comprehensive roadmap for integrating Google Calendar functionality into the NoteMomad application. By following the phased approach and addressing the outlined considerations, we can create a seamless experience that allows users to view and manage both notes and meetings in a unified timeline.
