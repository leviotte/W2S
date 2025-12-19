// src/components/event/DrawnNameSection.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import NameDrawingAnimation from '@/components/event/NameDrawingAnimation';
import type { Event, EventParticipant } from '@/types/event';
import type { Wishlist } from '@/types/wishlist';

interface DrawnNameSectionProps {
  event: Event;
  participants: EventParticipant[];
  drawnParticipantId?: string;
  drawnName?: string;
  wishlist?: Wishlist | null;
  onNameDrawn: (name: string) => void;
  currentUserId: string;
}

// ✅ FIX: Export als DEFAULT (geen named export)
export default function DrawnNameSection({
  event,
  participants,
  drawnParticipantId,
  drawnName,
  wishlist,
  onNameDrawn,
  currentUserId,
}: DrawnNameSectionProps) {
  const router = useRouter();
  const [showDrawingModal, setShowDrawingModal] = useState(false);

  const allowToDraw = (() => {
    if (!event) return false;

    const now = new Date();
    const deadline = event.registrationDeadline ? new Date(event.registrationDeadline) : null;

    if (event.allowSelfRegistration) {
      const maxReached = event.maxParticipants === participants.length;
      const deadlinePassed = deadline && now >= deadline;
      
      return maxReached || deadlinePassed || event.allowDrawingNames;
    }
    
    return true;
  })();

  const drawnParticipant = participants.find(p => p.id === drawnParticipantId);

  const handleWishlistAction = () => {
    if (!drawnParticipant) return;

    if (wishlist) {
      router.push(`/dashboard/wishlist/${wishlist.slug}/${event.id}?tab=wishlists&subTab=event-details`);
    } else {
      router.push(`/dashboard/event/${event.id}/request/${drawnParticipant.id}?tab=event&subTab=request&type=wishlist`);
    }
  };

  const handleNameDrawn = (name: string) => {
    onNameDrawn(name);
    setShowDrawingModal(false);
  };

  const participantsToBeDrawn = participants.filter(
    p => p.id !== currentUserId && !event.drawnNames?.[currentUserId]
  );

  return (
    <>
      {showDrawingModal && (
        <div className="fixed w-screen h-screen inset-0 z-50 bg-gray-500/75 flex justify-center items-center">
          <NameDrawingAnimation
            isOpen={showDrawingModal}
            onClose={() => setShowDrawingModal(false)}
            names={participantsToBeDrawn.map(p => `${p.firstName} ${p.lastName}`)}
            onNameDrawn={handleNameDrawn}
          />
        </div>
      )}

      <Card className="backdrop-blur-sm bg-white/40 shadow-xl mb-6">
        <CardContent className="p-6">
          {allowToDraw && (
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Shhh! Jij koopt voor:
            </h2>
          )}

          {drawnName ? (
            <div className="flex items-center justify-between">
              <div className="text-lg font-medium">{drawnName}</div>
              <Button
                onClick={handleWishlistAction}
                variant="ghost"
                className="inline-flex items-center space-x-2 hover:text-cool-olive"
              >
                <Gift className="h-5 w-5 flex-shrink-0" />
                <span>
                  {drawnParticipant?.wishlistId ? 'View wishlist' : 'Request wishlist'}
                </span>
              </Button>
            </div>
          ) : (
            <>
              {allowToDraw ? (
                <Button
                  onClick={() => setShowDrawingModal(true)}
                  className="w-full bg-warm-olive text-white hover:bg-cool-olive flex items-center justify-center"
                >
                  <Gift className="h-5 w-5 mr-2" />
                  <span>Trek een naam</span>
                </Button>
              ) : (
                <p className="text-sm text-gray-600">
                  Trek een naam kan alleen gestart worden wanneer de deadline is verstreken of het maximaal aantal deelnemers is bereikt.
                </p>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </>
  );
}