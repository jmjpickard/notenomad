"use client";

import { useState } from "react";
import {
  X,
  Plus,
  CheckSquare,
  Square,
  Star,
  Pencil,
  Trash,
} from "lucide-react";
import { format } from "date-fns";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useTodos } from "~/hooks/useTodos";
import type { Todo } from "~/hooks/useTodos";

type TodoOverlayProps = {
  onClose: () => void;
};

/**
 * Todo overlay component that displays as an overlay on top of the main content
 */
export function TodoOverlay({ onClose }: TodoOverlayProps) {
  const [newTodoContent, setNewTodoContent] = useState<string>("");
  const [editingTodoId, setEditingTodoId] = useState<string | null>(null);
  const [editContent, setEditContent] = useState<string>("");
  const today = new Date();

  const {
    todos,
    addTodo,
    updateTodo,
    deleteTodo,
    isCreating,
    isUpdating,
    isDeleting,
  } = useTodos({ date: today });

  /**
   * Handles the form submission for adding a new todo
   */
  const handleAddTodo = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTodoContent.trim()) return;

    addTodo(newTodoContent, true); // Create as persistent by default in the overlay
    setNewTodoContent("");
  };

  /**
   * Toggles the completion status of a todo item
   */
  const handleToggleComplete = (todo: Todo) => {
    updateTodo(todo.id, { completed: !todo.completed });
  };

  /**
   * Toggles the persistence status of a todo item
   */
  const handleTogglePersistence = (todo: Todo) => {
    updateTodo(todo.id, { persistent: !todo.persistent });
  };

  /**
   * Enters edit mode for a todo
   */
  const handleEditStart = (todo: Todo) => {
    setEditingTodoId(todo.id);
    setEditContent(todo.content);
  };

  /**
   * Saves the edited todo content
   */
  const handleEditSave = (todoId: string) => {
    if (editContent.trim()) {
      updateTodo(todoId, { content: editContent });
    }
    setEditingTodoId(null);
  };

  /**
   * Cancels editing and reverts to the original content
   */
  const handleEditCancel = () => {
    setEditingTodoId(null);
  };

  /**
   * Handles deleting a todo
   */
  const handleDelete = (todoId: string) => {
    deleteTodo(todoId);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4">
      <Card className="w-full max-w-md space-y-4 p-6">
        <div className="flex items-center justify-between">
          <h2 className="font-fraunces text-xl font-semibold text-[#2C3E50]">
            Tasks
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="text-[#607D8B] hover:bg-[#F5F5F5]"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>

        <form onSubmit={handleAddTodo} className="flex gap-2">
          <Input
            type="text"
            placeholder="Add a new task..."
            value={newTodoContent}
            onChange={(e) => setNewTodoContent(e.target.value)}
            className="flex-1 border-[#E0E0E0] focus-visible:ring-[#4A90E2]"
            disabled={isCreating}
          />
          <Button
            type="submit"
            variant="outline"
            className="border-[#4A90E2] text-[#4A90E2] hover:bg-[#F5F5F5]"
            disabled={!newTodoContent.trim() || isCreating}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </form>

        <div className="max-h-[60vh] space-y-2 overflow-y-auto">
          {todos.length === 0 ? (
            <p className="text-center text-sm text-slate-500">
              No tasks yet. Add one above!
            </p>
          ) : (
            todos.map((todo: Todo) => (
              <div
                key={todo.id}
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
                  onClick={() => handleToggleComplete(todo)}
                  aria-label={
                    todo.completed ? "Mark as incomplete" : "Mark as complete"
                  }
                  disabled={isUpdating}
                >
                  {todo.completed ? (
                    <CheckSquare className="h-5 w-5 text-[#9EB384]" />
                  ) : (
                    <Square className="h-5 w-5" />
                  )}
                </Button>

                {editingTodoId === todo.id ? (
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
                        onClick={handleEditCancel}
                        aria-label="Cancel editing"
                        disabled={isUpdating}
                      >
                        Cancel
                      </Button>
                      <Button
                        size="sm"
                        onClick={() => handleEditSave(todo.id)}
                        aria-label="Save changes"
                        disabled={isUpdating}
                      >
                        Save
                      </Button>
                    </div>
                  </div>
                ) : (
                  <>
                    <span
                      className={`flex-1 text-sm ${
                        todo.completed
                          ? "text-[#607D8B] line-through"
                          : "text-[#424242]"
                      }`}
                    >
                      {todo.content}
                    </span>
                    <div className="flex space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6"
                        onClick={() => handleEditStart(todo)}
                        aria-label="Edit task"
                        disabled={isUpdating || isDeleting}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-red-500"
                        onClick={() => handleDelete(todo.id)}
                        aria-label="Delete task"
                        disabled={isDeleting}
                      >
                        <Trash className="h-4 w-4" />
                      </Button>
                      {!todo.completed && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className={`h-6 w-6 ${todo.persistent ? "text-amber-500" : "text-slate-400"}`}
                          onClick={() => handleTogglePersistence(todo)}
                          aria-label={
                            todo.persistent
                              ? "Remove persistence"
                              : "Make persistent"
                          }
                          disabled={isUpdating}
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
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
