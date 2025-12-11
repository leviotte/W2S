// src/components/shared/user-avatar.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

// Helper functie, buiten het component gedefinieerd voor performance.
// We nemen jouw slimmere logica over!
const getInitials = (name?: string | null) => {
  if (!name) return '??';
  const names = name.trim().split(' ').filter(Boolean); // filter(Boolean) verwijdert lege strings
  if (names.length === 0) return '??';
  if (names.length === 1 && names[0].length > 1) {
    return names[0].substring(0, 2).toUpperCase();
  }
  const initials = names.map((n) => n[0]).join('');
  return initials.slice(0, 2).toUpperCase();
};

// De props zijn ontkoppeld van de UserProfile structuur.
// Hierdoor is dit component overal inzetbaar.
export interface UserAvatarProps {
  src?: string | null;
  name?: string | null;
  className?: string;
}

export function UserAvatar({ src, name, className }: UserAvatarProps) {
  return (
    <Avatar className={cn('bg-muted text-muted-foreground', className)}>
      {/* 
        AvatarImage toont zichzelf alleen bij een geldige 'src'. 
        Anders wordt automatisch de AvatarFallback getoond.
      */}
      <AvatarImage src={src ?? undefined} alt={name ?? 'User avatar'} />
      <AvatarFallback>{getInitials(name)}</AvatarFallback>
    </Avatar>
  );
}