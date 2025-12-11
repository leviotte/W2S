// src/components/shared/user-avatar.tsx
'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { UserProfile, SubProfile } from '@/types/user';

// Helper functie voor initialen
const getInitials = (firstName?: string | null, lastName?: string | null, fallbackName?: string | null) => {
  // Eerst proberen met firstName + lastName
  if (firstName || lastName) {
    const initials = `${firstName?.[0] || ''}${lastName?.[0] || ''}`.toUpperCase();
    if (initials.length > 0) return initials;
  }
  
  // Fallback naar name parsing
  if (fallbackName) {
    const names = fallbackName.trim().split(' ').filter(Boolean);
    if (names.length === 0) return '??';
    if (names.length === 1 && names[0].length > 1) {
      return names[0].substring(0, 2).toUpperCase();
    }
    const initials = names.map((n) => n[0]).join('');
    return initials.slice(0, 2).toUpperCase();
  }
  
  return '??';
};

// FLEXIBELE INTERFACE: Accepteert ofwel losse props, ofwel een profile object
export interface UserAvatarProps {
  // Optie 1: Losse props (backward compatible)
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null; // Fallback
  
  // Optie 2: Een profile object (nieuwe manier - BEST PRACTICE)
  profile?: (UserProfile | SubProfile) & { id?: string };
  
  className?: string;
}

export function UserAvatar({ 
  src, 
  firstName, 
  lastName, 
  name,
  profile, 
  className 
}: UserAvatarProps) {
  // Als profile is meegegeven, gebruik die data
  const avatarSrc = profile?.photoURL || src;
  const avatarFirstName = profile?.firstName || firstName;
  const avatarLastName = profile?.lastName || lastName;
  const avatarName = name || (profile ? `${profile.firstName} ${profile.lastName}` : undefined);
  
  const initials = getInitials(avatarFirstName, avatarLastName, avatarName);
  
  return (
    <Avatar className={cn('bg-muted text-muted-foreground', className)}>
      <AvatarImage 
        src={avatarSrc ?? undefined} 
        alt={avatarName ?? 'User avatar'} 
      />
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}