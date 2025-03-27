"use client";

import { useState } from "react";
import { Plus } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useTodos } from "~/hooks/useTodos";
import type { Todo } from "~/hooks/useTodos";
import { TodoItem } from "./components/TodoItem";
import { TodoSectionSkeleton } from "./components/TodoSectionSkeleton";
import { TodoSectionError } from "./components/TodoSectionError";

type TodoSectionProps = {
  date: Date;
};

/**
 * Displays and manages the todos for a specific day
 */
export function TodoSection({ date }: TodoSectionProps) {
  const {
    todos,
    isLoading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    isCreating,
  } = useTodos({ date });

  const [isAddingTodo, setIsAddingTodo] = useState(false);
  const [newTodoContent, setNewTodoContent] = useState("");

  /**
   * Handles form submission for creating a new todo
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newTodoContent.trim()) {
      addTodo(newTodoContent);
      setNewTodoContent("");
      setIsAddingTodo(false);
    }
  };

  // Render loading state
  if (isLoading) {
    return <TodoSectionSkeleton />;
  }

  // Render error state
  if (error) {
    return <TodoSectionError error={error} />;
  }

  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Tasks</CardTitle>
        <Button
          variant="ghost"
          size="sm"
          className="h-8 w-8 p-0"
          onClick={() => setIsAddingTodo(true)}
          aria-label="Add task"
        >
          <Plus className="h-4 w-4" />
          <span className="sr-only">Add task</span>
        </Button>
      </CardHeader>
      <CardContent>
        {todos.length === 0 && !isAddingTodo ? (
          <div className="flex flex-col space-y-2">
            <p className="text-sm text-slate-500">No tasks for today yet.</p>
            <p className="text-sm text-slate-500">
              Click the + button to add your first task.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {/* Todo items */}
            {todos.map((todo: Todo) => (
              <TodoItem
                key={todo.id}
                todo={todo}
                onUpdate={updateTodo}
                onDelete={deleteTodo}
              />
            ))}

            {/* Todo input form */}
            {isAddingTodo && (
              <form onSubmit={handleSubmit} className="mt-2">
                <Input
                  autoFocus
                  value={newTodoContent}
                  onChange={(e) => setNewTodoContent(e.target.value)}
                  placeholder="Add a task..."
                  className="mb-2"
                  aria-label="New task content"
                  disabled={isCreating}
                />
                <div className="flex justify-end space-x-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setIsAddingTodo(false)}
                    disabled={isCreating}
                    aria-label="Cancel adding task"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    disabled={isCreating}
                    aria-label="Add task"
                  >
                    {isCreating ? "Adding..." : "Add"}
                  </Button>
                </div>
              </form>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
