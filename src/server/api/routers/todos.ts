import { createTRPCRouter, protectedProcedure } from "~/server/api/trpc";
import {
  createTodoSchema,
  updateTodoSchema,
  deleteTodoSchema,
  getTodosByDateSchema,
} from "~/server/api/schemas/todo";

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
              dayNoteId: {
                not: null,
              },
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
