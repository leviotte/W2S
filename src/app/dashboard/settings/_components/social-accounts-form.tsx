'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

// FIX: De juiste, specifiekere Server Action importeren
import { updateUserSocialLinks, type UpdateSocialsState } from '@/app/dashboard/settings/actions';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button'; // Deze maken we in stap 2

// Client-side validatie schema
const socialLinksSchema = z.object({
  instagram: z.string().url({ message: 'Ongeldige URL' }).or(z.literal('')).optional(),
  facebook: z.string().url({ message: 'Ongeldige URL' }).or(z.literal('')).optional(),
  twitter: z.string().url({ message: 'Ongeldige URL' }).or(z.literal('')).optional(),
  tiktok: z.string().url({ message: 'Ongeldige URL' }).or(z.literal('')).optional(),
  pinterest: z.string().url({ message: 'Ongeldige URL' }).or(z.literal('')).optional(),
});

type FormValues = z.infer<typeof socialLinksSchema>;

interface SocialAccountsFormProps {
  socials: Partial<FormValues>; 
}

export function SocialAccountsForm({ socials }: SocialAccountsFormProps) {
  const initialState: UpdateSocialsState = { success: false, message: '' };
  // FIX: De juiste, hernoemde Server Action gebruiken
  const [state, formAction] = useFormState(updateUserSocialLinks, initialState);

  const form = useForm<FormValues>({
    resolver: zodResolver(socialLinksSchema),
    defaultValues: {
      instagram: socials.instagram || '',
      facebook: socials.facebook || '',
      twitter: socials.twitter || '',
      tiktok: socials.tiktok || '',
      pinterest: socials.pinterest || '',
    },
  });

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast.success('Opgeslagen!', { description: state.message });
      } else {
        toast.error('Fout', { description: state.message });
      }
    }
  }, [state]);

  const socialFields: { name: keyof FormValues; label: string; placeholder: string }[] = [
    { name: 'instagram', label: 'Instagram', placeholder: 'https://www.instagram.com/...' },
    { name: 'facebook', label: 'Facebook', placeholder: 'https://www.facebook.com/...' },
    { name: 'twitter', label: 'Twitter/X', placeholder: 'https://www.x.com/...' },
    { name: 'tiktok', label: 'TikTok', placeholder: 'https://www.tiktok.com/@...' },
    { name: 'pinterest', label: 'Pinterest', placeholder: 'https://www.pinterest.com/...' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sociale Media</CardTitle>
        <CardDescription>
          Voeg links toe naar je sociale media profielen. Deze worden getoond op je publieke profielpagina.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form action={formAction} className="space-y-6">
            {socialFields.map((fieldInfo) => (
              <FormField
                key={fieldInfo.name}
                // FIX: was `c{form.control}`
                control={form.control}
                name={fieldInfo.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fieldInfo.label}</FormLabel>
                    <FormControl>
                      <Input placeholder={fieldInfo.placeholder} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            ))}
            <SubmitButton>Wijzigingen Opslaan</SubmitButton>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}