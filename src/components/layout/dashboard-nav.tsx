// src/components/layout/dashboard-nav.tsx
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import type { NavItem } from '@/lib/config/dashboard';

interface DashboardNavProps {
  items: NavItem[];
}

// ... de rest van het bestand blijft hetzelfde
export default function DashboardNav({ items }: DashboardNavProps) {
  const pathname = usePathname();

  return (
    <nav className="grid items-start gap-2">
      {items.map((item, index) => (
        <Link key={index} href={item.disabled ? '#' : item.href}>
          <span
            className={cn(
              'group flex items-center rounded-md px-3 py-2 text-sm font-medium hover:bg-accent hover:text-accent-foreground',
              pathname === item.href ? 'bg-accent' : 'transparent',
              item.disabled && 'cursor-not-allowed opacity-80'
            )}
          >
            {item.icon}
            <span className="ml-2">{item.title}</span>
          </span>
        </Link>
      ))}
    </nav>
  );
}