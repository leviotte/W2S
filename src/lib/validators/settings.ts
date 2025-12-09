// src/lib/validators/settings.ts
import { z } from 'zod';

export const socialLinksSchema = z.object({
  instagram: z.string().url({ message: 'Ongeldige Instagram URL' }).or(z.literal('')).optional(),
  facebook: z.string().url({ message: 'Ongeldige Facebook URL' }).or(z.literal('')).optional(),
  twitter: z.string().url({ message: 'Ongeldige Twitter/X URL' }).or(z.literal('')).optional(),
  tiktok: z.string().url({ message: 'Ongeldige TikTok URL' }).or(z.literal('')).optional(),
  pinterest: z.string().url({ message: 'Ongeldige Pinterest URL' }).or(z.literal('')).optional(),
});

export const passwordChangeSchema = z.object({
    newPassword: z.string().min(6, 'Wachtwoord moet minimaal 6 tekens lang zijn.'),
    confirmNewPassword: z.string(),
  }).refine(data => data.newPassword === data.confirmNewPassword, {
    message: "De nieuwe wachtwoorden komen niet overeen.",
    path: ["confirmNewPassword"], // Toon de fout bij het bevestigingsveld
  });

export type SocialLinksFormValues = z.infer<typeof socialLinksSchema>;
export type PasswordChangeFormValues = z.infer<typeof passwordChangeSchema>;