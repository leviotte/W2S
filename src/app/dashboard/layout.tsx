// src/app/dashboard/layout.tsx
import { getCurrentUser } from "@/lib/auth/actions";
import { redirect } from "next/navigation";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default async function DashboardLayout({ children }: DashboardLayoutProps) {
  const currentUser = await getCurrentUser();

  if (!currentUser) {
    redirect("/?auth=login");
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Navbar wordt nu enkel in RootLayout getoond */}
      <main className="w-full">{children}</main>
    </div>
  );
}
