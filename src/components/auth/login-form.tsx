'use client';

import { useState, useTransition } from 'react';
import { useForm, type SubmitHandler } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { getClientAuth } from '@/lib/client/firebase';
import { completeLoginAction } from '@/lib/server/actions/auth';

const loginFormSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres.'),
  password: z.string().min(1, 'Wachtwoord is verplicht.'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

interface LoginFormProps {
  onSuccess?: () => void;
  onSwitchToRegister?: () => void;
  onSwitchToForgotPassword?: () => void;
  returnUrl?: string;
}

export function LoginForm({ 
  onSuccess, 
  onSwitchToRegister, 
  onSwitchToForgotPassword,
  returnUrl 
}: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit: SubmitHandler<LoginFormValues> = async (data) => {
    startTransition(async () => {
      try {
        // 1. Client-side Firebase login
        const userCredential = await signInWithEmailAndPassword(
          getClientAuth(), 
          data.email, 
          data.password
        );
        
        const user = userCredential.user;
        const idToken = await user.getIdToken();

        // 2. Server-side session creation
        const result = await completeLoginAction(idToken);

        if (result.success) {
          toast.success('Welkom terug!');
          
          // Call onSuccess callback if provided
          if (onSuccess) {
            onSuccess();
          }
          
          // Navigate to return URL or dashboard
          const redirectTo = returnUrl || result.data?.redirectTo || '/dashboard';
          router.push(redirectTo);
          router.refresh();
        } else {
          toast.error(result.error || 'Login mislukt');
        }

      } catch (error: any) {
        console.error("Firebase login error:", error);
        
        let errorMessage = 'Er is een onbekende fout opgetreden.';
        
        if (error.code === 'auth/invalid-credential' || error.code === 'auth/wrong-password') {
          errorMessage = 'Ongeldige login-gegevens. Controleer je e-mail en wachtwoord.';
        } else if (error.code === 'auth/user-not-found') {
          errorMessage = 'Geen account gevonden met dit e-mailadres.';
        } else if (error.code === 'auth/too-many-requests') {
          errorMessage = 'Te veel mislukte pogingen. Probeer het later opnieuw.';
        }
        
        toast.error('Login mislukt', { description: errorMessage });
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

        <div className="flex justify-end">
          {onSwitchToForgotPassword && (
            <button
              type="button"
              onClick={onSwitchToForgotPassword}
              className="text-sm text-primary hover:underline"
            >
              Wachtwoord vergeten?
            </button>
          )}
        </div>

        <Button type="submit" className="w-full" disabled={isPending}>
          {isPending ? 'Inloggen...' : 'Log in'}
        </Button>

        {onSwitchToRegister && (
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
        )}
      </form>
    </Form>
  );
}