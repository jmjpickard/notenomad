# Step 6: Todo Functionality

## Overview

This plan focuses on implementing the Todo functionality for the NoteMomad application. We'll create a complete todo system that allows users to manage tasks within the context of each day, with the ability to persist important tasks across days. The implementation will leverage the existing UI components and styling, focusing primarily on the backend implementation with tRPC and Prisma.

## Prerequisites

- Basic day view layout implemented from Step 4
- Authentication system in place
- Prisma Todo model configured in the database schema
- Design system guidelines (see prompts/design-system.md)

## Implementation Goals

- Implement backend tRPC procedures for Todo CRUD operations
- Connect the existing TodoSection and TodoOverlay components to the Prisma backend
- Implement todo persistence between days (optional for persistent todos)
- Ensure full CRUD functionality flows through to the UI
- Maintain consistent UI styling and UX with the existing application
- Implement optimistic updates for a responsive user experience
- Ensure robust error handling with user feedback

## Detailed Steps

### 1. Create Todo tRPC Router

Develop a tRPC router with the following procedures:

- `getTodosByDate`: Fetch todos for a specific day
- `createTodo`: Create a new todo for a specific day
- `updateTodo`: Update a todo's content or completion status
- `deleteTodo`: Delete a todo
- `toggleTodoCompletion`: Toggle the completion status of a todo
- `toggleTodoPersistence`: Toggle whether a todo persists across days (optional)

### 2. Update Todo Schema in Prisma (if needed)

- Add a `persistent` field to the Todo model to support persistence across days
- Add appropriate indexes for efficient querying

### 3. Create Todo Schema Validation Schemas

Define Zod schemas in `src/server/api/schemas/todo.ts` to validate the input data for tRPC procedures. These schemas will ensure data integrity and type safety for todo operations.

### 4. Implement Todo Hooks

Create custom hooks to interface with the tRPC API:

- `useTodos`: Hook to fetch, create, update, and delete todos for a given day
- `useTodoPersistence`: Hook to manage persistence of todos across days

### 5. Enhance TodoSection Component

Update the existing TodoSection component to:

- Display todos for the current day using the useTodos hook
- Implement add/edit/delete UI actions that connect to the tRPC API
- Add loading and error states for better UX
- Implement optimistic updates for a responsive feel
- Ensure accessibility of all interactive elements

### 6. Enhance TodoOverlay Component

Update the existing TodoOverlay component to:

- Use real data from the useTodos hook instead of mock data
- Implement CRUD operations via the tRPC API
- Add persistence toggle functionality
- Handle loading and error states
- Ensure keyboard navigation and screen reader compatibility

### 7. Unit and Integration Tests (Optional)

- Implement unit tests for the `useTodos` hook
- Create integration tests for the `TodoSection` and `TodoItem` components
- Verify core functionality and data flow
- Test optimistic updates and error handling scenarios

## Implementation Details

### tRPC Router Implementation

Create a new router in `src/server/api/routers/todos.ts` with the following structure:

```typescript
export const todosRouter = createTRPCRouter({
  getTodosByDate: protectedProcedure
    .input(getTodosByDateSchema)
    .query(async ({ ctx, input }) => {
      const date = new Date(input.date);

      // Format date to match database storage format (start of day)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      // Find todos for this specific day and any persistent todos
      const todos = await ctx.db.todo.findMany({
        where: {
          userId: ctx.session.user.id,
          OR: [
            {
              // Todos specifically for this day
              dayNote: {
                date: {
                  gte: startOfDay,
                  lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
                },
              },
            },
            {
              // Persistent todos that aren't completed
              persistent: true,
              completed: false,
            },
          ],
        },
        orderBy: {
          createdAt: "asc",
        },
      });

      return { todos };
    }),

  createTodo: protectedProcedure
    .input(createTodoSchema)
    .mutation(async ({ ctx, input }) => {
      const date = new Date(input.date);

      // Format date to match database storage format (start of day)
      const startOfDay = new Date(date);
      startOfDay.setHours(0, 0, 0, 0);

      // Find or create the day note
      let dayNote = await ctx.db.dayNote.findFirst({
        where: {
          userId: ctx.session.user.id,
          date: {
            gte: startOfDay,
            lt: new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000),
          },
        },
      });

      if (!dayNote) {
        dayNote = await ctx.db.dayNote.create({
          data: {
            date: startOfDay,
            userId: ctx.session.user.id,
          },
        });
      }

      // Create the todo
      const todo = await ctx.db.todo.create({
        data: {
          content: input.content,
          persistent: input.persistent ?? false,
          userId: ctx.session.user.id,
          dayNoteId: dayNote.id,
        },
      });

      return { todo };
    }),

  updateTodo: protectedProcedure
    .input(updateTodoSchema)
    .mutation(async ({ ctx, input }) => {
      // Update the todo
      const todo = await ctx.db.todo.update({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
        data: {
          ...(input.content !== undefined && { content: input.content }),
          ...(input.completed !== undefined && { completed: input.completed }),
          ...(input.persistent !== undefined && {
            persistent: input.persistent,
          }),
        },
      });

      return { todo };
    }),

  deleteTodo: protectedProcedure
    .input(deleteTodoSchema)
    .mutation(async ({ ctx, input }) => {
      // Delete the todo
      await ctx.db.todo.delete({
        where: {
          id: input.id,
          userId: ctx.session.user.id,
        },
      });

      return { success: true };
    }),
});
```

