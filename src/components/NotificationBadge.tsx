// src/components/NotificationBadge.tsx
"use client";

import React, { FC, memo } from "react";

interface NotificationBadgeProps {
  count: number;
  className?: string;
}

const NotificationBadge: FC<NotificationBadgeProps> = ({ count, className = "" }) => {
  if (count <= 0) return null;

  const displayCount = count > 99 ? "99+" : count;

  return (
    <span
      className={`inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white transform translate-x-1/2 -translate-y-1/2 bg-[#b34c4c] rounded-full ${className}`}
      aria-label={`${displayCount} nieuwe meldingen`}
    >
      {displayCount}
    </span>
  );
};

// Memo om onnodige re-renders te voorkomen
export default memo(NotificationBadge);
