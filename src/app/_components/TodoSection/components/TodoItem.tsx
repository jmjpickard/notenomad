import { useState } from "react";
import { Pencil, Trash, CheckSquare, Square, Star } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Todo } from "~/hooks/useTodos";

type TodoItemProps = {
  todo: Todo;
  onUpdate: (
    id: string,
    data: { content?: string; completed?: boolean; persistent?: boolean },
  ) => void;
  onDelete: (id: string) => void;
};

/**
 * Displays and manages a single todo item
 */
export function TodoItem({ todo, onUpdate, onDelete }: TodoItemProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(todo.content);

  /**
   * Enters edit mode for the todo
   */
  const handleEdit = () => {
    setEditContent(todo.content);
    setIsEditing(true);
  };

  /**
   * Saves the edited todo content
   */
  const handleSave = () => {
    if (editContent.trim()) {
      onUpdate(todo.id, { content: editContent });
    }
    setIsEditing(false);
  };

  /**
   * Cancels editing and reverts to the original content
   */
  const handleCancel = () => {
    setIsEditing(false);
    setEditContent(todo.content);
  };

  /**
   * Toggles the completion status of the todo
   */
  const handleToggleComplete = () => {
    onUpdate(todo.id, { completed: !todo.completed });
  };

  /**
   * Toggles the persistence status of the todo
   */
  const handleTogglePersistence = () => {
    onUpdate(todo.id, { persistent: !todo.persistent });
  };

  return (
    <div
      className={`flex items-center gap-3 rounded-md p-2 ${
        todo.completed
          ? "bg-[#9EB384]"
          : todo.persistent
            ? "bg-[#F5EED5]"
            : "hover:bg-[#F5F5F5]"
      }`}
    >
      <Button
        variant="ghost"
        size="icon"
        className="h-6 w-6 shrink-0 text-[#607D8B]"
        onClick={handleToggleComplete}
        aria-label={todo.completed ? "Mark as incomplete" : "Mark as complete"}
      >
        {todo.completed ? (
          <CheckSquare className="h-5 w-5 text-[#9EB384]" />
        ) : (
          <Square className="h-5 w-5" />
        )}
      </Button>

      {isEditing ? (
        <div className="flex-1">
          <Input
            autoFocus
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            className="mb-1"
            aria-label="Edit task content"
          />
          <div className="flex justify-end space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={handleCancel}
              aria-label="Cancel editing"
            >
              Cancel
            </Button>
            <Button size="sm" onClick={handleSave} aria-label="Save changes">
              Save
            </Button>
          </div>
        </div>
      ) : (
        <>
          <span
            className={`flex-1 text-sm ${
              todo.completed ? "text-[#607D8B] line-through" : "text-[#424242]"
            }`}
          >
            {todo.content}
          </span>
          <div className="flex space-x-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6"
              onClick={handleEdit}
              aria-label="Edit task"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 text-red-500"
              onClick={() => onDelete(todo.id)}
              aria-label="Delete task"
            >
              <Trash className="h-4 w-4" />
            </Button>
            {!todo.completed && (
              <Button
                variant="ghost"
                size="icon"
                className={`h-6 w-6 ${todo.persistent ? "text-amber-500" : "text-slate-400"}`}
                onClick={handleTogglePersistence}
                aria-label={
                  todo.persistent ? "Remove persistence" : "Make persistent"
                }
              >
                <Star
                  className="h-4 w-4"
                  fill={todo.persistent ? "currentColor" : "none"}
                />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
