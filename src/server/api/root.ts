import { postRouter } from "~/server/api/routers/post";
import { notesRouter } from "~/server/api/routers/notes";
import { meetingsRouter } from "~/server/api/routers/meetings";
import { todosRouter } from "~/server/api/routers/todos";
import { calendarRouter } from "~/server/api/routers/calendar";
import { createCallerFactory, createTRPCRouter } from "~/server/api/trpc";

/**
 * This is the primary router for your server.
 *
 * All routers added in /api/routers should be manually added here.
 */
export const appRouter = createTRPCRouter({
  post: postRouter,
  notes: notesRouter,
  meetings: meetingsRouter,
  todos: todosRouter,
  calendar: calendarRouter,
});

// export type definition of API
export type AppRouter = typeof appRouter;

/**
 * Create a server-side caller for the tRPC API.
 * @example
 * const trpc = createCaller(createContext);
 * const res = await trpc.post.all();
 *       ^? Post[]
 */
export const createCaller = createCallerFactory(appRouter);
