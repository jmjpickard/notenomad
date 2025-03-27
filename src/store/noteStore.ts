/**
 * Store for managing note state using Zustand
 */
import { create } from "zustand";
import { persist, type PersistOptions } from "zustand/middleware";

interface NoteState {
  // Note content by key (day-YYYY-MM-DD or meeting-uuid)
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

type NoteStorePersist = Omit<
  NoteState,
  "dirtyNotes" | "setNoteContent" | "markAsSaved" | "isDirty" | "getContent"
>;

export const useNoteStore = create<NoteState>()(
  persist(
    (set, get) => ({
      noteContents: {},
      dirtyNotes: new Set<string>(),
      lastSaved: {},

      setNoteContent: (key: string, content: string) =>
        set((state: NoteState) => {
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
        set((state: NoteState) => {
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
      partialize: (state: NoteState) => ({
        noteContents: state.noteContents,
        lastSaved: state.lastSaved,
      }),
    } as PersistOptions<NoteState, NoteStorePersist>,
  ),
);
