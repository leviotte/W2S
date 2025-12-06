import { z } from 'zod';

// --- VOOR HET CLIENT-SIDE FORMULIER ---
export const registerSchema = z.object({
  firstName: z.string().min(2, { message: 'Voornaam moet minstens 2 karakters lang zijn.' }),
  lastName: z.string().min(2, { message: 'Achternaam moet minstens 2 karakters lang zijn.' }),
  email: z.string().email({ message: 'Voer een geldig e-mailadres in.' }),
  password: z.string().min(6, { message: 'Wachtwoord moet minstens 6 karakters lang zijn.' }),
  confirmPassword: z.string(),
}).refine(data => data.password === data.confirmPassword, {
  message: 'Wachtwoorden komen niet overeen.',
  path: ['confirmPassword'], // Toon de foutmelding onder het 'confirmPassword' veld
});

// De TypeScript type afgeleid van het formulier-schema
export type RegisterInput = z.infer<typeof registerSchema>;


// --- VOOR DE SERVER ACTION ---
// Dit definieert ENKEL de data die we van de client naar de server sturen.
export const registerActionSchema = z.object({
  idToken: z.string(),
  firstName: z.string(),
  lastName: z.string(),
});

// De TypeScript type afgeleid van het server-action-schema
export type RegisterActionInput = z.infer<typeof registerActionSchema>;

// --- VOOR HET LOGIN FORMULIER ---
export const loginSchema = z.object({
  email: z.string().email({ message: 'Voer een geldig e-mailadres in.' }),
  password: z.string().min(1, { message: 'Wachtwoord is verplicht.' }),
});

export type LoginInput = z.infer<typeof loginSchema>;