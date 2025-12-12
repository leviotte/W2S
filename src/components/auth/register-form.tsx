'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { getClientAuth } from '@/lib/client/firebase';
import { completeRegistrationAction } from '@/lib/server/actions/auth';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

const registerSchema = z.object({
  firstName: z.string().min(1, 'Voornaam is verplicht'),
  lastName: z.string().min(1, 'Achternaam is verplicht'),
  email: z.string().email('Ongeldig e-mailadres'),
  password: z.string().min(6, 'Wachtwoord moet minimaal 6 karakters bevatten'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Wachtwoorden komen niet overeen",
  path: ["confirmPassword"],
});

type RegisterFormValues = z.infer<typeof registerSchema>;

interface RegisterFormProps {
  onSuccess?: () => void;
  onSwitchToLogin?: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const form = useForm<RegisterFormValues>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: RegisterFormValues) => {
    startTransition(async () => {
      try {
        // 1. Client-side Firebase registration
        const auth = getClientAuth();
        const userCredential = await createUserWithEmailAndPassword(
          auth, 
          data.email, 
          data.password
        );
        
        const idToken = await userCredential.user.getIdToken();

        // 2. Server-side user profile creation
        const result = await completeRegistrationAction({
          idToken,
          firstName: data.firstName,
          lastName: data.lastName,
        });

        if (result.success) {
          toast.success('Account succesvol aangemaakt!', {
            description: 'Je wordt doorgestuurd naar je dashboard...'
          });
          
          if (onSuccess) {
            onSuccess();
          }
          
          router.push('/dashboard');
          router.refresh();
        } else {
          toast.error('Registratie mislukt', { 
            description: result.error || 'Er ging iets mis bij het aanmaken van je profiel.' 
          });
        }

      } catch (error: any) {
        console.error('Firebase registration error:', error);
        
        let friendlyMessage = 'Er is een onbekende fout opgetreden.';
        
        if (error.code === 'auth/email-already-in-use') {
          friendlyMessage = 'Dit e-mailadres is al in gebruik.';
        } else if (error.code === 'auth/weak-password') {
          friendlyMessage = 'Wachtwoord is te zwak. Kies een sterker wachtwoord.';
        } else if (error.code === 'auth/invalid-email') {
          friendlyMessage = 'Ongeldig e-mailadres.';
        }
        
        toast.error('Registratie mislukt', { description: friendlyMessage });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center text-center gap-1">
        <h1 className="text-2xl font-bold">Maak een Account aan</h1>
        <p className="text-balance text-muted-foreground">Start met het delen van je wensen</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="firstName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Voornaam</FormLabel>
                  <FormControl><Input placeholder="John" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="lastName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Achternaam</FormLabel>
                  <FormControl><Input placeholder="Doe" {...field} /></FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl><Input type="email" placeholder="naam@voorbeeld.be" {...field} /></FormControl>
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
                <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bevestig Wachtwoord</FormLabel>
                <FormControl><Input type="password" placeholder="••••••••" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <Button disabled={isPending} type="submit" className="w-full flex items-center justify-center gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Registreer
          </Button>
        </form>
      </Form>
      
      {onSwitchToLogin && (
        <div className="text-center text-sm">
          Al een account?{' '}
          <button onClick={onSwitchToLogin} className="underline underline-offset-2 hover:text-primary">
            Log in
          </button>
        </div>
      )}
      
      <div className="text-balance text-center text-xs text-muted-foreground">
        Door te registreren ga je akkoord met onze{' '}
        <a href="/terms" className="underline underline-offset-2 hover:text-primary">
          gebruiksvoorwaarden
        </a>
      </div>
    </div>
  );
}