// src/components/auth/login-form.tsx
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

// ============================================================================
// SCHEMA & TYPES
// ============================================================================

const loginFormSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres.'),
  password: z.string().min(1, 'Wachtwoord is verplicht.'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

// ============================================================================
// PROPS INTERFACE
// ============================================================================

interface LoginFormProps {
  onSuccess: () => void;
  onSwitchToRegister: () => void;
  onSwitchToForgotPassword: () => void;
}

// ============================================================================
// COMPONENT
// ============================================================================

export function LoginForm({ 
  onSuccess, 
  onSwitchToRegister, 
  onSwitchToForgotPassword 
}: LoginFormProps) {
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
        const userCredential = await signInWithEmailAndPassword(
          getClientAuth(), 
          data.email, 
          data.password
        );
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        await createSession(idToken);

        toast.success('Welkom terug!');
        
        // ✅ Roep onSuccess aan (voor modal sluiten etc.)
        onSuccess();
        closeModal();
      } catch (error: any) {
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
        {/* Email Field */}
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>E-mailadres</FormLabel>
              <FormControl>
                <Input 
                  type="email" 
                  placeholder="jouw@email.com" 
                  {...field} 
                  autoComplete="email" 
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
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
                    {showPassword ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onSwitchToForgotPassword}
            className="text-sm text-primary hover:underline"
          >
            Wachtwoord vergeten?
          </button>
        </div>

        {/* Submit Button */}
        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Inloggen...' : 'Log in'}
        </Button>

        {/* Switch to Register */}
        <div className="text-center text-sm text-muted-foreground">
          Nog geen account?{' '}
          <button
            type="button"
            onClick={onSwitchToRegister}
            className="text-primary font-medium hover:underline"
          >
            Registreer hier
          </button>
        </div>
      </form>
    </Form>
  );
}