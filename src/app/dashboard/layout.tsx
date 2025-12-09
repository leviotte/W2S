// src/app/dashboard/layout.tsx
import { getCurrentUser } from '@/lib/server/auth';
import { redirect } from 'next/navigation';
import DashboardNav from '@/components/layout/dashboard-nav';
// DE FIX: De extensie .tsx weghalen.
import { sidebarNavItems } from '@/lib/config/dashboard'; 

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect('/?auth=login');
  }

  return (
    <div className="container grid flex-1 gap-12 md:grid-cols-[200px_1fr]">
      <aside className="hidden w-[200px] flex-col md:flex">
        <DashboardNav items={sidebarNavItems} />
      </aside>
      <main className="flex w-full flex-1 flex-col overflow-hidden">
        {children}
      </main>
    </div>
  );
}