### Todo Schema Validation

Create Zod schemas for validating todo data in `src/server/api/schemas/todo.ts`:

```typescript
import { z } from "zod";

export const createTodoSchema = z.object({
  date: z.string(),
  content: z.string().min(1, "Todo content is required"),
  persistent: z.boolean().optional().default(false),
});

export const updateTodoSchema = z.object({
  id: z.string(),
  content: z.string().min(1, "Todo content is required").optional(),
  completed: z.boolean().optional(),
  persistent: z.boolean().optional(),
});

export const deleteTodoSchema = z.object({
  id: z.string(),
});

export const getTodosByDateSchema = z.object({
  date: z.string(),
});
```

### Custom Hook Implementation

Create a `useTodos` hook in `src/hooks/useTodos.ts`:

```typescript
import { useState } from "react";
import { format } from "date-fns";
import { toast } from "sonner";
import { api } from "~/utils/api";

export type Todo = {
  id: string;
  content: string;
  completed: boolean;
  persistent: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type UseTodosOptions = {
  date: Date;
};

/**
 * Hook for fetching and managing todos for a specific date
 */
export function useTodos({ date }: UseTodosOptions) {
  const formattedDate = format(date, "yyyy-MM-dd");
  const trpc = api.useUtils();

  // Query to fetch todos for the given date
  const { data, isLoading, error } = api.todos.getTodosByDate.useQuery(
    { date: formattedDate },
    {
      enabled: true,
      refetchOnWindowFocus: false,
    },
  );

  // Mutations for CRUD operations with optimistic updates
  const createTodoMutation = api.todos.createTodo.useMutation({
    onMutate: async (newTodo) => {
      // Cancel outgoing refetches to avoid overwriting optimistic update
      await trpc.todos.getTodosByDate.cancel({ date: formattedDate });

      // Snapshot previous data
      const previousData = trpc.todos.getTodosByDate.getData({
        date: formattedDate,
      });

      // Optimistically update the cache with the new todo
      trpc.todos.getTodosByDate.setData({ date: formattedDate }, (old) => {
        const optimisticTodo: Todo = {
          id: `temp-${Date.now()}`,
          content: newTodo.content,
          completed: false,
          persistent: newTodo.persistent ?? false,
          createdAt: new Date(),
          updatedAt: new Date(),
        };

        return {
          todos: [...(old?.todos || []), optimisticTodo],
        };
      });

      // Return context with snapshotted value
      return { previousData };
    },
    onError: (error, variables, context) => {
      // Roll back on error
      if (context?.previousData) {
        trpc.todos.getTodosByDate.setData(
          { date: formattedDate },
          context.previousData,
        );
      }

      // Show error message to user
      toast.error("Failed to create todo");
    },
    onSettled: () => {
      // Invalidate query to ensure fresh data
      trpc.todos.getTodosByDate.invalidate({ date: formattedDate });
    },
  });

  const updateTodoMutation = api.todos.updateTodo.useMutation({
    onMutate: async (updatedTodo) => {
      // Cancel outgoing refetches
      await trpc.todos.getTodosByDate.cancel({ date: formattedDate });

      // Snapshot previous data
      const previousData = trpc.todos.getTodosByDate.getData({
        date: formattedDate,
      });

      // Optimistically update cache
      trpc.todos.getTodosByDate.setData({ date: formattedDate }, (old) => {
        if (!old) return { todos: [] };

        return {
          todos: old.todos.map((todo) =>
            todo.id === updatedTodo.id
              ? {
                  ...todo,
                  ...(updatedTodo.content !== undefined && {
                    content: updatedTodo.content,
                  }),
                  ...(updatedTodo.completed !== undefined && {
                    completed: updatedTodo.completed,
                  }),
                  ...(updatedTodo.persistent !== undefined && {
                    persistent: updatedTodo.persistent,
                  }),
                  updatedAt: new Date(),
                }
              : todo,
          ),
        };
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Roll back on error
      if (context?.previousData) {
        trpc.todos.getTodosByDate.setData(
          { date: formattedDate },
          context.previousData,
        );
      }

      // Show error message
      toast.error("Failed to update todo");
    },
    onSettled: () => {
      // Invalidate query to ensure fresh data
      trpc.todos.getTodosByDate.invalidate({ date: formattedDate });
    },
  });

  const deleteTodoMutation = api.todos.deleteTodo.useMutation({
    onMutate: async (deletedTodo) => {
      // Cancel outgoing refetches
      await trpc.todos.getTodosByDate.cancel({ date: formattedDate });

      // Snapshot previous data
      const previousData = trpc.todos.getTodosByDate.getData({
        date: formattedDate,
      });

      // Optimistically update cache
      trpc.todos.getTodosByDate.setData({ date: formattedDate }, (old) => {
        if (!old) return { todos: [] };

        return {
          todos: old.todos.filter((todo) => todo.id !== deletedTodo.id),
        };
      });

      return { previousData };
    },
    onError: (error, variables, context) => {
      // Roll back on error
      if (context?.previousData) {
        trpc.todos.getTodosByDate.setData(
          { date: formattedDate },
          context.previousData,
        );
      }

      // Show error message
      toast.error("Failed to delete todo");
    },
    onSettled: () => {
      // Invalidate query to ensure fresh data
      trpc.todos.getTodosByDate.invalidate({ date: formattedDate });
    },
  });

  /**
   * Adds a new todo with the specified content
   */
  const addTodo = (content: string, persistent: boolean = false) => {
    if (!content.trim()) return;

    createTodoMutation.mutate({
      date: formattedDate,
      content: content.trim(),
      persistent,
    });
  };

  /**
   * Updates a todo with the provided data
   */
  const updateTodo = (
    id: string,
    data: { content?: string; completed?: boolean; persistent?: boolean },
  ) => {
    if (data.content && !data.content.trim()) return;

    updateTodoMutation.mutate({
      id,
      ...data,
      ...(data.content && { content: data.content.trim() }),
    });
  };

  /**
   * Deletes a todo by ID
   */
  const deleteTodo = (id: string) => {
    deleteTodoMutation.mutate({ id });
  };

  return {
    todos: data?.todos || [],
    isLoading,
    error,
    addTodo,
    updateTodo,
    deleteTodo,
    isCreating: createTodoMutation.isPending,
    isUpdating: updateTodoMutation.isPending,
    isDeleting: deleteTodoMutation.isPending,
  };
}
```

