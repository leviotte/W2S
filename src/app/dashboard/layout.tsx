// src/app/dashboard/layout.tsx
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/auth/session.server';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user } = await getSession();

  if (!user) {
    redirect('/?auth=login');
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full">{children}</main>
    </div>
  );
}
