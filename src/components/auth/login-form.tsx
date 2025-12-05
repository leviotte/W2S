'use client';

import { useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { loginAction } from '@/lib/auth/actions';
import { loginSchema, LoginInput } from '@/lib/validators/auth';

import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';

// Props bijgewerkt om alle mogelijke acties te bevatten
interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void; // <-- DEZE IS TOEGEVOEGD
}

export default function LoginForm({ 
  onSuccess, 
  onSwitchToRegister, 
  onSwitchToForgotPassword // <-- DEZE IS TOEGEVOEGD
}: LoginFormProps) {
  const [isPending, startTransition] = useTransition();

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginInput) => {
    startTransition(async () => {
      const result = await loginAction(data);
      if (result.success) {
        toast.success('Succesvol ingelogd!');
        onSuccess();
      } else {
        toast.error('Inloggen mislukt', {
          description: result.error || 'Controleer je e-mail en wachtwoord.',
        });
      }
    });
  };

  return (
    <div className="flex flex-col gap-6 p-6 md:p-8">
      <div className="flex flex-col items-center text-center gap-1">
        <h1 className="text-2xl font-bold">Log in op je Account</h1>
        <p className="text-balance text-muted-foreground">Welkom terug bij Wish2Share</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="flex flex-col gap-4">
          <FormField
            control={form.control}
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
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wachtwoord</FormLabel>
                <FormControl><Input type="password" {...field} /></FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* "Wachtwoord vergeten?" LINK TOEGEVOEGD */}
          <div className="text-right">
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-sm font-medium text-primary hover:underline underline-offset-2"
            >
              Wachtwoord vergeten?
            </button>
          </div>

          <Button disabled={isPending} type="submit" className="w-full flex items-center justify-center gap-2">
            {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
            Log In
          </Button>
        </form>
      </Form>
      
      <div className="text-center text-sm">
        Nog geen account?{' '}
        <button onClick={onSwitchToRegister} className="font-semibold text-primary hover:underline underline-offset-2">
          Registreer hier
        </button>
      </div>
    </div>
  );
}