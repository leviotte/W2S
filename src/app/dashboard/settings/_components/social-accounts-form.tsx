'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { updateSocialLinks, type UpdateSocialsState } from '@/app/dashboard/settings/actions';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button'; // Gaan we nog aanmaken

// Client-side validatie schema
const socialLinksSchema = z.object({
  instagram: z.string().url({ message: 'Ongeldige URL' }).or(z.literal('')).optional(),
  facebook: z.string().url({ message: 'Ongeldige URL' }).or(z.literal('')).optional(),
  twitter: z.string().url({ message: 'Ongeldige URL' }).or(z.literal('')).optional(),
  tiktok: z.string().url({ message: 'Ongeldige URL' }).or(z.literal('')).optional(),
  pinterest: z.string().url({ message: 'Ongeldige URL' }).or(z.literal('')).optional(),
});

type FormValues = z.infer<typeof socialLinksSchema>;

// De 'socials' prop wordt door de server component doorgegeven
interface SocialAccountsFormProps {
  socials: Partial<FormValues>; 
}

export function SocialAccountsForm({ socials }: SocialAccountsFormProps) {
  const initialState: UpdateSocialsState = { success: false, message: '' };
  const [state, formAction] = useFormState(updateSocialLinks, initialState);

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

  const socialFields: { name: keyof FormValues; label: string }[] = [
    { name: 'instagram', label: 'Instagram' },
    { name: 'facebook', label: 'Facebook' },
    { name: 'twitter', label: 'Twitter/X' },
    { name: 'tiktok', label: 'TikTok' },
    { name: 'pinterest', label: 'Pinterest' },
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
                control={form.control}
                name={fieldInfo.name}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{fieldInfo.label}</FormLabel>
                    <FormControl>
                      <Input placeholder={`https://www.${fieldInfo.label.toLowerCase()}.com/...`} {...field} />
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