import { z } from 'zod';

export const loginSchema = z.object({
  email: z.string().email({ message: 'Voer een geldig e-mailadres in' }),
  password: z.string().min(1, { message: 'Wachtwoord is verplicht' }),
});

export const registerSchema = z
  .object({
    firstName: z.string().min(2, { message: 'Voornaam moet minimaal 2 tekens lang zijn' }),
    lastName: z.string().min(2, { message: 'Achternaam moet minimaal 2 tekens lang zijn' }),
    email: z.string().email({ message: 'Voer een geldig e-mailadres in' }),
    password: z.string().min(8, { message: 'Wachtwoord moet minimaal 8 tekens lang zijn' }),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Wachtwoorden komen niet overeen',
    path: ['confirmPassword'], // De foutmelding wordt bij dit veld getoond
  });

export type LoginInput = z.infer<typeof loginSchema>;
export type RegisterInput = z.infer<typeof registerSchema>;