// src/components/auth/LoginFormClient.tsx
'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { getClientAuth } from '@/lib/client/firebase';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { useRouter } from 'next/navigation';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import type { AuthActionResult } from '@/lib/server/actions/auth';
import { completeSocialLoginAction } from '@/lib/server/actions/auth';
import { SocialAuthButtons } from './social-auth-buttons';

export default function LoginFormClient() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();
  const [loading, setLoading] = useState<'email' | null>(null);
  const router = useRouter();

  const handleEmailLogin = () => {
    startTransition(async () => {
      setLoading('email');
      try {
        const auth = getClientAuth();
        const credential = await signInWithEmailAndPassword(auth, email, password);
        const idToken = await credential.user.getIdToken();

        const result: AuthActionResult = await completeSocialLoginAction(idToken, 'password');

        if (result.success) {
          router.push(result.data?.redirectTo ?? '/dashboard');
        } else {
          toast.error(result.error ?? 'Login mislukt');
        }
      } catch (err: any) {
        toast.error(
          err?.code === 'auth/wrong-password'
            ? 'Ongeldig wachtwoord'
            : err?.message ?? 'Login mislukt'
        );
      } finally {
        setLoading(null);
      }
    });
  };

  return (
    <div className="flex flex-col gap-6" suppressHydrationWarning>
      <Card className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Welkom terug</h1>
              <p className="text-muted-foreground">Log in bij Wish2Share</p>
            </div>

            {/* Email / Password */}
            <div className="grid gap-2">
              <Label>E-mail</Label>
              <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </div>
            <div className="grid gap-2">
              <Label>Wachtwoord</Label>
              <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} />
            </div>
            <Button onClick={handleEmailLogin} disabled={!!loading || isPending} className="w-full">
              {loading === 'email' && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>

            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:border-t">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Of log in met
              </span>
            </div>

            {/* Social login buttons */}
            <SocialAuthButtons />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
