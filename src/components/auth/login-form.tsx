// src/features/auth/_components/login-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getClientAuth } from '@/lib/client/firebase';
import { createSession } from '@/lib/auth/actions';
import { useAuthStore } from '@/lib/store/use-auth-store';

// 1. Schema definitie
const loginFormSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres.'),
  password: z.string().min(1, 'Wachtwoord is verplicht.'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

export function LoginForm() {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const { closeModal } = useAuthStore();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    startTransition(async () => {
      try {
        // Stap 1: Authenticeer bij Firebase op de client
        const userCredential = await signInWithEmailAndPassword(getClientAuth(), data.email, data.password);
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        // Stap 2: Roep de Server Action aan om de server-side sessie te maken
        const result = await createSession(idToken);

        // --- KIJK GOED: HIER IS DE CORRECTIE ---
        // Controleer het resultaat van de Server Action op de "gold standard" manier
        if (!result.success) {
          // Binnen dit blok WEET TypeScript dat `result.error` bestaat.
          toast.error(`Login mislukt: ${result.error}`);
          return;
        }

        // Buiten het 'if'-blok, WEET TypeScript dat `result.user` bestaat.
        toast.success(`Welkom terug, ${result.user.profile.firstName}!`);
        closeModal();

      } catch (error: any) {
        // Vang fouten van de client-side Firebase authenticatie op
        console.error("Firebase login error:", error);
        const errorMessage = error.code === 'auth/invalid-credential' 
          ? 'Ongeldige login-gegevens. Controleer je e-mail en wachtwoord.'
          : 'Er is een onbekende fout opgetreden.';
        toast.error(errorMessage);
      }
    });
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mailadres</FormLabel>
              <FormControl>
                <Input type="email" placeholder="jouw@email.com" {...field} autoComplete="email" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Wachtwoord</FormLabel>
              <FormControl>
                <div className="relative">
                  <Input 
                    type={showPassword ? 'text' : 'password'} 
                    placeholder="••••••••" 
                    {...field} 
                    autoComplete="current-password"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="absolute inset-y-0 right-0 h-full px-3"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Inloggen...' : 'Log in'}
        </Button>
      </form>
    </Form>
  );
}