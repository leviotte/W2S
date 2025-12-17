// src/components/shared/notification-badge.tsx
import React from 'react';

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

export function NotificationBadge({ count, className = '' }: NotificationBadgeProps) {
  if (count <= 0) return null;

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-[#b34c4c] rounded-full ${className}`}
    >
      {count > 99 ? '99+' : count}
    </span>
  );
}