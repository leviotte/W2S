// src/app/(auth)/login/page.tsx
import { Metadata } from 'next';
import LoginFormServerFirst from '@/components/auth/LoginFormClient';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Login | Wish2Share',
  description: 'Login om je account te gebruiken',
};

export default function LoginPage() {
  return (
    <div className="container flex min-h-screen w-screen flex-col items-center justify-center py-8">
      {/* Terug link naar home */}
      <Link
        href="/"
        className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug naar home
      </Link>

      {/* Login form */}
      <LoginFormServerFirst />
    </div>
  );
}
