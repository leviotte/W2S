import { z } from 'zod';

export const accountSchema = z.object({
  id: z.string().optional(),
  userId: z.string(),
  instagram: z.string().url().or(z.literal('')).optional().nullable(),
  facebook: z.string().url().or(z.literal('')).optional().nullable(),
  twitter: z.string().url().or(z.literal('')).optional().nullable(),
  tiktok: z.string().url().or(z.literal('')).optional().nullable(),
  pinterest: z.string().url().or(z.literal('')).optional().nullable(),
  createdAt: z.date().optional(),
  updatedAt: z.date().optional(),
});

export type Account = z.infer<typeof accountSchema>;
