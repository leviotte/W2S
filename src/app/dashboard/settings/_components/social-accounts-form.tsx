// src/app/dashboard/settings/_components/social-accounts-form.tsx
'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card'; // FIX: CardFooter importeren
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { SocialLinksSchema, type SocialLinks } from '@/types/user';
import { updateSocialLinks } from '../actions';
import { SubmitButton } from '@/components/ui/submit-button';

interface SocialAccountsFormProps {
  initialData: SocialLinks;
}

export function SocialAccountsForm({ initialData }: SocialAccountsFormProps) {
  const form = useForm<z.infer<typeof SocialLinksSchema>>({
    resolver: zodResolver(SocialLinksSchema),
    defaultValues: {
      facebook: initialData?.facebook || '',
      instagram: initialData?.instagram || '',
      linkedin: initialData?.linkedin || '',
      website: initialData?.website || '',
    },
  });

  async function onSubmit(data: z.infer<typeof SocialLinksSchema>) {
    const promise = updateSocialLinks(data);
    toast.promise(promise, {
      loading: 'Bezig met opslaan...',
      success: (res) => res.message,
      error: (err) => err.message,
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Sociale Accounts</CardTitle>
        <CardDescription>Link je sociale media en website om je profiel compleet te maken.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)}>
          <CardContent className="space-y-4">
            {/* Formulier velden hier */}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <SubmitButton>Opslaan</SubmitButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}