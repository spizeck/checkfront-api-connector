import { z } from "zod";

export const sessionCreateSchema = z.object({
  slip: z.union([z.string().min(1), z.array(z.string().min(1))]),
  session_id: z.string().optional(),
});

export const sessionAlterSchema = z.object({
  session_id: z.string().min(1),
  alter: z.record(z.string(), z.union([z.string(), z.number()])),
});

export const bookingCreateSchema = z.object({
  session_id: z.string().optional(),
  form: z.record(z.string(), z.string()).refine(
    (val) => Object.keys(val).length > 0,
    { message: "Customer form data is required." },
  ),
});

export const chatMessageSchema = z.object({
  messages: z.array(
    z.object({
      role: z.enum(["user", "assistant", "system"]),
      content: z.string(),
    }).passthrough(),
  ).min(1),
});
