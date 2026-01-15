// src/app/(auth)/register/page.tsx
import { Metadata } from 'next';
import { RegisterClient } from './_components/register-client';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Registreren | Wish2Share',
  description: 'Maak een gratis Wish2Share account aan',
};

export default function RegisterPage() {
  return (
    <div className="container flex min-h-screen w-screen flex-col items-center justify-center py-8">
      <Link
        href="/"
        className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug naar home
      </Link>

      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[500px]">
        <RegisterClient />
      </div>
    </div>
  );
}
