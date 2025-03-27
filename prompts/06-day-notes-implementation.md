# Step 7: Day Notes Implementation

## Overview

This plan focuses on implementing the flowing notes functionality using the FlowingNotesContent component. We'll connect the editor to the database to persistently store and retrieve notes for each day, implement a time-based note chaining system, and ensure a seamless note-taking experience while adhering to our design system principles.

## Prerequisites

- Basic day view layout implemented
- Todo functionality
- Prisma models for notes
- Design system guidelines (see prompts/design-system.md)

## Implementation Goals

- Implement the FlowingNotesContent component for timeline-based notes
- Create a system for adding and chaining notes in a chronological timeline
- Allow users to create new notes by clicking "Click to add a note..."
- Implement day-specific notes that load when a user selects a day
- Add metadata like creation timestamps for timeline organization
- Ensure notes persist correctly to the database for the selected day
- Apply design system styling consistently throughout the notes interface

## Detailed Steps

### 1. Create the FlowingNotesContent Component

Develop a component that:

- Displays notes in a chronological timeline format
- Shows time references for each note
- Provides a "Click to add a note..." prompt at the end of the timeline
- Handles the creation of new notes beneath the most recent note
- Maintains the flow and connection between notes

### 2. Implement tRPC Procedures for Notes

Create tRPC procedures for:

- Fetching notes for a specific date
- Creating a new note
- Updating note content
- Deleting notes
- Handling note metadata

### 3. Set Up Prisma Schema for Notes

Enhance the Prisma schema to:

- Store notes with appropriate date/time references
- Track creation and update timestamps
- Associate notes with specific days
- Store note content and metadata efficiently

### 4. Implement Note Chaining Functionality

Develop the logic to:

- Add new notes beneath the most recent note when "Click to add a note..." is clicked
- Maintain chronological ordering of notes
- Handle appropriate time references for each note
- Update the UI to reflect the timeline structure

### 5. Connect Notes to Day Selection

Ensure the notes system:

- Loads the relevant day's notes when a day is selected in the UI
- Saves notes to the correct day based on the current day selection
- Handles transitions between days smoothly
- Creates new note collections for days without existing notes

## Component Structure

```
components/
├── notes/
│   ├── FlowingNotesContent.tsx (main timeline-based notes component)
│   ├── NoteItem.tsx (individual note in the timeline)
│   └── AddNotePrompt.tsx (clickable prompt to add new notes)
```

## tRPC Routes

```
server/
├── routers/
│   └── notes.ts (tRPC procedures for note operations)
│       ├── getNotesByDate
│       ├── createNote
│       ├── updateNote
│       └── deleteNote
```

## Database Schema

```prisma
model Note {
  id          String    @id @default(cuid())
  content     String
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
  date        DateTime
  timeRef     DateTime  @default(now()) // For timeline ordering
  userId      String
  user        User      @relation(fields: [userId], references: [id])

  @@index([userId, date]) // For efficient querying by user and date
}
```

## Implementation Details

### FlowingNotesContent Component

The component should:

- Fetch and display notes for the selected day using tRPC
- Render notes in chronological order with time references
- Show the "Click to add a note..." prompt at the end
- Handle the creation of new notes when the prompt is clicked
- Update the UI optimistically when changes are made
- Save changes to the database via tRPC

### Note Creation Flow

When a user clicks "Click to add a note...":

1. Create a new note with the current timestamp
2. Position it below the most recent note in the timeline
3. Focus the editor for immediate input
4. Save the new note to the database for the selected day
5. Update the UI to show the new note in the chain

### Data Handling with tRPC and Prisma

- Use tRPC for type-safe API calls between client and server
- Implement appropriate validation for note data
- Use Prisma for all database operations
- Ensure efficient querying by indexing on user and date
- Handle optimistic updates for better UX
- Implement error handling and recovery

## UI Enhancements

- Show subtle timestamps for each note in the timeline
- Add visual connectors between notes to emphasize the chronological flow
- Use subtle animations when adding new notes
- Apply the design system principles:
  - Use the Paper White (`#F9F9F9`) background for note areas
  - Apply subtle borders with Light Grey (`#E0E0E0`)
  - Use the spacing system consistently
  - Maintain the typographic hierarchy with Inter for body text and Fraunces for headings

## Error Handling

- Implement robust error handling for failed tRPC calls
- Show appropriate error messages for connectivity issues
- Handle optimistic update failures gracefully
- Provide retry mechanisms for failed saves

## Testing Criteria

- Day notes can be created and chained in a timeline
- Clicking "Click to add a note..." adds a new note below the most recent one
- Notes save correctly to the database for the selected day
- Notes load correctly when navigating between days
- Time references display correctly for each note
- Error states are handled gracefully with user feedback

## Next Steps

After implementing the flowing notes functionality, the final step will be to create a simple meetings view that shows the day's meetings and allows for meeting-specific notes.

# Day Notes Implementation

> **Reference:** See `market-research.md` for our core features and user benefits. This implementation should focus on:
>
> - Fast, efficient note creation in a timeline format
> - Clean, distraction-free interface with chronological organization
> - Smart organization with time-based references
> - Quick access to daily content
> - Privacy-preserving data handling
