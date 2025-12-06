/**
 * src/components/auth/login-form.tsx
 *
 * GOLD STANDARD VERSIE: Gekoppeld aan de useAuthStore voor client-side authenticatie.
 */
'use client';

import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useAuthStore } from '@/lib/store/use-auth-store';
import { loginSchema, type LoginInput } from '@/lib/validators/auth';

import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { LoadingSpinner } from '../ui/LoadingSpinner';
import { toast } from 'sonner';

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

export function LoginForm({
  onSuccess,
  onSwitchToRegister,
  onSwitchToForgotPassword,
}: LoginFormProps) {
  // Haal de login functie en loading state uit onze centrale store
  const { login, loading } = useAuthStore((state) => ({
    login: state.login,
    loading: state.loading,
  }));

  const form = useForm<LoginInput>({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });

  // De functie die wordt aangeroepen bij het submitten van het formulier
  const onSubmit = async (data: LoginInput) => {
    const userProfile = await login(data.email, data.password);
    if (userProfile) {
      // De toast voor succes wordt al in de store afgehandeld!
      onSuccess(); // Sluit de modal
    }
    // De toast voor fouten wordt ook al in de store afgehandeld.
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col items-center gap-1 text-center">
        <h1 className="text-2xl font-bold">Log in op je Account</h1>
        <p className="text-balance text-muted-foreground">
          Welkom terug bij Wish2Share
        </p>
      </div>

      <Form {...form}>
        {/* CORRECTIE: De 'onSubmit' logica is nu correct gekoppeld */}
        <form
          onSubmit={form.handleSubmit(onSubmit)}
          className="flex flex-col gap-4"
        >
          <FormField
            control={form.control} // CORRECTIE: 'control' prop was nodig
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel>E-mail</FormLabel>
                <FormControl>
                  <Input placeholder="naam@voorbeeld.be" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control} // CORRECTIE: 'control' prop was nodig
            name="password"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Wachtwoord</FormLabel>
                <FormControl>
                  <Input type="password" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="text-right">
            <Button
              type="button"
              variant="link"
              size="sm"
              onClick={onSwitchToForgotPassword} // CORRECTIE: 'onClick' was nodig
              className="h-auto p-0 font-medium"
            >
              Wachtwoord vergeten?
            </Button>
          </div>

          <Button disabled={loading} type="submit" className="w-full">
            {loading && <LoadingSpinner size="sm" className="mr-2" />}
            Log In
          </Button>
        </form>
      </Form>

      <div className="text-center text-sm">
        Nog geen account?{' '}
        <Button
          variant="link"
          size="sm"
          onClick={onSwitchToRegister} // CORRECTIE: 'onClick' was nodig
          className="h-auto p-0 font-semibold"
        >
          Registreer hier
        </Button>
      </div>
    </div>
  );
}