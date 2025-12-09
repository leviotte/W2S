// src/lib/config/dashboard.ts
import { LayoutDashboard, Calendar, Gift, Settings, User } from 'lucide-react';

export interface NavItem {
  title: string;
  href: string;
  icon: React.ReactNode;
  disabled?: boolean;
}

export const sidebarNavItems: NavItem[] = [
  {
    title: 'Dashboard',
    href: '/dashboard',
    icon: <LayoutDashboard className="h-4 w-4" />,
  },
  {
    title: 'Aankomende Events',
    href: '/dashboard/upcoming',
    icon: <Calendar className="h-4 w-4" />,
  },
    {
    title: 'Mijn Wishlists',
    href: '/dashboard/wishlists',
    icon: <Gift className="h-4 w-4" />,
  },
  {
    title: 'Profiel',
    href: '/dashboard/profile',
    icon: <User className="h-4 w-4" />,
  },
  {
    title: 'Instellingen',
    href: '/dashboard/settings',
    icon: <Settings className="h-4 w-4" />,
  },
];