// src/types/chat.ts
import { z } from 'zod';
import { Timestamp } from 'firebase/firestore';

const timestampSchema = z.preprocess(
  // Argument 1: De transformatie functie
  (arg) => {
    if (arg instanceof Timestamp) return arg.toDate();
    if (arg && typeof arg === 'object' && 'toDate' in arg) return (arg as any).toDate();
    if (typeof arg === 'string' || typeof arg === 'number') {
        const date = new Date(arg);
        if (!isNaN(date.getTime())) return date;
    }
    return arg;
  },
  // Argument 2: Het validatie schema
  z.date({
    // DE FIX: Het moet 'message' zijn voor z.date()
    message: "Ongeldig datumformaat voor chatbericht."
  })
);

export const chatMessageSchema = z.object({
  id: z.string(),
  senderId: z.string(),
  senderName: z.string().optional(),
  senderAvatar: z.string().url("Ongeldige avatar URL").optional().nullable(),
  text: z.string().optional(),
  gif: z.string().url("Ongeldige GIF URL").optional(),
  
  timestamp: timestampSchema, 
  
  isRead: z.boolean().default(false),
  isAnonymous: z.boolean().default(false),
})
.refine(data => !!data.text || !!data.gif, {
  message: "Een chatbericht moet tekst of een GIF bevatten.",
});

export type ChatMessage = z.infer<typeof chatMessageSchema>;