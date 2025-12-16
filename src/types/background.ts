// src/types/background.ts
import { z } from 'zod';

export type BackgroundType = 'wishlist' | 'event' | 'web';

// ✅ ZOD SCHEMA EXPORT
export const backgroundCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, 'Naam is verplicht'),
  type: z.enum(['wishlist', 'event', 'web']),
  createdAt: z.date().optional(),
});

export type BackgroundCategory = z.infer<typeof backgroundCategorySchema>;

export type BackgroundImage = {
  id: string;
  imageLink: string;
  title: string;
  isLive: boolean;
  category?: string;
  createdAt?: Date;
};

export type BackgroundUploadData = {
  title: string;
  category?: string;
  file: File;
};