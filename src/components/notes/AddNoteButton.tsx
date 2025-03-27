"use client";

import { Plus } from "lucide-react";
import { Button } from "~/components/ui/button";

/**
 * Props for the AddNoteButton component
 */
interface AddNoteButtonProps {
  onClick: () => void;
  label?: string;
  variant?: "primary" | "ghost" | "outline" | "dashed";
  className?: string;
}

/**
 * A reusable button component for adding notes with consistent styling
 */
export const AddNoteButton = ({
  onClick,
  label = "Add Note",
  variant = "primary",
  className = "",
}: AddNoteButtonProps) => {
  // Style mapping based on variant
  const variantStyles = {
    primary: "bg-[#4A90E2] text-white hover:bg-[#3A7BC8]",
    ghost: "text-[#607D8B] hover:bg-[#F5F5F5] hover:text-[#424242]",
    outline:
      "border border-[#E0E0E0] text-[#607D8B] hover:bg-[#F5F5F5] hover:text-[#424242]",
    dashed:
      "cursor-pointer rounded-md border border-dashed border-[#E0E0E0] p-6 text-center text-[#607D8B] hover:border-[#4A90E2]",
  };

  // Render dashed container if dashed variant
  if (variant === "dashed") {
    return (
      <div onClick={onClick} className={`${variantStyles.dashed} ${className}`}>
        {label}
      </div>
    );
  }

  // Otherwise render as a button
  return (
    <Button
      onClick={onClick}
      className={`${variantStyles[variant]} ${className}`}
      size="sm"
    >
      <Plus className="mr-1 h-4 w-4" />
      {label}
    </Button>
  );
};
