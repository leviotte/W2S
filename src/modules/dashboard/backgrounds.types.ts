// src/modules/dashboard/backgrounds.types.ts
import { z } from "zod";

// -------------------------
// ZOD SCHEMAS (ENIGE WAARHEID)
// -------------------------

export const backgroundCategorySchema = z.object({
  id: z.string(),
  name: z.string().min(1, "Naam is verplicht"),
  type: z.enum(["wishlist", "event", "web"]),
  createdAt: z.date().optional(),
});

export const backgroundImageSchema = z.object({
  id: z.string(),
  title: z.string().min(1),
  imageLink: z.string().url(),
  category: z.string().optional(),
  isLive: z.boolean().optional(),
  createdAt: z.date().optional(),
});

// -------------------------
// TYPES AFGELEID UIT ZOD
// -------------------------

export type BackgroundCategory =
  z.infer<typeof backgroundCategorySchema>;

export type BackgroundType =
  BackgroundCategory["type"];

export type BackgroundImage =
  z.infer<typeof backgroundImageSchema>;

export type BackgroundUploadData = {
  title: string;
  category: string;
  file: File;
};
