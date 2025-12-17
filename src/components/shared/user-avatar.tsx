// src/components/shared/user-avatar.tsx
import { cn } from '@/lib/utils';

interface UserAvatarProps {
  photoURL?: string | null;
  firstName?: string;
  lastName?: string;
  name?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export function UserAvatar({ 
  photoURL, 
  firstName = '',
  lastName = '',
  name, 
  size = 'md', 
  className = '' 
}: UserAvatarProps) {
  const getInitials = () => {
    if (name) {
      const [firstWord, secondWord] = name.split(' ');
      const firstInitial = firstWord?.[0]?.toUpperCase() || '';
      const secondInitial = secondWord?.[0]?.toUpperCase() || '';
      return `${firstInitial}${secondInitial}`;
    } else {
      const firstInitial = firstName?.[0]?.toUpperCase() || '';
      const lastInitial = lastName?.[0]?.toUpperCase() || '';
      return `${firstInitial}${lastInitial}`;
    }
  };

  const sizeClasses = {
    sm: 'h-8 w-8 text-sm',
    md: 'h-10 w-10 text-base',
    lg: 'h-12 w-12 text-lg',
    xl: 'h-16 w-16 text-xl'
  };

  return (
    <div className={cn('flex-shrink-0 rounded-full overflow-hidden', sizeClasses[size], className)}>
      {photoURL ? (
        <img
          src={photoURL}
          alt={name || `${firstName} ${lastName}`}
          className="h-full w-full object-cover"
        />
      ) : (
        <div className="h-full w-full bg-warm-olive flex items-center justify-center text-white font-medium">
          {getInitials()}
        </div>
      )}
    </div>
  );
}