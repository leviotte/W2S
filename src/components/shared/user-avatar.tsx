// src/components/shared/user-avatar.tsx
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { UserProfile } from '@/types/user';

interface UserAvatarProps {
  user: Partial<UserProfile>;
  className?: string;
}

export function UserAvatar({ user, className }: UserAvatarProps) {
  const initial = user.displayName?.charAt(0).toUpperCase() || '?';

  return (
    <Avatar className={className}>
      <AvatarImage src={user.photoURL ?? undefined} alt={user.displayName ?? 'Gebruiker'} />
      <AvatarFallback>{initial}</AvatarFallback>
    </Avatar>
  );
}