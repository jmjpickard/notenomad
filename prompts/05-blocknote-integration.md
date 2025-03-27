# BlockNote Integration

> **Reference:** See `market-research.md` for our core differentiators and feature development guidelines. This integration should prioritize:
>
> - Security-first approach with end-to-end encryption
> - Fast, responsive performance
> - Clean, intuitive interface
> - Privacy-preserving implementation

# Step 5: BlockNote.js Integration

## Overview

This plan focuses on integrating BlockNote.js as the rich text editor for the NoteNomad application. We'll implement a reusable notes component that supports three use cases: day notes, meeting-specific notes, and standalone notes with autosaving functionality, following the design principles established in our design system. The integration will be focused on the `/notes` page, maintaining the existing minimised sidebar and FlowingNotesContent design.

## Prerequisites

- Basic day view layout implemented from Step 4
- Next.js application with authentication set up
- Prisma models for Note, DayNote, and Meeting
- Design system guidelines (see prompts/design-system.md)
- Existing `/notes` page with FlowingNotesContent component

## Implementation Goals

- Add BlockNote.js to the project
- Create a reusable rich text editor component that aligns with our design system
- Notes are created and added as part of the FlowingNotesContent component in /notes
- Implement in-place note creation and editing (no modal popups)
- Set up a bottom bar notification system for saving notes
- Implement autosaving functionality after 5 seconds of inactivity
- Set up components to handle different note contexts (day notes, meeting notes, and standalone notes)
- Test the editor with local state before connecting to the database
- Ensure the editor styling matches our design system's aesthetics
- Support adding notes both connected to and independent from meetings

## Detailed Steps

### 1. Install BlockNote.js and Dependencies

```bash
# Install BlockNote.js and related dependencies
npm install @blocknote/core @blocknote/react @blocknote/mantine

# If using TipTap (which BlockNote is built on)
npm install @tiptap/react @tiptap/pm @tiptap/extension-image
```

### 2. Create a Basic Editor Component with SSR Considerations

Create a separate Editor component that:

- Uses the "use client" directive to ensure client-side only rendering
- Wraps BlockNote components in dynamic imports where needed
- Takes content as input and provides changes as output
- Has consistent styling with the rest of the application
- Integrates with our design system's theming using noteNomadTheme

```javascript
// components/editor/BlockNoteEditor.tsx
"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { noteNomadTheme } from "./theme";

export const BlockNoteEditor = ({
  initialContent,
  onSave,
  autoSaveInterval = 5000, // 5 seconds of inactivity before autosave
  theme = "light",
}) => {
  // Apply the appropriate theme
  const appliedTheme = theme === "dark" ? noteNomadTheme.dark : noteNomadTheme.light;

  // Rest of editor implementation
};
```

Implement proper dynamic imports in page components:

```javascript
// In page components
import dynamic from "next/dynamic";

const BlockNoteEditor = dynamic(
  () => import("~/components/editor/BlockNoteEditor"),
  { ssr: false },
);
```

### 3. In-Place Note Creation in FlowingNotesContent

Modify the FlowingNotesContent component to support in-place note creation:

```javascript
// components/notes/FlowingNotesContent.tsx
"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { SaveBar } from "~/components/notes/SaveBar";

const BlockNoteEditor = dynamic(
  () => import("~/components/editor/BlockNoteEditor"),
  { ssr: false },
);

export const FlowingNotesContent = () => {
  const [notes, setNotes] = useState([]);
  const [activeNoteId, setActiveNoteId] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showSaveBar, setShowSaveBar] = useState(false);

  // Handler for adding a new note in-place
  const handleAddNote = () => {
    const newNoteId = `note-${Date.now()}`;
    const newNote = {
      id: newNoteId,
      content: [],
      dateCreated: new Date(),
      isDraft: true,
    };

    setNotes([...notes, newNote]);
    setActiveNoteId(newNoteId);
    setShowSaveBar(true);
  };

  // Handler for saving a note
  const handleSaveNote = async (noteId, content) => {
    setIsSaving(true);
    try {
      // API call to save the note
      // Update the note in the notes array
      setNotes(
        notes.map((note) =>
          note.id === noteId
            ? { ...note, content, isDraft: false, lastUpdated: new Date() }
            : note,
        ),
      );
      setShowSaveBar(false);
    } catch (error) {
      // Handle error
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="flowing-notes-container">
      {/* Timeline or day view content */}

      {/* Notes list */}
      <div className="notes-list">
        {notes.map((note) => (
          <div key={note.id} className="note-item">
            {activeNoteId === note.id ? (
              <BlockNoteEditor
                initialContent={note.content}
                onSave={(content) => handleSaveNote(note.id, content)}
                autoSaveInterval={5000}
                onChanged={() => setShowSaveBar(true)}
              />
            ) : (
              <div
                className="note-preview"
                onClick={() => setActiveNoteId(note.id)}
              >
                {/* Note preview content */}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add note button - initiates in-place editing */}
      <button className="add-note-button" onClick={handleAddNote}>
        Add Note
      </button>

      {/* Bottom save bar that appears when editing */}
      {showSaveBar && (
        <SaveBar
          isVisible={showSaveBar}
          isSaving={isSaving}
          onSave={() =>
            activeNoteId &&
            handleSaveNote(
              activeNoteId,
              notes.find((n) => n.id === activeNoteId).content,
            )
          }
          onCancel={() => {
            setShowSaveBar(false);
            // Remove draft notes or revert changes
          }}
        />
      )}
    </div>
  );
};
```

