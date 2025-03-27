# Note Saving Flow Redesign - Core Improvements

## Current Issues

1. **Empty Content Saving**: Notes are saving with empty content `[]` instead of the actual note content that users write.
2. **Complex State Management**: The current implementation uses many `useState` hooks without a centralised state management approach.
3. **Poor Autosave UX**: The save bar appears and countdown starts immediately when a user begins writing, creating an intrusive experience.

## Proposed Solution - Core Improvements

After researching best practices and modern approaches, here's a focused redesign addressing the core issues with the note-saving flow.

### 1. State Management with Zustand

Zustand provides a simple, yet powerful state management solution that's perfect for our note-taking app:

```typescript
// src/store/noteStore.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

interface NoteState {
  // Note content by date (YYYY-MM-DD) or meetingId
  noteContents: Record<string, string>;

  // Dirty state to track unsaved changes
  dirtyNotes: Set<string>;

  // Last saved timestamps
  lastSaved: Record<string, Date>;

  // Actions
  setNoteContent: (key: string, content: string) => void;
  markAsSaved: (key: string) => void;
  isDirty: (key: string) => boolean;
  getContent: (key: string) => string | null;
}

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      noteContents: {},
      dirtyNotes: new Set<string>(),
      lastSaved: {},

      setNoteContent: (key: string, content: string) =>
        set((state) => {
          const newContents = { ...state.noteContents };
          newContents[key] = content;

          // Mark as dirty (unsaved)
          const newDirty = new Set(state.dirtyNotes);
          newDirty.add(key);

          return {
            noteContents: newContents,
            dirtyNotes: newDirty,
          };
        }),

      markAsSaved: (key: string) =>
        set((state) => {
          const newDirty = new Set(state.dirtyNotes);
          newDirty.delete(key);

          const newLastSaved = { ...state.lastSaved };
          newLastSaved[key] = new Date();

          return {
            dirtyNotes: newDirty,
            lastSaved: newLastSaved,
          };
        }),

      isDirty: (key: string) => get().dirtyNotes.has(key),

      getContent: (key: string) => get().noteContents[key] || null,
    }),
    {
      name: "note-storage", // localStorage key
      partialize: (state) => ({
        noteContents: state.noteContents,
        lastSaved: state.lastSaved,
      }),
    },
  ),
);
```

### 2. Enhanced Note Editor Component with Intelligent Autosave

```typescript
// src/components/editor/EnhancedNoteEditor.tsx
import { useEffect, useRef, useState } from 'react';
import { BlockNoteEditor } from './BlockNoteEditor';
import { useNoteStore } from '~/store/noteStore';
import { api } from '~/trpc/react';

interface EnhancedNoteEditorProps {
  id: string; // 'day-YYYY-MM-DD' or 'meeting-uuid'
  initialContent?: string;
  className?: string;
  theme?: 'light' | 'dark';
}

export const EnhancedNoteEditor = ({
  id,
  initialContent,
  className,
  theme = 'light',
}: EnhancedNoteEditorProps) => {
  const { setNoteContent, markAsSaved, isDirty, getContent } = useNoteStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Get initial content from store or prop
  const editorContent = getContent(id) || initialContent || '[{"type":"paragraph","content":[]}]';

  // tRPC mutations
  const saveDayNoteMutation = api.notes.saveDayNote.useMutation();

  // Function to save note content
  const saveNote = async (content: string) => {
    // Don't save empty content
    if (!content || content === '[{"type":"paragraph","content":[]}]') {
      return;
    }

    try {
      setIsSaving(true);

      // For day notes
      if (id.startsWith('day-')) {
        const dateString = id.replace('day-', '');
        await saveDayNoteMutation.mutateAsync({
          date: dateString,
          content,
        });
      }
      // For meeting notes (can add similar logic)

      // Update the store
      markAsSaved(id);
    } catch (error) {
      console.error('Failed to save note:', error);
    } finally {
      setIsSaving(false);
    }
  };

  // Intelligent autosave functionality
  const scheduleAutosave = (content: string) => {
    // Update local state immediately
    setNoteContent(id, content);

    // Clear any existing timeout
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    // Only schedule an autosave if the editor is active and content is not empty
    if (isActive && content && content !== '[{"type":"paragraph","content":[]}]') {
      saveTimeoutRef.current = setTimeout(() => {
        saveNote(content);
      }, 2000); // 2 second debounce
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, []);

  return (
    <div className={className}>
      <BlockNoteEditor
        initialContent={editorContent}
        onContentChange={(content) => scheduleAutosave(content)}
        onFocus={() => setIsActive(true)}
        onBlur={() => {
          setIsActive(false);
          // Save on blur if dirty
          if (isDirty(id)) {
            const content = getContent(id);
            if (content) saveNote(content);
          }
        }}
        theme={theme}
      />

      {/* Minimal, non-intrusive save indicator */}
      {isDirty(id) && (
        <div className="absolute bottom-2 right-2 text-xs text-muted-foreground transition-opacity">
          {isSaving ? 'Saving...' : 'Unsaved changes'}
        </div>
      )}
    </div>
  );
};
```

