// src/app/(auth)/login/_components/login-client.tsx
'use client';
import { LoginForm } from '@/components/auth/login-form';
import { loginServerAction } from '../_actions';

export function LoginClient() {
  const handleSuccess = async (idToken: string) => {
    // call server action
    await loginServerAction(idToken);
  };

  return <LoginForm onSuccess={handleSuccess} />;
}