### Prisma Schema Update (if needed)

Add the `persistent` field to the Todo model in `prisma/schema.prisma`:

```prisma
model Todo {
  id         String   @id @default(cuid())
  content    String
  completed  Boolean  @default(false)
  persistent Boolean  @default(false)  // Add this field
  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  userId    String

  // Association with a day's notes
  dayNote   DayNote? @relation(fields: [dayNoteId], references: [id])
  dayNoteId String?

  @@index([userId, dayNoteId])
  @@index([userId, persistent, completed]) // For efficient querying of persistent todos
}
```

### Component Updates

Update the `TodoSection` component to use the real data from the `useTodos` hook:

```typescript
import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";

import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { useTodos } from "~/hooks/useTodos";
import { TodoItem } from "./TodoItem";
import { TodoSectionSkeleton } from "./TodoSectionSkeleton";
import { TodoSectionError } from "./TodoSectionError";

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
    isCreating
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
            {todos.map((todo) => (
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
```

Create a `TodoItem` component:

```typescript
import { useState } from "react";
import { Pencil, Trash, CheckSquare, Square, Star } from "lucide-react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import type { Todo } from "~/hooks/useTodos";

type TodoItemProps = {
  todo: Todo;
  onUpdate: (id: string, data: { content?: string; completed?: boolean; persistent?: boolean }) => void;
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
        todo.completed ? "bg-[#9EB384]" : todo.persistent ? "bg-[#F5EED5]" : "hover:bg-[#F5F5F5]"
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
            <Button
              size="sm"
              onClick={handleSave}
              aria-label="Save changes"
            >
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
                aria-label={todo.persistent ? "Remove persistence" : "Make persistent"}
              >
                <Star className="h-4 w-4" fill={todo.persistent ? "currentColor" : "none"} />
              </Button>
            )}
          </div>
        </>
      )}
    </div>
  );
}
```

