// src/app/(auth)/login/_components/login-client.tsx
'use client';

import { LoginForm } from '@/components/auth/login-form';
import { useRouter } from 'next/navigation';

export function LoginClient() {
  const router = useRouter();

  const handleSwitchToRegister = () => {
    router.push('/register');
  };

  return <LoginForm onSwitchToRegister={handleSwitchToRegister} />;
}