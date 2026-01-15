// src/components/event/EventWishlistSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Gift, Trash, UserPlus, UserMinus } from 'lucide-react';
import type { Event, EventParticipant } from '@/types/event';
import type { Wishlist } from '@/types/wishlist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { EventWishlistLinkModalClient } from '@/app/event/_components/EventWishlistLinkModal.client';
import { fetchEventParticipantsWithWishlists } from '@/lib/server/actions/events';
import { addEventParticipantAction, deleteEventParticipantAction } from '@/lib/server/actions/events';

type WishlistForModal = {
  id: string;
  name: string;
  userId: string;
  isPublic: boolean;
  items: Wishlist['items'];
  eventId: string;
};

interface EventWishlistsSectionProps {
  participants: EventParticipant[];
  currentUserId: string;
  eventId: string;
  maxPrice?: number;
  organizer: string;
  isDrawNames: boolean;
  event?: Event; // ✅ Event kan wishlists bevatten
}

export default function EventWishlistsSection({
  participants,
  currentUserId,
  eventId,
  maxPrice,
  organizer,
  isDrawNames,
  event,
}: EventWishlistsSectionProps) {
  const router = useRouter();
  const [eventParticipants, setEventParticipants] = useState<EventParticipant[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState<string>('');
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  const wishlistsForModal: WishlistForModal[] = Array.isArray(event?.wishlists)
  ? event.wishlists.map((w: Wishlist) => ({
      id: w.id,
      name: w.name,
      userId: w.ownerId || w.userId,
      isPublic: w.isPublic,
      items: w.items,
      eventId: w.eventId ?? eventId,
    }))
  : [];

  // ================================
  // Fetch participants
  // ================================
  useEffect(() => {
    const fetchParticipants = async () => {
      const result = await fetchEventParticipantsWithWishlists(eventId);
      if (result.success) setEventParticipants(result.data as EventParticipant[]);
    };
    fetchParticipants();
  }, [eventId]);

  // ================================
  // Handlers
  // ================================
  
const handleAddMember = async () => {
  if (!newMemberData.firstName || !newMemberData.lastName) {
    toast.error('Vul voornaam en achternaam in');
    return;
  }

  try {
    const result = await addEventParticipantAction(eventId, newMemberData);
    if (result.success && result.participant) {
      setEventParticipants(prev => [
        ...prev,
        {
          ...result.participant,
          email: result.participant.email ?? null,
          wishlistId: result.participant.wishlistId ?? null,
          photoURL: result.participant.photoURL ?? null,
          profileId: result.participant.profileId ?? null,
        } as EventParticipant,
      ]);
      setShowAddMemberModal(false);
      setNewMemberData({ firstName: '', lastName: '', email: '' });
      toast.success('Deelnemer toegevoegd!');
    } else {
      toast.error(result.message || 'Kon deelnemer niet toevoegen');
    }
  } catch (err) {
    console.error(err);
    toast.error('Onverwachte fout bij toevoegen deelnemer');
  }
};

const handleRemoveParticipant = async (participantId: string) => {
  try {
    const result = await deleteEventParticipantAction(eventId, participantId);
    if (result.success) {
      setEventParticipants(prev => prev.filter(p => p.id !== participantId));
      toast.success('Deelnemer verwijderd!');
    } else {
      toast.error(result.message || 'Kon deelnemer niet verwijderen');
    }
  } catch (err) {
    console.error(err);
    toast.error('Onverwachte fout bij verwijderen deelnemer');
  }
};

  const handleWishlistAction = (participant: EventParticipant & { wishlist?: Wishlist }) => {
    if (isRemoveMode) return;

    if (participant.id === currentUserId) {
      if (participant.wishlist) {
        router.push(
          `/dashboard/wishlist/${participant.wishlist.slug}/${eventId}?tab=wishlists&subTab=details&maxPrice=${maxPrice}`
        );
      } else {
        setSelectedParticipantId(participant.id);
        setShowLinkModal(true);
      }
      return;
    }

    if (participant.wishlistId) {
      const wishlist = Array.isArray(event?.wishlists)
  ? event.wishlists.find((w: Wishlist) => w.id === participant.wishlistId)
  : undefined;

      if (wishlist) {
        router.push(
          `/dashboard/wishlist/${wishlist.slug}/${eventId}?tab=wishlists&subTab=event-details`
        );
      }
    } else {
      router.push(
        `/dashboard/event/${eventId}?tab=event&subTab=request&type=wishlist&participantId=${participant.id}`
      );
    }
  };

  // ================================
  // Render
  // ================================
  return (
    <>
      {/* Wishlist Link Modal */}
      {showLinkModal && (
  <EventWishlistLinkModalClient
    wishlists={wishlistsForModal} // <-- nu getypt en veilig
    userId={currentUserId}
    participantId={selectedParticipantId}
    eventId={eventId}
    onSuccess={(wishlistId: string) => {
      setEventParticipants(prev =>
        prev.map(p => (p.id === selectedParticipantId ? { ...p, wishlistId } : p))
      );
      setShowLinkModal(false);
    }}
  />
)}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div
          onClick={() => setShowAddMemberModal(false)}
          className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-semibold mb-4">Voeg deelnemer toe</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Voornaam*</label>
                <input
                  type="text"
                  value={newMemberData.firstName}
                  onChange={e => setNewMemberData({ ...newMemberData, firstName: e.target.value })}
                  className="w-full p-2 border focus:border-gray-300 focus:ring-0 border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Achternaam*</label>
                <input
                  type="text"
                  value={newMemberData.lastName}
                  onChange={e => setNewMemberData({ ...newMemberData, lastName: e.target.value })}
                  className="w-full p-2 border focus:border-gray-300 focus:ring-0 border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <Button variant="outline" onClick={() => setShowAddMemberModal(false)}>
                  Annuleren
                </Button>
                <Button onClick={handleAddMember}>Toevoegen</Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Wishlists Section */}
      <Card className="backdrop-blur-sm bg-white/40 shadow-xl">
        <CardHeader>
          <CardTitle className="text-xl font-semibold">Wish2Share-Lijstjes</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {eventParticipants.map(participant => {
            const isCurrentUser = participant.id === currentUserId;

            return (
              <div
                key={participant.id}
                className={`rounded-lg border-[1.5px] border-black transition-all duration-200 ${
                  isRemoveMode && !isCurrentUser && participant.id !== organizer ? 'pr-10 relative' : ''
                }`}
              >
                <div className="p-4 grid grid-cols-[1fr,auto] gap-4 items-center">
                  <div className="min-w-0">
                    <p className="font-medium truncate">
                      {participant.firstName} {participant.lastName}
                      {isCurrentUser && ` (Jij${participant.id === organizer ? ' - Organizer' : ''})`}
                      {participant.id === organizer && !isCurrentUser && ' (Organizer)'}
                    </p>
                  </div>

                  <button
                    onClick={() => handleWishlistAction(participant)}
                    className={`inline-flex items-center space-x-2 hover:text-cool-olive whitespace-nowrap ${
                      isRemoveMode ? 'pointer-events-none opacity-60' : ''
                    }`}
                  >
                    <Gift className="h-5 w-5 flex-shrink-0" />
                    <span>
                      {isCurrentUser
                        ? participant.wishlistId
                          ? 'Bekijk mijn lijst'
                          : 'Kies mijn lijst'
                        : participant.wishlistId
                        ? 'Bekijk lijst'
                        : 'Vraag lijst'}
                    </span>
                  </button>
                </div>

                {isRemoveMode && !isCurrentUser && participant.id !== organizer && (
                  <button
                    onClick={() => handleRemoveParticipant(participant.id)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash className="h-5 w-5" />
                  </button>
                )}
              </div>
            );
          })}

          {/* Organizer Actions */}
          {organizer === currentUserId && (
            <div className="mt-7 flex flex-col gap-[10px]">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddMemberModal(true);
                  if (isRemoveMode) setIsRemoveMode(false);
                }}
                className="w-full"
              >
                <UserPlus className="h-5 w-5 mr-2" />
                Voeg deelnemer toe
              </Button>

              <Button
                variant="outline"
                onClick={() => {
                  if (
                    ((isDrawNames && eventParticipants.length <= 3) ||
                      (!isDrawNames && eventParticipants.length <= 2)) &&
                    !isRemoveMode
                  ) {
                    toast.error('De groep is te klein om deelnemers te verwijderen');
                    return;
                  }
                  setIsRemoveMode(!isRemoveMode);
                  if (showAddMemberModal) setShowAddMemberModal(false);
                }}
                className="w-full"
              >
                <UserMinus className="h-5 w-5 mr-2" />
                {isRemoveMode ? 'Annuleer verwijderen' : 'Verwijder deelnemer'}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </>
  );
}
