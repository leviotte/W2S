'use client';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  profile?: {
    photoURL?: string | null;
    displayName?: string;
    firstName?: string;
    lastName?: string;
  };
  src?: string | null;
  name?: string;
  firstName?: string;
  lastName?: string;
  photoURL?: string | null;
  className?: string;
  size?: string;
}

export function UserAvatar({ 
  profile,
  src, 
  name,
  firstName,
  lastName,
  photoURL,
  className,
  size = 'h-10 w-10'
}: UserAvatarProps) {
  const actualPhotoURL = src || photoURL || profile?.photoURL;
  const actualName = name || profile?.displayName || 
    (firstName && lastName ? `${firstName} ${lastName}` : '') ||
    (profile?.firstName && profile?.lastName ? `${profile.firstName} ${profile.lastName}` : '');

  const initials = actualName
    ? actualName
        .split(' ')
        .map(n => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : '??';

  return (
    <Avatar className={cn(size, className)}>
      {actualPhotoURL && <AvatarImage src={actualPhotoURL} alt={actualName || 'User'} />}
      <AvatarFallback>{initials}</AvatarFallback>
    </Avatar>
  );
}