### 3. Improved FlowingNotesContent Component

```typescript
// src/app/_components/FlowingNotesContent/index.tsx (simplified)
"use client";

import { useState } from "react";
import { format } from "date-fns";
import { DayHeader } from "../DayHeader";
import { Card } from "~/components/ui/card";
import { EnhancedNoteEditor } from "~/components/editor/EnhancedNoteEditor";
import { useTheme } from "next-themes";

export function FlowingNotesContent() {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  const { resolvedTheme } = useTheme();
  const theme = resolvedTheme === "dark" ? "dark" : "light";

  // Format date for store key
  const formattedDate = format(currentDate, "yyyy-MM-dd");
  const noteId = `day-${formattedDate}`;

  return (
    <div className="container mx-auto px-4 py-6">
      <DayHeader
        date={currentDate}
        onChangeDate={setCurrentDate}
      />

      <Card className="mt-4 p-4">
        <EnhancedNoteEditor
          id={noteId}
          className="min-h-[300px]"
          theme={theme}
        />
      </Card>
    </div>
  );
}
```

### 4. Modified BlockNoteEditor Component

```typescript
// src/components/editor/BlockNoteEditor.tsx (modified)
"use client";

import { useState, useCallback, useRef } from "react";
import type { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { noteNomadTheme } from "./theme";

interface BlockNoteEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  theme?: "light" | "dark";
}

export const BlockNoteEditor = ({
  initialContent,
  onContentChange,
  onFocus,
  onBlur,
  editable = true,
  placeholder = "Start typing your notes here...",
  className,
  theme = "light",
}: BlockNoteEditorProps) => {
  // Parse initial content or create empty editor
  const initialBlocks = initialContent
    ? (() => {
        try {
          const parsed = JSON.parse(initialContent) as PartialBlock[];
          return parsed.length > 0
            ? parsed
            : [{ type: "paragraph", content: [] } as PartialBlock];
        } catch (error) {
          console.error("Error parsing initialContent:", error);
          return [{ type: "paragraph", content: [] } as PartialBlock];
        }
      })()
    : [{ type: "paragraph", content: [] } as PartialBlock];

  // Initialize the editor
  const editor = useCreateBlockNote({
    initialContent: initialBlocks,
    animations: true,
  });

  // Set editor to be editable or read-only
  editor.isEditable = editable;

  // Gets the current editor content as a string
  const getContentAsString = useCallback((): string => {
    const blocks = editor.topLevelBlocks;
    return JSON.stringify(blocks);
  }, [editor]);

  // Set up the editor change handler
  useEffect(() => {
    if (!onContentChange) return;

    const handleChange = () => {
      const contentString = getContentAsString();
      onContentChange(contentString);
    };

    // Subscribe to changes
    editor.onEditorContentChange(handleChange);
  }, [editor, getContentAsString, onContentChange]);

  // Apply the appropriate theme based on current theme setting
  const appliedTheme =
    theme === "dark" ? noteNomadTheme.dark : noteNomadTheme.light;

  // Add custom class for styling
  const editorClassName = `min-h-[200px] rounded-md border border-input p-3 focus-visible:outline-none ${className || ""}`;

  return (
    <div className="relative">
      <BlockNoteView
        editor={editor}
        theme={appliedTheme}
        className={editorClassName}
        onFocus={onFocus}
        onBlur={onBlur}
      />
    </div>
  );
};
```

## Implementation Benefits

1. **Solved Empty Content Issue**: The new system ensures content is validated before saving and preserves user input.

2. **Simplified State Management**: Using Zustand provides a centralized, easy-to-use state store with persistence.

3. **Improved Autosave UX**: The new approach:
   - Only shows minimal save indicators
   - Only autosaves after the user has been actively typing
   - Debounces save operations to prevent excessive API calls
   - Saves on blur for immediate persistence when leaving the editor

## Technical Implementation Plan

1. **Install Dependencies**:

   ```bash
   npm install zustand
   ```

2. **Create Store**:

   - Set up Zustand store for note state

3. **Enhance Editor Components**:

   - Create the improved EnhancedNoteEditor component
   - Update BlockNoteEditor to work with the new system

4. **Update UI Components**:
   - Simplify FlowingNotesContent and other components
   - Improve save indicators and user feedback

## Conclusion

This focused redesign addresses all three core issues without introducing excessive complexity. The simplified state management with Zustand makes the codebase more maintainable, the improved validation ensures notes save correctly, and the improved UX around saving provides a more seamless experience for users. Future enhancements like offline support can be added incrementally as needed.
