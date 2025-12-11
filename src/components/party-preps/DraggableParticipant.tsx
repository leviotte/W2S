'use client';

import React from 'react';
import { UserAvatar } from '@/components/shared/user-avatar';
import { cn } from '@/lib/utils';

// FOUT OPGELOST: De props zijn nu "flat" en direct.
export interface DraggableParticipantProps
  extends React.HTMLAttributes<HTMLDivElement> {
  id: string;
  firstName: string;
  lastName: string;
  photoURL?: string | null;
  isCurrentUser?: boolean;
}

// BEST PRACTICE: Gebruik React.forwardRef om de ref van dnd-kit te ontvangen.
const DraggableParticipant = React.forwardRef<
  HTMLDivElement,
  DraggableParticipantProps
>(
  (
    {
      id,
      firstName,
      lastName,
      photoURL,
      isCurrentUser,
      className,
      ...props
    },
    ref
  ) => {
    const name = `${firstName || ''} ${lastName || ''}`.trim();

    return (
      <div
        ref={ref}
        className={cn(
          'inline-flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 text-sm font-medium transition-all cursor-grab active:cursor-grabbing shadow-sm',
          isCurrentUser
            ? 'bg-primary text-primary-foreground'
            : 'bg-muted text-muted-foreground',
          className
        )}
        {...props}
      >
        <UserAvatar
          src={photoURL}
          name={name}
          className="h-6 w-6 text-xs"
        />
        <span>{name}</span>
      </div>
    );
  }
);

DraggableParticipant.displayName = 'DraggableParticipant';

export default DraggableParticipant;