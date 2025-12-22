// src/components/event/EventWishlistSection.tsx
'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/client/firebase';
import { toast } from 'sonner';
import { Gift, Trash, UserPlus, UserMinus } from 'lucide-react';

import type { Event } from '@/types/event'; // ✅ ADD Event import
import type { EventParticipant } from '@/types/event';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { WishlistLinkModal } from '../../app/wishlist/_components/WishlistLinkModal';

interface EventWishlistsSectionProps {
  participants: EventParticipant[];
  currentUserId: string;
  eventId: string;
  maxPrice?: number;
  organizer: string;
  isDrawNames: boolean;
  event?: Event; // ✅ ADD event prop
}

export default function EventWishlistsSection({
  participants,
  currentUserId,
  eventId,
  maxPrice,
  organizer,
  isDrawNames,
  event, // ✅ DESTRUCTURE event
}: EventWishlistsSectionProps) {
  const router = useRouter();
  
  const [eventParticipants, setEventParticipants] = useState<any[]>([]);
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [isRemoveMode, setIsRemoveMode] = useState(false);
  const [showAddMemberModal, setShowAddMemberModal] = useState(false);
  const [newMemberData, setNewMemberData] = useState({
    firstName: '',
    lastName: '',
    email: '',
  });

  // ... rest of useEffects blijft hetzelfde ...

  useEffect(() => {
    const getWishlists = async () => {
      if (!participants) return;

      const updatedParticipants = await Promise.all(
        participants.map(async (participant) => {
          if (!participant.wishlistId) return participant;

          try {
            const wishlistDoc = await getDoc(
              doc(db, 'wishlists', participant.wishlistId)
            );
            
            return wishlistDoc.exists()
              ? { ...participant, wishlist: wishlistDoc.data() }
              : participant;
          } catch (error) {
            console.error('Error fetching wishlist:', error);
            return participant;
          }
        })
      );

      setEventParticipants(updatedParticipants);
    };

    getWishlists();
  }, [participants]);

  const handleWishlistAction = (participant: EventParticipant & { wishlist?: any }) => {
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
      router.push(
        `/dashboard/wishlist/${participant.wishlist.slug}/${eventId}?tab=wishlists&subTab=event-details`
      );
    } else {
      router.push(
        `/dashboard/event/${eventId}/request/${participant.id}?tab=event&subTab=request&type=wishlist`
      );
    }
  };

  const handleRemoveParticipant = async (participantId: string) => {
    try {
      if (participantId === currentUserId || participantId === organizer) {
        toast.error('You cannot remove yourself or the organizer from the event.');
        return;
      }

      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        console.error('Event not found');
        return;
      }

      const eventData = eventDoc.data();
      const updatedParticipants = { ...eventData.participants };
      const updatedDrawnNames = { ...eventData.drawnNames };
      const updatedExclusions = { ...eventData.exclusions }; // ✅ FIX typo

      // Remove participant
      for (const key in updatedParticipants) {
        if (updatedParticipants[key].id === participantId) {
          delete updatedParticipants[key];
          break;
        }
      }

      // Clean up exclusions
      for (const exclusion in updatedExclusions) {
        const exclusionIncludesId = updatedExclusions[exclusion].some(
          (id: string) => id === participantId
        );
        
        if (exclusion === participantId) {
          delete updatedExclusions[exclusion];
        } else if (exclusionIncludesId) {
          updatedExclusions[exclusion] = updatedExclusions[exclusion].filter(
            (id: string) => id !== participantId
          );
        }
      }

      // Remove drawn names
      participants.forEach((p) => {
        if (updatedDrawnNames[p.id] === participantId) {
          delete updatedDrawnNames[p.id];
        }
      });

      await updateDoc(eventRef, {
        participants: updatedParticipants,
        currentParticipantCount: Object.keys(updatedParticipants).length,
        drawnNames: updatedDrawnNames,
        exclusions: Object.keys(updatedParticipants).length <= 3 ? {} : updatedExclusions,
      });

      setEventParticipants(
        eventParticipants.filter((p) => p.id !== participantId)
      );
      
      toast.success('Deelnemer verwijderd');
    } catch (error) {
      console.error('Error removing participant:', error);
      toast.error('Kon deelnemer niet verwijderen');
    } finally {
      setIsRemoveMode(false);
    }
  };

  const handleAddMember = async () => {
    try {
      if (!newMemberData.firstName || !newMemberData.lastName) {
        toast.error('Voornaam en achternaam zijn verplicht');
        return;
      }

      const eventRef = doc(db, 'events', eventId);
      const eventDoc = await getDoc(eventRef);

      if (!eventDoc.exists()) {
        console.error('Event not found');
        return;
      }

      const eventData = eventDoc.data();
      const participantId = crypto.randomUUID();

      const newParticipant = {
        firstName: newMemberData.firstName,
        lastName: newMemberData.lastName,
        email: null,
        id: participantId,
        confirmed: false,
        wishlistId: null,
      };

      const updatedParticipants = {
        ...eventData.participants,
        [participantId]: newParticipant,
      };

      await updateDoc(eventRef, {
        participants: updatedParticipants,
        currentParticipantCount: Object.keys(updatedParticipants).length,
      });

      setNewMemberData({ firstName: '', lastName: '', email: '' });
      setShowAddMemberModal(false);
      toast.success('Deelnemer toegevoegd!');
    } catch (error) {
      console.error('Error adding participant:', error);
      toast.error('Kon deelnemer niet toevoegen');
    }
  };

  return (
    <>
      {/* Wishlist Link Modal */}
{showLinkModal && (
  <WishlistLinkModal
    open={showLinkModal} 
    onOpenChange={setShowLinkModal}  // ✅ FIX: Prop naam + functie
    eventId={eventId}
    eventName={event?.name || 'Event'}
    participantId={selectedParticipantId}  // ✅ BONUS: Pass participant ID
  />
)}

      {/* Add Member Modal */}
      {showAddMemberModal && (
        <div
          onClick={() => setShowAddMemberModal(false)}
          className="fixed inset-0 z-50 bg-black/50 flex justify-center items-center"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-white rounded-lg p-6 w-full max-w-md"
          >
            <h3 className="text-xl font-semibold mb-4">Voeg deelnemer toe</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Voornaam*
                </label>
                <input
                  type="text"
                  value={newMemberData.firstName}
                  onChange={(e) =>
                    setNewMemberData({ ...newMemberData, firstName: e.target.value })
                  }
                  className="w-full p-2 border focus:border-gray-300 focus:ring-0 border-gray-300 rounded-md"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Achternaam*
                </label>
                <input
                  type="text"
                  value={newMemberData.lastName}
                  onChange={(e) =>
                    setNewMemberData({ ...newMemberData, lastName: e.target.value })
                  }
                  className="w-full p-2 border focus:border-gray-300 focus:ring-0 border-gray-300 rounded-md"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 mt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowAddMemberModal(false)}
                >
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
          <CardTitle className="text-xl font-semibold">
            Wish2Share-Lijstjes
          </CardTitle>
        </CardHeader>
        
        <CardContent className="space-y-2">
          {eventParticipants.map((participant) => {
            const isCurrentUser = participant.id === currentUserId;
            
            return (
              <div
                key={participant.id}
                className={`rounded-lg border-[1.5px] border-black transition-all duration-200 ${
                  isRemoveMode && !isCurrentUser && participant.id !== organizer
                    ? 'pr-10 relative'
                    : ''
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