Create skeleton and error components:

```typescript
/**
 * Skeleton loading state for the TodoSection
 */
export function TodoSectionSkeleton() {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="h-6 w-16 animate-pulse rounded bg-slate-200"></div>
        <div className="h-8 w-8 animate-pulse rounded-full bg-slate-200"></div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <div className="h-8 w-full animate-pulse rounded bg-slate-200"></div>
          <div className="h-8 w-full animate-pulse rounded bg-slate-200"></div>
          <div className="h-8 w-3/4 animate-pulse rounded bg-slate-200"></div>
        </div>
      </CardContent>
    </Card>
  );
}
```

```typescript
/**
 * Error state for the TodoSection
 */
export function TodoSectionError({ error }: { error: Error }) {
  return (
    <Card className="h-full">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xl font-semibold">Tasks</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col space-y-2">
          <p className="text-sm text-red-500">
            Failed to load tasks: {error.message}
          </p>
          <p className="text-sm text-slate-500">
            Try refreshing the page or contact support if the issue persists.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
```

### Main Router Integration

Update the main tRPC router in `src/server/api/root.ts` to include the todos router:

```typescript
import { createTRPCRouter } from "~/server/api/trpc";
import { postsRouter } from "~/server/api/routers/post";
import { notesRouter } from "~/server/api/routers/notes";
import { meetingsRouter } from "~/server/api/routers/meetings";
import { todosRouter } from "~/server/api/routers/todos"; // Add this line

export const appRouter = createTRPCRouter({
  post: postsRouter,
  notes: notesRouter,
  meetings: meetingsRouter,
  todos: todosRouter, // Add this line
});

export type AppRouter = typeof appRouter;
```

## Date Handling Consistency

Throughout the implementation, maintain consistent date handling:

1. All date parameters for tRPC procedures should be passed as ISO strings (YYYY-MM-DD format)
2. When parsing dates on the server side, always normalize to the start of day (00:00:00) for consistent queries
3. When displaying dates in the UI, use appropriate date-fns formatting functions
4. Store dates in UTC format in the database
5. Use the same date normalization logic across all date-related functions

## Accessibility Considerations

Ensure that all Todo components follow accessibility best practices:

1. Use proper ARIA attributes for interactive elements
2. Ensure keyboard navigation works for all interactive elements
3. Provide clear focus states for all interactive elements
4. Use semantic HTML elements where appropriate
5. Include descriptive aria-labels for buttons and controls
6. Ensure color contrast meets WCAG AA standards
7. Provide alternative text for icons (via aria-label or sr-only spans)

## Testing Criteria

- Verify that todos can be created, read, updated, and deleted through the UI
- Check that todo completion status can be toggled
- Ensure that persistent todos appear across multiple days
- Validate that todos are correctly associated with the appropriate day and user
- Confirm that the UI updates immediately with optimistic updates
- Verify error states are handled gracefully with user feedback via toast notifications
- Test keyboard navigation and screen reader compatibility
- Check that performance remains good even with many todos

## Next Steps

After implementing the Todo functionality, the next step will be to connect the BlockNote.js editor to the database for persistent storage of day notes.
