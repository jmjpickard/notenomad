"use client";

import { useEffect, useCallback } from "react";
import type { PartialBlock } from "@blocknote/core";
import { useCreateBlockNote } from "@blocknote/react";
import { BlockNoteView } from "@blocknote/mantine";
import "@blocknote/core/fonts/inter.css";
import "@blocknote/mantine/style.css";
import { noteNomadTheme } from "./theme";

/**
 * Props for the BlockNoteEditor component
 */
interface BlockNoteEditorProps {
  initialContent?: string;
  onContentChange?: (content: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  editable?: boolean;
  _placeholder?: string;
  className?: string;
  theme?: "light" | "dark";
}

/**
 * A rich text editor component built on BlockNote.js
 */
export const BlockNoteEditor = ({
  initialContent,
  onContentChange,
  onFocus,
  onBlur,
  editable = true,
  _placeholder = "Start typing your notes here...",
  className,
  theme = "light",
}: BlockNoteEditorProps) => {
  // Parse initial content or create empty editor
  const initialBlocks = initialContent
    ? (() => {
        try {
          // Handle empty string case
          if (initialContent.trim() === "") {
            return [{ type: "paragraph", content: [] } as PartialBlock];
          }

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
  useEffect(() => {
    editor.isEditable = editable;
  }, [editor, editable]);

  /**
   * Gets the current editor content as a string
   */
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

    return () => {
      // Clean up handler (BlockNote handles this internally)
    };
  }, [editor, getContentAsString, onContentChange]);

  // Apply the appropriate theme based on current theme setting
  const appliedTheme =
    theme === "dark" ? noteNomadTheme.dark : noteNomadTheme.light;

  // Add custom class for styling
  const editorClassName = `min-h-[200px] w-full rounded-md border border-input p-3 focus-visible:outline-none ${className || ""}`;

  return (
    <div className="relative w-full">
      <BlockNoteView
        editor={editor}
        theme={appliedTheme}
        className={editorClassName}
        onFocus={onFocus}
        onBlur={onBlur}
        formattingToolbar={false}
      />
    </div>
  );
};
