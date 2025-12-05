/**
 * components/shared/UserAvatar.tsx
 *
 * Een zeer herbruikbaar component om de avatar van een entiteit te tonen.
 * Dit component is bewust "dom" en losgekoppeld van specifieke datastructuren zoals 'UserProfile'.
 * Het heeft enkel een naam (voor de initialen) en een optionele afbeeldings-URL nodig.
 */
'use client';

import * as React from 'react';
import * as AvatarPrimitive from '@radix-ui/react-avatar';

import { cn } from '@/lib/utils';

// --- VERBETERING 1: Utility functie voor initialen ---
// Deze functie is robuuster en kan overweg met namen met één, twee of meer woorden.
// "Levi" -> "L", "Levi Otte" -> "LO", "Jan De Smet" -> "JS"
const getInitials = (name: string): string => {
  if (!name) return '';
  const parts = name.trim().split(' ');
  const first = parts[0]?.[0]?.toUpperCase() ?? '';
  const last = parts.length > 1 ? parts[parts.length - 1]?.[0]?.toUpperCase() ?? '' : '';
  return `${first}${last}`;
};


// --- VERBETERING 2: Vereenvoudigde en meer generieke props ---
// We vragen niet meer om een heel 'user' object, enkel wat we nodig hebben.
interface UserAvatarProps extends React.ComponentPropsWithoutRef<typeof AvatarPrimitive.Root> {
  name: string;
  src?: string | null;
  size?: 'sm' | 'md' | 'lg';
}

const UserAvatar = React.forwardRef<
  React.ElementRef<typeof AvatarPrimitive.Root>,
  UserAvatarProps
>(({ className, name, src, size = 'md', ...props }, ref) => {
  
  const sizeClasses = {
    sm: 'h-8 w-8 text-xs',
    md: 'h-10 w-10 text-sm',
    lg: 'h-12 w-12 text-base',
  };

  return (
    <AvatarPrimitive.Root
      ref={ref}
      className={cn('relative flex shrink-0 overflow-hidden rounded-full', sizeClasses[size], className)}
      {...props}
    >
      {/* De afbeelding wordt getoond als 'src' een geldige URL is */}
      <AvatarPrimitive.Image
        src={src || undefined} // Belangrijk: lege string of null wordt 'undefined' zodat fallback werkt
        alt={name}
        className="aspect-square h-full w-full object-cover"
      />
      {/* Fallback wordt getoond tijdens het laden of als de afbeelding niet gevonden is */}
      <AvatarPrimitive.Fallback
        delayMs={300} // Iets snellere delay voor een vlottere ervaring
        className="flex h-full w-full items-center justify-center rounded-full bg-muted font-semibold text-muted-foreground"
      >
        {getInitials(name)}
      </AvatarPrimitive.Fallback>
    </AvatarPrimitive.Root>
  );
});

UserAvatar.displayName = 'UserAvatar';

export { UserAvatar };