### 4. Create Bottom Bar Save Component

Implement a SaveBar component that appears at the bottom of the screen:

```javascript
// components/notes/SaveBar.tsx
"use client";

import { useEffect, useState } from "react";

export const SaveBar = ({
  isVisible,
  isSaving,
  onSave,
  onCancel,
  autoSaveDelay = 5000, // 5 seconds
}) => {
  const [autoSaveTimer, setAutoSaveTimer] = useState(null);
  const [countdown, setCountdown] = useState(autoSaveDelay / 1000);

  // Reset the autosave timer whenever the component becomes visible
  useEffect(() => {
    if (isVisible) {
      setCountdown(autoSaveDelay / 1000);

      // Clear existing timer
      if (autoSaveTimer) {
        clearInterval(autoSaveTimer);
      }

      // Start new countdown
      const timer = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            onSave(); // Trigger save after countdown
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      setAutoSaveTimer(timer);

      return () => {
        clearInterval(timer);
      };
    }
  }, [isVisible, autoSaveDelay, onSave]);

  // If component becomes invisible, clear the timer
  useEffect(() => {
    if (!isVisible && autoSaveTimer) {
      clearInterval(autoSaveTimer);
    }
  }, [isVisible, autoSaveTimer]);

  if (!isVisible) return null;

  return (
    <div className="save-bar">
      <div className="save-message">
        {isSaving ? "Saving..." : `Autosaving in ${countdown} seconds`}
      </div>
      <div className="save-actions">
        <button className="save-button" onClick={onSave} disabled={isSaving}>
          Save Now
        </button>
        <button
          className="cancel-button"
          onClick={onCancel}
          disabled={isSaving}
        >
          Cancel
        </button>
      </div>
    </div>
  );
};
```

### 5. Implement Local State Management

Before connecting to the database:

- Set up React state to manage editor content
- Implement a 5-second autosave functionality
- Create methods for loading and saving content
- Handle proper state management for each note type
- Implement error handling with user-friendly feedback using toast notifications

### 6. Add Editor Customization Options

Configure the editor with:

- Appropriate toolbar options
- Custom styling to match the NoteNomad design system
- Support for different block types (headings, lists, code blocks, etc.)
- Image upload support
- Apply the typography guidelines from the design system
- Ensure TypeScript type safety throughout the implementation

### 7. Create Context-Aware Wrapper Components

Implement wrapper components that:

- Handle different types of notes (day notes, meeting notes)
- Manage appropriate metadata (creation date, association with day/meeting)
- Conditionally render different toolbars or options based on context
- Support creating notes for meetings or independent notes
- Implement user-friendly error handling with appropriate messaging

## Component Structure

```
components/
├── editor/
│   ├── BlockNoteEditor.tsx (core editor component)
│   ├── DayNoteEditor.tsx (day-specific wrapper)
│   ├── MeetingNoteEditor.tsx (meeting-specific wrapper)
│   ├── theme.ts (editor theming to match design system)
│   └── EditorToolbar.tsx (customizable toolbar - optional for first iteration)
├── notes/
│   ├── FlowingNotesContent.tsx (container for notes display and editing)
│   ├── SaveBar.tsx (bottom notification bar for saving notes)
│   ├── NoteItem.tsx (individual note component)
│   └── AddNoteButton.tsx (button to trigger in-place note creation)
```

## Implementation Details

### BlockNote Configuration

Example configuration options to consider:

- Default block types and formatting options (headings, lists, quotes, code blocks)
- Custom UI elements to match our design system
- Theme customization using our colour palette via noteNomadTheme
- Typography configuration using Inter for body text and Fraunces for headings
- Custom highlight colours that match our design system

### Next.js Specific Optimizations

- Use dynamic imports with { ssr: false } for all BlockNote components
- Implement code splitting to reduce initial bundle size
- Use the "use client" directive on all components using BlockNote
- Create separate components for editor vs. display views
- Optimize static assets and implement proper caching strategies

### Performance Considerations

- Implement lazy loading for editor components
- Use Incremental Static Regeneration where applicable
- Consider browser caching strategies for editor assets
- Optimize the initial load time through proper code splitting
- Consider using lightweight alternatives when appropriate

### Autosave Implementation and Bottom Bar Notification

