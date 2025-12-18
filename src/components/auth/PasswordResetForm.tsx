// src/components/auth/password-reset-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';
import { sendPasswordResetEmail } from 'firebase/auth';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getClientAuth } from '@/lib/client/firebase';

const resetFormSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres.'),
});

type ResetFormValues = z.infer<typeof resetFormSchema>;

interface PasswordResetFormProps {
  onSuccess?: () => void;
  onBackToLogin?: () => void;
}

export function PasswordResetForm({ 
  onSuccess, 
  onBackToLogin,
}: PasswordResetFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<ResetFormValues>({
    resolver: zodResolver(resetFormSchema),
    defaultValues: { email: '' },
  });

  const onSubmit = (data: ResetFormValues) => {
    startTransition(async () => {
      try {
        const auth = getClientAuth();
        await sendPasswordResetEmail(auth, data.email);
        
        toast.success('Controleer je inbox!', {
          description: 'We hebben je een e-mail gestuurd om je wachtwoord te resetten.',
        });
        
        if (onSuccess) {
          onSuccess();
        }
        
        // Optioneel: direct terug naar login
        if (onBackToLogin) {
          setTimeout(() => onBackToLogin(), 1500);
        }
      } catch (error: any) {
        console.error("Password reset error:", error);
        
        let errorMessage = 'Er is een onbekende fout opgetreden.';
        
        if (error.code === 'auth/invalid-email') {
          errorMessage = 'Onjuist e-mailadres.';
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'Geen gebruiker gevonden met dit e-mailadres.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Te veel aanvragen. Probeer het later opnieuw.';
        }
        
        toast.error('Reset mislukt', { description: errorMessage });
      }
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Reset Wachtwoord</h1>
        <p className="text-sm text-gray-600">
          Reset het wachtwoord voor Wish2Share
        </p>
      </div>

      {/* Form */}
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {/* E-mail */}
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-gray-700">E-mail</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="naam@voorbeeld.com" 
                    {...field} 
                    autoComplete="email"
                    disabled={isPending}
                    className="bg-gray-50 border-gray-200 focus:bg-white"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full bg-[#6B8E23] hover:bg-[#5a7a1c] text-white" 
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isPending ? 'E-mail wordt verstuurd...' : 'Reset Password'}
          </Button>
        </form>
      </Form>

      {/* Back to Login */}
      {onBackToLogin && (
        <div className="text-center text-sm text-gray-600">
          Terug naar{' '}
          <button 
            onClick={onBackToLogin} 
            className="text-[#6B8E23] font-medium hover:underline"
            disabled={isPending}
          >
            Log in
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        Controleer je inbox na het invoeren van je e-mail
      </div>
    </div>
  );
}