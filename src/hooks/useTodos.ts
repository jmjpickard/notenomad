import { format } from "date-fns";
import { toast } from "sonner";
import { api, type RouterOutputs } from "~/trpc/react";

export type Todo = {
  id: string;
  content: string;
  completed: boolean;
  persistent: boolean;
  createdAt: Date;
  updatedAt: Date;
  userId: string;
  dayNoteId: string | null;
};

export type UseTodosOptions = {
  date: Date;
};

type TodoContext = {
  previousData: RouterOutputs["todos"]["getTodosByDate"] | undefined;
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
    onMutate: async (newTodo: { content: string; persistent?: boolean }) => {
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
          userId: "", // Temporary value for optimistic update
          dayNoteId: null, // Temporary value for optimistic update
        };

        return {
          todos: [...(old?.todos || []), optimisticTodo],
        };
      });

      // Return context with snapshotted value
      return { previousData };
    },
    onError: (error, variables, context: TodoContext | undefined) => {
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
      void trpc.todos.getTodosByDate.invalidate({ date: formattedDate });
    },
  });

  const updateTodoMutation = api.todos.updateTodo.useMutation({
    onMutate: async (updatedTodo: {
      id: string;
      content?: string;
      completed?: boolean;
      persistent?: boolean;
    }) => {
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
    onError: (error, variables, context: TodoContext | undefined) => {
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
      void trpc.todos.getTodosByDate.invalidate({ date: formattedDate });
    },
  });

  const deleteTodoMutation = api.todos.deleteTodo.useMutation({
    onMutate: async (deletedTodo: { id: string }) => {
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
    onError: (error, variables, context: TodoContext | undefined) => {
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
      void trpc.todos.getTodosByDate.invalidate({ date: formattedDate });
    },
  });

  /**
   * Adds a new todo with the specified content
   */
  const addTodo = (content: string, persistent = false) => {
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
