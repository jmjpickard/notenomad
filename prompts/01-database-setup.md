# Step 1: Database Setup

## Overview

This plan outlines the process of initialising a local PostgreSQL database for the NoteMomad application and ensuring all migrations have been applied correctly.

## Prerequisites

- Docker or Podman installed on your machine
- Node.js and npm installed
- T3 stack application already initialised with Prisma

## Implementation Steps

### 1. Start the Local PostgreSQL Database

The project already has a `start-database.sh` script to handle database setup:

```bash
# Make the script executable
chmod +x start-database.sh

# Run the database startup script
./start-database.sh
```

This script will:

- Create and start a PostgreSQL container
- Configure the database with credentials from your .env file
- Make the database available on the port specified in your DATABASE_URL

### 2. Check Database Connection

Verify the database connection by using Prisma's built-in tools:

```bash
# Use Prisma Studio to verify database connection
npm run db:studio
```

This will open a browser window to Prisma Studio. If it connects successfully, your database setup is working.

### 3. Update Schema for NoteMomad

Add the required models to `prisma/schema.prisma`:

```prisma
// Existing models like User, Account, etc. will remain

model Meeting {
  id          String    @id @default(cuid())
  title       String
  description String?
  startTime   DateTime
  endTime     DateTime
  transcript  String?   @db.Text
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  createdBy   User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String

  notes       Note[]
}

model Note {
  id          String    @id @default(cuid())
  content     String    @db.Text
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String

  // Optional association with a meeting
  meeting     Meeting?  @relation(fields: [meetingId], references: [id], onDelete: SetNull)
  meetingId   String?

  // Association with a day's notes
  day         DayNote?  @relation(fields: [dayNoteId], references: [id])
  dayNoteId   String?
}

model DayNote {
  id          String    @id @default(cuid())
  date        DateTime  @unique
  summary     String?   @db.Text
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String

  notes       Note[]
  todos       Todo[]
}

model Todo {
  id          String    @id @default(cuid())
  content     String
  completed   Boolean   @default(false)
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt

  user        User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId      String

  // Association with a day's notes (optional)
  dayNote     DayNote?  @relation(fields: [dayNoteId], references: [id])
  dayNoteId   String?
}

// Update the User model to include relationships
model User {
  // Existing fields...

  meetings    Meeting[]
  notes       Note[]
  dayNotes    DayNote[]
  todos       Todo[]
}
```

### 4. Generate and Apply Migrations

```bash
# Generate migration files based on your schema changes
npm run db:generate

# Apply migrations to the database
npm run db:migrate
```

### 5. Verify Migrations

```bash
# Check that all tables are created correctly
npm run db:studio
```

Review the database structure in Prisma Studio to ensure all tables are created correctly.

## Troubleshooting

### Database Connection Issues

- Check that your PostgreSQL container is running: `docker ps` or `podman ps`
- Verify the DATABASE_URL in your .env file matches what the container is using
- Make sure the port is not being used by another service

### Migration Issues

- If migrations fail, check the Prisma error output
- You may need to reset the database: `npx prisma migrate reset`
- For development, you can use `npm run db:push` to bypass migrations

## Next Steps

After database setup, proceed to initialising ShadCN UI and setting up the theme for the application.
