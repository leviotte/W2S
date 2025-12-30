// src/components/auth/login-form.tsx
'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';

import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { SocialAuthButtons } from './social-auth-buttons';
import { getClientAuth } from '@/lib/client/firebase';

const loginFormSchema = z.object({
  email: z.string().email('Ongeldig e-mailadres.'),
  password: z.string().min(1, 'Wachtwoord is verplicht.'),
});

type LoginFormValues = z.infer<typeof loginFormSchema>;

interface LoginFormProps {
  onSuccess?: (idToken: string) => Promise<void>; // ✅ idToken doorgeven aan server action
  onSwitchToRegister?: () => void;
  onSwitchToForgotPassword?: () => void;
  returnUrl?: string; // kan nog gebruikt worden voor fallback redirect
}

export function LoginForm({ 
  onSuccess, 
  onSwitchToRegister, 
  onSwitchToForgotPassword
}: LoginFormProps) {
  const [isPending, startTransition] = useTransition();
  const [showPassword, setShowPassword] = useState(false);

  const form = useForm<LoginFormValues>({
    resolver: zodResolver(loginFormSchema),
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = (data: LoginFormValues) => {
    startTransition(async () => {
      try {
        const auth = getClientAuth();
        const userCredential = await signInWithEmailAndPassword(auth, data.email, data.password);
        const user = userCredential.user;

        if (!user.emailVerified) {
          toast.error('E-mail niet geverifieerd', {
            description: 'Controleer je inbox voor de verificatie link.',
            action: {
              label: 'Opnieuw versturen',
              onClick: async () => {
                await sendEmailVerification(user);
                toast.success('Verificatie email opnieuw verstuurd!');
              },
            },
          });
          await auth.signOut();
          return;
        }

        const idToken = await user.getIdToken();

        if (onSuccess) {
          await onSuccess(idToken); // ✅ call server action
          toast.success('Welkom terug!');
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
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-1">
        <h1 className="text-2xl font-bold text-gray-900">Welkom Terug</h1>
        <p className="text-sm text-gray-600">Log in bij Wish2Share</p>
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

          {/* Wachtwoord met "Vergeten?" */}
          <FormField
            control={form.control}
            name="password"
            render={({ field }) => (
              <FormItem>
                <div className="flex items-center justify-between">
                  <FormLabel className="text-gray-700">Wachtwoord</FormLabel>
                  {onSwitchToForgotPassword && (
                    <button
                      type="button"
                      onClick={onSwitchToForgotPassword}
                      className="text-sm text-[#6B8E23] hover:underline"
                      disabled={isPending}
                    >
                      Vergeten?
                    </button>
                  )}
                </div>
                <FormControl>
                  <div className="relative">
                    <Input 
                      type={showPassword ? 'text' : 'password'} 
                      placeholder="•••••••" 
                      {...field} 
                      autoComplete="current-password"
                      disabled={isPending}
                      className="pr-10 bg-gray-50 border-gray-200 focus:bg-white"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute inset-y-0 right-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowPassword(!showPassword)}
                      disabled={isPending}
                      aria-label={showPassword ? 'Verberg wachtwoord' : 'Toon wachtwoord'}
                    >
                      {showPassword ? (
                        <EyeOff className="h-4 w-4 text-gray-500" />
                      ) : (
                        <Eye className="h-4 w-4 text-gray-500" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Login Button */}
          <Button 
            type="submit" 
            className="w-full bg-[#6B8E23] hover:bg-[#5a7a1c] text-white" 
            disabled={isPending}
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Login
          </Button>
        </form>
      </Form>

      {/* Divider */}
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-[#6B8E23]" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-slate-50 px-2 text-gray-500">of log in met</span>
        </div>
      </div>

      {/* Social Login */}
      <SocialAuthButtons />

      {/* Switch to Register */}
      {onSwitchToRegister && (
        <div className="text-center text-sm text-gray-600">
          Nog geen account?{' '}
          <button 
            onClick={onSwitchToRegister} 
            className="text-[#6B8E23] font-medium hover:underline"
            disabled={isPending}
          >
            Registreer
          </button>
        </div>
      )}

      {/* Footer */}
      <div className="text-center text-xs text-gray-500">
        Door in te loggen ga je akkoord met onze{' '}
        <a 
          href="/terms-and-conditions" 
          className="underline hover:text-[#6B8E23]"
          target="_blank"
          rel="noopener noreferrer"
        >
          gebruiksvoorwaarden
        </a>
      </div>
    </div>
  );
}
