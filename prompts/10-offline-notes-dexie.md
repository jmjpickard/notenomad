# Offline-First Notes with Dexie.js - Enhancement

This document outlines the optional second phase of the note saving redesign, focused on adding offline capabilities with Dexie.js.

## Benefits of Offline-First Approach

1. **Resilience to Network Issues**: Notes are always available and can be edited without internet connection
2. **Improved Performance**: Local-first operations are faster than waiting for server responses
3. **Better User Experience**: No interruptions or data loss due to connection problems
4. **Reduced Server Load**: Fewer direct API calls as saves are batched and synchronized

## Implementation with Dexie.js

Dexie.js is a wrapper around IndexedDB that provides a simple and elegant API while retaining the power of the underlying database.

### 1. Database Setup

```typescript
// src/lib/db.ts
import Dexie, { Table } from "dexie";

interface NoteRecord {
  id: string; // 'day-YYYY-MM-DD' or 'meeting-uuid'
  content: string;
  updatedAt: Date;
  synced: boolean;
}

export class NotesDatabase extends Dexie {
  notes!: Table<NoteRecord, string>;

  constructor() {
    super("NotesDB");

    this.version(1).stores({
      notes: "id, updatedAt, synced",
    });
  }

  async saveNote(id: string, content: string): Promise<void> {
    await this.notes.put({
      id,
      content,
      updatedAt: new Date(),
      synced: false,
    });
  }

  async getSyncQueue(): Promise<NoteRecord[]> {
    return this.notes.where("synced").equals(false).toArray();
  }

  async markSynced(id: string): Promise<void> {
    await this.notes.update(id, { synced: true });
  }

  async getNote(id: string): Promise<NoteRecord | undefined> {
    return this.notes.get(id);
  }
}

export const db = new NotesDatabase();
```

### 2. Integration with Note Editor

Enhance the `EnhancedNoteEditor` component to work with the offline database:

```typescript
// src/components/editor/EnhancedNoteEditor.tsx (with offline support)
import { useEffect, useRef, useState } from "react";
import { BlockNoteEditor } from "./BlockNoteEditor";
import { useNoteStore } from "~/store/noteStore";
import { db } from "~/lib/db";
import { api } from "~/trpc/react";

// ... existing props interface ...

export const EnhancedNoteEditor = ({
  id,
  initialContent,
  className,
  theme = "light",
}: EnhancedNoteEditorProps) => {
  const { setNoteContent, markAsSaved, isDirty, getContent } = useNoteStore();
  const [isSaving, setIsSaving] = useState(false);
  const [isActive, setIsActive] = useState(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Load the initial content from IndexedDB first, then fall back to the store or props
  useEffect(() => {
    const loadContent = async () => {
      try {
        // Try to get the note from IndexedDB
        const dbNote = await db.getNote(id);

        if (dbNote?.content) {
          // If found in IndexedDB, set to the store
          setNoteContent(id, dbNote.content);
        } else if (initialContent) {
          // If not in IndexedDB but provided as prop, use that
          setNoteContent(id, initialContent);
        }
      } catch (error) {
        console.error("Failed to load note from IndexedDB:", error);
      }
    };

    loadContent();
  }, [id, initialContent, setNoteContent]);

  // Get content from the store or props
  const editorContent =
    getContent(id) || initialContent || '[{"type":"paragraph","content":[]}]';

  // tRPC mutations
  const saveDayNoteMutation = api.notes.saveDayNote.useMutation();

  // Function to save note content with offline support
  const saveNote = async (content: string) => {
    if (!content || content === '[{"type":"paragraph","content":[]}]') {
      return;
    }

    try {
      setIsSaving(true);

      // Always save to local DB first (offline-first)
      await db.saveNote(id, content);

      // Try to sync with server if online
      if (navigator.onLine) {
        // For day notes
        if (id.startsWith("day-")) {
          const dateString = id.replace("day-", "");
          await saveDayNoteMutation.mutateAsync({
            date: dateString,
            content,
          });

          // Mark as synced in local DB
          await db.markSynced(id);
        }
        // For meeting notes (can add similar logic)
      }

      // Update the store
      markAsSaved(id);
    } catch (error) {
      console.error("Failed to save note:", error);
      // Note remains in local DB unsaved and will be synced later
    } finally {
      setIsSaving(false);
    }
  };

  // ... existing autosave logic ...

  // Setup periodic sync for any unsaved notes when online
  useEffect(() => {
    const syncUnsavedNotes = async () => {
      if (navigator.onLine) {
        const unsavedNotes = await db.getSyncQueue();

        for (const note of unsavedNotes) {
          try {
            // Implement syncing logic based on note type
            if (note.id.startsWith("day-")) {
              const dateString = note.id.replace("day-", "");
              await saveDayNoteMutation.mutateAsync({
                date: dateString,
                content: note.content,
              });
              await db.markSynced(note.id);
            }
            // Handle other note types here
          } catch (error) {
            console.error(`Failed to sync note ${note.id}:`, error);
          }
        }
      }
    };

    // Sync when coming online
    window.addEventListener("online", syncUnsavedNotes);

    // Initial sync attempt
    syncUnsavedNotes();

    return () => {
      window.removeEventListener("online", syncUnsavedNotes);
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [saveDayNoteMutation]);

  // ... rest of the component ...
};
```

