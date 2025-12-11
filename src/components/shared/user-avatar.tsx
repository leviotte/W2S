'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import type { UserProfile, SubProfile } from '@/types/user';

export interface UserAvatarProps {
  // Optie 1: Losse props
  src?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  name?: string | null;
  
  // ✅ NIEUWE PROP VOOR BACKWARD COMPATIBILITY
  photoURL?: string | null;
  
  // Optie 2: Een profile object
  profile?: (UserProfile | SubProfile) & { id?: string };
  
  className?: string;
  
  // ✅ SIZE PROP (optioneel, niet gebruikt maar voorkomt errors)
  size?: string;
}

/**
 * Helper functie om initialen te genereren
 */
function getInitials(
  firstName?: string | null,
  lastName?: string | null,
  name?: string | null
): string {
  if (firstName && lastName) {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  }
  
  if (name) {
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return `${parts[0].charAt(0)}${parts[parts.length - 1].charAt(0)}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }
  
  return '?';
}

export function UserAvatar({ 
  src, 
  firstName, 
  lastName, 
  name,
  photoURL, // ✅ NIEUWE PROP
  profile, 
  className,
  size // ✅ ACCEPTEER MAAR NEGEER
}: UserAvatarProps) {
  // Als profile is meegegeven, gebruik die data
  const avatarSrc = profile?.photoURL || photoURL || src; // ✅ FALLBACK CHAIN
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