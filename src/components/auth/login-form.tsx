'use client';

import { useState, useTransition } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Eye, EyeOff, Loader2 } from 'lucide-react';
import { signInWithEmailAndPassword, sendEmailVerification } from 'firebase/auth';
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

  const onSubmit = (data: LoginFormValues) => {
    startTransition(async () => {
      try {
        // Step 1: Client-side Firebase login
        const auth = getClientAuth();
        const userCredential = await signInWithEmailAndPassword(
          auth, 
          data.email, 
          data.password
        );
        
        const user = userCredential.user;

        // Check if email is verified
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

        // Step 2: Get ID token
        const idToken = await user.getIdToken();

        // Step 3: Server-side session creation
        const result = await completeLoginAction(idToken);

        if (result.success) {
          toast.success('Welkom terug!');
          
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
    <div className="flex flex-col gap-4">
      {/* Header */}
      <div className="flex flex-col items-center text-center gap-1">
        <h1 className="text-2xl font-bold">Welkom terug</h1>
        <p className="text-sm text-muted-foreground">Log in op je Wish2Share-account</p>
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
                <FormLabel>E-mailadres</FormLabel>
                <FormControl>
                  <Input 
                    type="email" 
                    placeholder="leviotte@icloud.com" 
                    {...field} 
                    autoComplete="email"
                    disabled={isPending}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Wachtwoord */}
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
                      placeholder="•••••••" 
                      {...field} 
                      autoComplete="current-password"
                      disabled={isPending}
                      className="pr-10"
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
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Wachtwoord vergeten */}
          {onSwitchToForgotPassword && (
            <div className="flex justify-end -mt-2">
              <button
                type="button"
                onClick={onSwitchToForgotPassword}
                className="text-sm text-primary hover:underline"
                disabled={isPending}
              >
                Wachtwoord vergeten?
              </button>
            </div>
          )}

          {/* Submit Button */}
          <Button 
            type="submit" 
            className="w-full mt-2" 
            disabled={isPending}
            style={{ backgroundColor: '#6B8E23' }} // Olive green
          >
            {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Log in
          </Button>
        </form>
      </Form>

      {/* Switch to Register */}
      {onSwitchToRegister && (
        <div className="text-center text-sm">
          Heb je al een account?{' '}
          <button 
            onClick={onSwitchToRegister} 
            className="text-primary font-medium hover:underline"
            disabled={isPending}
          >
            Log in
          </button>
        </div>
      )}
    </div>
  );
}