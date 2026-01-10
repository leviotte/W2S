'use client';

import { useState, useTransition } from 'react';
import { toast } from 'sonner';
import { completeSocialLoginAction } from '@/lib/server/actions/auth';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { googleSignInClient } from '@/lib/client/google';
import { appleSignInClient } from '@/lib/client/apple';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getClientAuth } from '@/lib/client/firebase';

export function LoginFormServerFirst() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isPending, startTransition] = useTransition();

  const handleLogin = () => {
  startTransition(async () => {
    try {
      const auth = getClientAuth();

      const credential = await signInWithEmailAndPassword(
        auth,
        email,
        password
      );

      const idToken = await credential.user.getIdToken();

      const result = await completeSocialLoginAction(idToken, 'password');

      if (result.success) {
        window.location.href = result.data?.redirectTo || '/dashboard';
      } else {
        toast.error(result.error || 'Login mislukt');
      }
    } catch (err: any) {
      toast.error(
        err?.code === 'auth/wrong-password'
          ? 'Ongeldig wachtwoord'
          : err?.message || 'Login mislukt'
      );
    }
  });
};

  const handleSocial = (provider: 'google' | 'apple') => {
    startTransition(async () => {
      try {
        const idToken =
          provider === 'google'
            ? await googleSignInClient.getIdToken()
            : await appleSignInClient.getIdToken();

        const result = await completeSocialLoginAction(idToken, provider);

        if (result.success) {
          window.location.href = result.data?.redirectTo || '/dashboard';
        } else {
          toast.error(result.error);
        }
      } catch (e: any) {
        toast.error(e.message || 'Social login fout');
      }
    });
  };

  return (
    <div className="flex flex-col gap-6">
      <Card className="overflow-hidden">
        <CardContent className="p-6 md:p-8">
          <div className="flex flex-col gap-6">
            <div className="text-center">
              <h1 className="text-2xl font-bold">Welkom terug</h1>
              <p className="text-muted-foreground">
                Log in bij Wish2Share
              </p>
            </div>

            <div className="grid gap-2">
              <Label>E-mail</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="naam@voorbeeld.be"
              />
            </div>

            <div className="grid gap-2">
              <Label>Wachtwoord</Label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>

            <Button onClick={handleLogin} disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Login
            </Button>

            <div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:border-t">
              <span className="relative z-10 bg-background px-2 text-muted-foreground">
                Of log in met
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Button variant="outline" onClick={() => handleSocial('apple')}>
                Apple
              </Button>
              <Button variant="outline" onClick={() => handleSocial('google')}>
                Google
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
