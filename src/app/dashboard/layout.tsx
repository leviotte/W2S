// src/app/dashboard/layout.tsx
import { getCurrentUser } from '@/lib/auth/actions';
import { redirect } from 'next/navigation';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect('/?auth=login');

  return (
    <div className="min-h-screen bg-background">
      <main className="w-full">{children}</main>
    </div>
  );
}
