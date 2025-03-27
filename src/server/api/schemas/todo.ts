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
