'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useFormState } from 'react-dom';
import { useEffect } from 'react';
import { toast } from 'sonner';

import { updateUserPassword, type PasswordFormState } from '@/app/dashboard/settings/actions';
import { passwordChangeSchema, type PasswordChangeFormValues } from '@/lib/validators/settings';

import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { SubmitButton } from '@/components/ui/submit-button';

export function PasswordChangeSection() {
  const initialState: PasswordFormState = { success: false, message: '' };
  const [state, formAction] = useFormState(updateUserPassword, initialState);
  
  const form = useForm<PasswordChangeFormValues>({
    resolver: zodResolver(passwordChangeSchema),
    defaultValues: { newPassword: '', confirmNewPassword: '' },
  });

  useEffect(() => {
    if (state.message) {
        if (state.success) {
            toast.success('Succes', { description: state.message });
            form.reset(); // Reset het formulier bij succes
        } else {
            toast.error('Fout', { description: state.message });
        }
    }
  }, [state]);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Wachtwoord Wijzigen</CardTitle>
        <CardDescription>
          Werk hier je wachtwoord bij. Je moet hierna mogelijk opnieuw inloggen.
        </CardDescription>
      </CardHeader>
      <Form {...form}>
        <form action={formAction} className="space-y-4">
          <CardContent className="space-y-4">
            <FormField
              control={form.control}
              name="newPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nieuw Wachtwoord</FormLabel>
                  <FormControl>
                    <Input type="password" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmNewPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Bevestig Nieuw Wachtwoord</FormLabel>
                  <FormControl>
                    <Input type="password" required {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
          <CardFooter className="border-t px-6 py-4">
            <SubmitButton>Wachtwoord Opslaan</SubmitButton>
          </CardFooter>
        </form>
      </Form>
    </Card>
  );
}