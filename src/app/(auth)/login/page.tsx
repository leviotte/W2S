import { Metadata } from 'next';
import { LoginForm } from '@/components/auth/login-form';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Inloggen | Wish2Share',
  description: 'Log in op je Wish2Share account',
};

export default function LoginPage() {
  return (
    <div className="container flex h-screen w-screen flex-col items-center justify-center">
      <Link
        href="/"
        className="absolute left-4 top-4 md:left-8 md:top-8 flex items-center text-sm font-medium text-muted-foreground hover:text-primary"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Terug naar home
      </Link>
      
      <div className="mx-auto flex w-full flex-col justify-center space-y-6 sm:w-[450px]">
        <LoginForm 
          onSwitchToRegister={() => window.location.href = '/register'}
        />
      </div>
    </div>
  );
}