- Implement a 5-second inactivity timer before autosaving
- Add visual countdown in the bottom bar (SaveBar component)
- Show "Saving..." state during active save operations
- Add option to "Save Now" button to immediately save changes
- Include "Cancel" button to discard changes for draft notes
- Provide visual indication of save status (saving, saved, error) using toast notifications
- Handle failed saves gracefully with error recovery options
- Store drafts locally before syncing to the database

**Database Integration Plan:**

- Create API endpoints for fetching and updating notes
- Implement proper refetching of notes after successful saves
- Implement optimistic updates for better UX (show as saved immediately, revert if save fails)
- Keep local storage as offline fallback/cache mechanism
- Implement API routes in app/api/notes/ for day and meeting notes

### Note Types Implementation

#### Day Notes

- Associated with a specific date
- Automatically created when viewing a day with no existing notes
- Identified by the date as a unique key
- Persistence via API endpoints and Prisma

#### Meeting Notes

- Associated with a specific meeting
- Created when adding notes to a meeting
- Identified by the meeting ID as a unique key
- May include specialized formatting options relevant to meetings
- Persistence via API endpoints and Prisma

#### Standalone Notes (Future Consideration)

- Independent notes not tied to dates or meetings
- Have their own unique identifiers
- Can be categorized or tagged
- Implementation details to be determined in a future iteration

### Context-Specific Features

**Day Notes:**

- General-purpose formatting options
- Date-based organization
- Timeline integration in flowing notes view

**Meeting Notes:**

- Quick actions for inserting action items or decisions
- Meeting-specific metadata
- Integration with meeting details in the UI

### User Feedback and Error Handling

- Implement toast notifications using the existing sonner component for:
  - Save status (saving, saved, error)
  - Error messages (network errors, database errors)
  - Success confirmations
- Potential error scenarios to handle:
  - Network connectivity issues
  - Database errors
  - Content validation errors
  - Authentication/permission errors

### UI Considerations

- Editor should initialize in-place when "Add Note" is clicked (no modals)
- Bottom save bar should appear when editing and show countdown to autosave
- Editor should resize appropriately within its container
- Focus states should be visibly clear
- Toolbar should be accessible and intuitive
- Mobile-friendly design with appropriate touch targets
- Follow the spacing system from the design system (4px grid)
- Use the colour palette defined in the design system
- Apply appropriate border radius values (8px) from the design system
- Ensure sufficient contrast for readability and WCAG AA compliance
- Test with screen readers and implement necessary accessibility features

### Integration with Flowing Notes Design

- Support for adding notes within the flowing notes timeline
- Ability to add notes connected to meetings in the timeline
- Maintain the existing minimised sidebar and FlowingNotesContent design
- Implementation focus on day notes and meeting notes in the first iteration
- Consistent styling with the rest of the flowing notes interface

## Testing Strategy

- Unit tests for the core editor functionality in BlockNoteEditor.tsx
- Integration tests for DayNoteEditor.tsx and MeetingNoteEditor.tsx to verify database interaction
- End-to-end tests to validate the complete flow from UI input to database persistence
- Accessibility testing to ensure proper screen reader support
- Performance testing to verify smooth operation on various devices

## Testing Criteria

- Editor loads and renders properly in all contexts
- Content can be added, edited, and formatted
- Bottom save bar appears when editing with correct countdown
- Autosave triggers after 5 seconds of inactivity
- In-place note creation works correctly (no modal popups)
- Database persistence functions as expected
- Different formatting options function as expected
- Editor maintains state between renders
- Notes can be successfully associated with meetings
- UI remains responsive and accessible on all device sizes
- Screen reader compatibility works correctly
- Error states are handled gracefully with appropriate user feedback
- Performance remains smooth on various devices

## Next Steps

1. **Database Integration:** Modify `FlowingNotesContent.tsx` to fetch and save notes to the database using Prisma. Implement API endpoints (as detailed in Step 7 and 8 prompts) for fetching and updating day and meeting notes.

2. **Apply Design System Theme:** Integrate the `noteNomadTheme` from `components/editor/theme.ts` into `BlockNoteEditor.tsx`, dynamically switching between light and dark themes using context.

3. **Refine Error Handling:** Implement user-friendly error feedback for save operations and data loading within the `SaveBar.tsx` component using toast notifications with `sonner`.

4. **Testing:** Implement unit tests for `BlockNoteEditor.tsx` and integration tests for `FlowingNotesContent.tsx` to verify in-place editing, bottom save bar functionality, and data persistence.

5. **Todo Functionality Implementation:** Move on to implementing the Todo functionality as outlined in the project roadmap.

## Maintenance Considerations

- Regularly update BlockNote dependencies to benefit from bug fixes and improvements
- Monitor for changes in the Next.js API that might affect the integration
- Implement analytics to track editor usage and identify potential issues
- Create a test suite to catch regressions during future updates
