# Step 4: Notes Page Layout with Integrated Calendar

## Overview

This plan focuses on implementing a clean, intuitive notes page that integrates calendar functionality in a flowing layout. The design will prioritize simplicity and usability, following the "Space to Think" principle to reduce cognitive load and promote focused note-taking.

## Prerequisites

- Next.js application with authentication set up
- ShadCN UI components installed
- Prisma models for DayNote, Todo, Meeting, and Note
- Design system guidelines (see prompts/design-system.md)

## Implementation Goals

- Create a minimalist, distraction-free layout that promotes focus
- Implement a notes page with integrated calendar functionality
- Add a minimised sidebar with navigation icons and user profile
- Design a flowing note concept that combines meetings and notes in a single view
- Implement todos as an overlay to the main screen
- Ensure the layout works seamlessly across all devices
- Apply the design system's typography, spacing principles, and colour scheme

## Detailed Steps

### 1. Create the Main Notes Page

Create a new page component at `src/app/notes/page.tsx` that features:

- A clean layout with generous whitespace
- Simple authentication check with redirect for unauthenticated users
- A unified content area that integrates notes, meetings and calendar in a single flowing view
- Minimised sidebar with navigation icons and user profile

### 2. Implement the Sidebar

Create a minimised sidebar component that includes:

- Home icon for navigation to the main page
- Todo icon for toggling the todo overlay
- User avatar at the bottom with a popout menu containing a logout option
- Consistent with the design system's colour scheme
- Subtle hover and active states for better UX

### 3. Implement the Day Header

Create a minimal header component that includes:

- Current date in a clear, readable format
- Simple previous/next day navigation
- Optional: Quick actions menu for common tasks

### 4. Create the Main Content Area

Design a unified content area that:

- Implements the "single flowing note" concept that combines meetings and notes
- Uses a single-column layout for better readability
- Adapts dynamically to show different content types in a continuous flow
- Maintains consistent spacing and typography
- Provides clear visual hierarchy without overwhelming the user

### 5. Implement Todo Overlay

Create a todo overlay component that:

- Appears when toggled via the sidebar todo icon
- Displays as an overlay on top of the main content
- Allows users to quickly manage todos without losing context
- Maintains the design system's look and feel
- Can be easily dismissed to return to the main view

### 6. Implement Responsive Design

- Mobile-first approach with a single-column layout
- Tablet and desktop views maintain the same clean layout
- Content adapts naturally to different screen sizes
- Touch-friendly interactions for mobile users
- Sidebar remains minimised across all screen sizes

### 7. Add Basic State Management

- Simple state for current date selection
- Basic navigation between days
- Context for sharing date state across components
- Toggle state for the todo overlay

## Component Structure

```
app/
├── notes/
│   └── page.tsx (Main notes page with integrated calendar)
├── _components/
│   ├── Sidebar/
│   │   ├── index.tsx
│   │   └── UserProfileMenu.tsx
│   ├── DayHeader/
│   │   └── index.tsx
│   ├── TodoOverlay/
│   │   └── index.tsx
│   └── FlowingNotesContent/
│       └── index.tsx
```

## UI Design Guidelines

- Follow the "Space to Think" principle with generous whitespace
- Use the design system's colour scheme consistently throughout
- Apply typography guidelines with clear hierarchy
- Maintain consistent spacing using the 4px grid system
- Use subtle borders and shadows for depth
- Ensure high contrast for accessibility
- Keep interactive elements clearly visible but not distracting
- Design the sidebar to be minimal yet functional

## Testing Criteria

- Layout renders cleanly on all device sizes
- Sidebar functions correctly with user profile and logout
- Notes and calendar integration is intuitive and visually cohesive
- Date navigation is intuitive and reliable
- Content is easily readable and accessible
- Authentication flow works as expected
- Performance is smooth and responsive

## Next Steps

After completing this step, we'll move on to implementing the BlockNote.js integration for the notes component in the next prompt.
