'use client';

import { useState } from 'react';
import { UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface WishlistInviteHandlerProps {
  recipientFirstName: string;
  recipientLastName: string;
  recipientEmail: string;
}

export function WishlistInviteHandler({
  recipientFirstName,
  recipientLastName,
  recipientEmail,
}: WishlistInviteHandlerProps) {
  const [isInviting, setIsInviting] = useState(false);

  const handleInvite = async () => {
    setIsInviting(true);
    
    try {
      // TODO: Implement invite logic via Server Action
      // await invitePersonAction({ firstName, lastName, email });
      
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
      
      toast.success(
        `Uitnodiging verzonden naar ${recipientFirstName} ${recipientLastName}`
      );
    } catch (error) {
      toast.error('Er ging iets mis bij het verzenden van de uitnodiging');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-600">
        Persoon niet gevonden? Geen probleem, nodig ze uit door op de knop hieronder te klikken!
      </p>
      <Button
        onClick={handleInvite}
        disabled={isInviting}
        variant="default"
        className="bg-green-700 hover:bg-green-800 text-white font-medium"
      >
        <UserPlus className="h-4 w-4 mr-2" />
        {isInviting ? 'Uitnodiging verzenden...' : 'Nodig persoon uit'}
      </Button>
    </div>
  );
}