### 3. Sync Status Indicator

Add a sync status indicator to inform users about offline status:

```typescript
// src/components/SyncStatusIndicator.tsx
import { useState, useEffect } from 'react';
import { Wifi, WifiOff, CheckCircle2, AlertCircle } from 'lucide-react';
import { db } from '~/lib/db';

export const SyncStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingChanges, setPendingChanges] = useState(0);

  // Track online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Check for pending changes
  useEffect(() => {
    const checkPendingChanges = async () => {
      try {
        const unsyncedNotes = await db.getSyncQueue();
        setPendingChanges(unsyncedNotes.length);
      } catch (error) {
        console.error('Failed to check pending changes:', error);
      }
    };

    // Check initially and every 30 seconds
    checkPendingChanges();
    const interval = setInterval(checkPendingChanges, 30000);

    return () => clearInterval(interval);
  }, []);

  if (!isOnline) {
    return (
      <div className="flex items-center text-xs text-amber-500 gap-1">
        <WifiOff size={14} />
        <span>Offline mode</span>
      </div>
    );
  }

  if (pendingChanges > 0) {
    return (
      <div className="flex items-center text-xs text-blue-500 gap-1">
        <AlertCircle size={14} />
        <span>Syncing {pendingChanges} changes...</span>
      </div>
    );
  }

  return (
    <div className="flex items-center text-xs text-green-500 gap-1">
      <CheckCircle2 size={14} />
      <span>All changes synced</span>
    </div>
  );
};
```

## Technical Implementation Plan

1. **Install Dependencies**:

   ```bash
   npm install dexie
   ```

2. **Create Database Class**:

   - Implement the NotesDatabase class with Dexie.js
   - Define schemas and methods for CRUD operations

3. **Update Note Editor**:

   - Enhance the EnhancedNoteEditor to work with the local database
   - Implement the online/offline sync logic

4. **Add Sync Indicators**:
   - Create the SyncStatusIndicator component
   - Add it to the main layout or notes interface

## Benefits Over Core Implementation

The offline-first approach with Dexie.js provides several advantages over the core implementation:

1. **Resilience**: Works without internet connection
2. **Performance**: Faster saving and loading of notes
3. **User Experience**: No interruptions or data loss due to connection issues
4. **Background Syncing**: Changes are synced when connection is restored

This enhancement builds on the core improvements while adding significant value for users who need to work in environments with unreliable connectivity or who want to ensure their notes are always available.

## Integration with Core Improvements

This Dexie.js implementation can be seamlessly integrated with the core improvements already implemented:

1. It extends the Zustand state store with a more robust persistence layer
2. It enhances the save flow with offline capabilities
3. It maintains the improved autosave UX while adding sync status indicators

The implementation is designed to be added incrementally without disrupting the existing improvements.
