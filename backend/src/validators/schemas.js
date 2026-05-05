import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: z.string().trim().email(),
  password: z.string().min(8).max(128),
});

export const loginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export const createProjectSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().trim().max(2000).optional(),
});

export const updateProjectSchema = createProjectSchema
  .partial()
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export const projectMemberSchema = z.object({
  userId: z.string().cuid(),
});

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(300),
  description: z.string().trim().max(5000).optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  dueDate: z.coerce.date().optional().nullable(),
  projectId: z.string().cuid(),
  assignedToId: z.string().cuid().optional().nullable(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1).max(300).optional(),
    description: z.string().trim().max(5000).optional().nullable(),
    status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
    dueDate: z.coerce.date().optional().nullable(),
    assignedToId: z.string().cuid().optional().nullable(),
  })
  .refine((d) => Object.keys(d).length > 0, { message: "No fields to update" });

export const taskQuerySchema = z.object({
  projectId: z.string().cuid().optional(),
  status: z.enum(["TODO", "IN_PROGRESS", "DONE"]).optional(),
  page: z.coerce.number().int().min(1).optional(),
  limit: z.coerce.number().int().min(1).max(100).optional(),
});
