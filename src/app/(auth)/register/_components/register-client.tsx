// src/app/(auth)/register/_components/register-client.tsx
'use client';

import RegisterForm from '@/components/auth/register-form';
import { useRouter } from 'next/navigation';

export function RegisterClient() {
  const router = useRouter();

  const handleSwitchToLogin = () => {
    router.push('/login');
  };

  return <RegisterForm onSwitchToLogin={handleSwitchToLogin} />;
}