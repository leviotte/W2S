// src/app/(auth)/login/page.tsx
import LoginFormServer from '@/components/auth/LoginForm.server';

export default function LoginPage() {
  return (
    <div className="container flex min-h-screen flex-col items-center justify-center py-8">
      <LoginFormServer />
    </div>
  );
}
