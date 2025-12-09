// src/app/dashboard/profile/_components/personal-info-form.tsx
'use client';

import { useEffect } from 'react';
import { useFormState } from 'react-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { toast } from 'sonner';

import { updatePersonalInfoAction } from '@/app/dashboard/profile/actions';
import { profileInfoSchema } from '@/lib/validators/profile';
import type { UserProfile } from '@/types/user';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';
import * as z from 'zod';

type FormValues = Zod.infer<typeof profileInfoSchema>;

interface PersonalInfoFormProps {
  profile: UserProfile;
}

export default function PersonalInfoForm({ profile }: PersonalInfoFormProps) {
  const [state, formAction] = useFormState(updatePersonalInfoAction, { success: false, message: '' });

  const form = useForm<FormValues>({
    resolver: zodResolver(profileInfoSchema),
    defaultValues: {
      firstName: profile.firstName || '',
      lastName: profile.lastName || '',
      email: profile.email || '',
      phone: profile.phone || '',
      birthdate: profile.birthdate || '',
    },
  });

  useEffect(() => {
    if (state.message) {
      state.success ? toast.success('Succes', { description: state.message }) : toast.error('Fout', { description: state.message });
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Persoonlijke Gegevens</CardTitle>
        <CardDescription>Deze gegevens worden gebruikt voor je profiel.</CardDescription>
      </CardHeader>
      <Form {...form}>
        <form action={formAction}>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormField name="firstName" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Voornaam</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="lastName" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>Achternaam</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            <FormField name="email" control={form.control} render={({ field }) => (
              <FormItem><FormLabel>E-mail</FormLabel><FormControl><Input type="email" {...field} /></FormControl><FormMessage /></FormItem>
            )} />
            {/* Voeg hier de andere velden toe (phone, birthdate) */}
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <SubmitButton>Gegevens Opslaan</SubmitButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}