'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { app } from '@/lib/client/firebase';
import { registerAction } from '@/lib/auth/actions';
import { registerSchema, RegisterInput } from '@/lib/validators/auth';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

interface RegisterFormProps {
  onSuccess: () => void;
  onSwitchToLogin: () => void;
}

export default function RegisterForm({ onSuccess, onSwitchToLogin }: RegisterFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<RegisterInput>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = (data: RegisterInput) => {
    startTransition(async () => {
      try {
        const auth = getAuth(app);
        const userCredential = await createUserWithEmailAndPassword(auth, data.email, data.password);
        const idToken = await userCredential.user.getIdToken();

        const result = await registerAction({
          idToken,
          firstName: data.firstName,
          lastName: data.lastName,
        });

        if (result.success) {
          toast.success('Account succesvol aangemaakt!');
          onSuccess();
        } else {
          toast.error(result.error || 'Serverfout bij het finaliseren van de registratie.');
        }

      } catch (error: any) {
        let friendlyMessage = 'Er is een onbekende fout opgetreden.';
        if (error.code === 'auth/email-already-in-use') {
          friendlyMessage = 'Dit e-mailadres is al in gebruik.';
        } else {
          console.error('Firebase client-side registratie error:', error);
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
              control={form.control} // CORRECTIE
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
              control={form.control} // CORRECTIE
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
            control={form.control} // CORRECTIE
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl><Input placeholder="naam@voorbeeld.be" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control} // CORRECTIE
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wachtwoord</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control} // CORRECTIE
            name="confirmPassword"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bevestig Wachtwoord</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
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
      
      <div className="text-center text-sm">
        Al een account?{' '}
        <button onClick={onSwitchToLogin} className="underline underline-offset-2 hover:text-primary">
          Log in
        </button>
      </div>
       <div className="text-balance text-center text-xs text-muted-foreground">
        Door te registreren ga je akkoord met onze{' '}
        <a href="/terms-and-conditions" className="underline underline-offset-2 hover:text-primary">
          gebruiksvoorwaarden
        </a>
      </div>
    </div>
  );
}