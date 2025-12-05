/**
 * types/chat.ts
 *
 * Definieert de Zod-schema's en afgeleide TypeScript-types voor de chat.
 * Dit is de 'single source of truth' voor de vorm van onze chatberichten.
 */
import { z } from 'zod';

export const chatMessageSchema = z.object({
  id: z.string().min(1, "ID mag niet leeg zijn"),
  senderId: z.string().min(1, "Sender ID mag niet leeg zijn"),
  senderName: z.string().optional(),
  senderAvatar: z.string().url().optional(),
  
  // z.coerce.date() is perfect, het converteert automatisch strings/numbers naar een Date object.
  timestamp: z.coerce.date(), 

  text: z.string().optional(),
  gif: z.string().url().optional(),
  isRead: z.boolean().default(false),

  // === HIER IS DE TOEVOEGING ===
  // Voeg `isAnonymous` toe als een boolean. 
  // We geven het een default van `false` voor robuustheid.
  isAnonymous: z.boolean().default(false),
});

// De TypeScript type wordt hier automatisch van afgeleid. Perfect!
export type ChatMessage = z.infer<typeof chatMessageSchema>;