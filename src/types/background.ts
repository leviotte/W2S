// src/types/background.ts
import { z } from 'zod';

export const backgroundCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Naam mag niet leeg zijn'),
  type: z.enum(['wishlist', 'event', 'web']),
});

export type BackgroundCategory = z.infer<typeof backgroundCategorySchema>;