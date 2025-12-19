// src/components/event/EventDetailClient.tsx
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { doc, onSnapshot, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/client/firebase';
import { toast } from 'sonner';
import { MessageSquareMore } from 'lucide-react';

// Types
import type { Event } from '@/types/event';
import type { SessionUser } from '@/lib/auth/session';

// Hooks
import { useEventParticipants } from '@/hooks/useEventParticipants';
import { useEventMessages } from '@/hooks/useEventMessages';

// Components
import EventDetails from '@/components/event/EventDetails';
import DrawnNameSection from './DrawnNameSection';
import { PartyPrepsSection } from '../party-preps/PartyPrepsSection';
import AdvancedEventProgressChecklist from './AdvancedEventProgressChecklist';
import ParticipantProgress from '@/components/event/ParticipantProgress';
import EventWishlistsSection from './EventWishlistSection';
import GroupChat from './GroupChat';
import ExclusionModal from '@/components/event/ExclusionModal';
import { LoadingSpinner } from '../ui/loading-spinner';

interface EventDetailClientProps {
  eventId: string;
  initialEvent: Event;
  sessionUser: SessionUser; // ✅ Server session user
}

export default function EventDetailClient({ 
  eventId, 
  initialEvent,
  sessionUser // ✅ TRUSTED server data!
}: EventDetailClientProps) {
  const router = useRouter();
  
  // ✅ State - Start with server data!
  const [event, setEvent] = useState<Event | null>(initialEvent);
  const [wishlists, setWishlists] = useState<Record<string, any>>({});
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [showExclusionModal, setShowExclusionModal] = useState(false);
  const [exclusions, setExclusions] = useState<Record<string, string[]>>({});
  
  // ✅ Active profile - CLIENT ONLY! (uses useEffect to avoid hydration mismatch)
  const [currentUserId, setCurrentUserId] = useState<string>(sessionUser.id); // ✅ Default to main account!

  // ✅ Get active profile from localStorage (CLIENT SIDE ONLY!)
  useEffect(() => {
    const activeProfile = localStorage.getItem('activeProfile');
    
    if (!activeProfile || activeProfile === 'main-account') {
      // Main account
      setCurrentUserId(sessionUser.id);
    } else {
      // Sub-profile
      setCurrentUserId(activeProfile);
    }
  }, [sessionUser.id]);

// ============================================================================
// HELPER: Convert Firestore Timestamps (CLIENT-SIDE!)
// ============================================================================
function convertFirestoreTimestamps(obj: any): any {
  if (!obj) return obj;
  
  // Firestore Timestamp object (has toDate method)
  if (obj?.toDate && typeof obj.toDate === 'function') {
    return obj.toDate().toISOString();
  }
  
  // Firestore Timestamp plain object
  if (obj?._seconds !== undefined) {
    return new Date(obj._seconds * 1000).toISOString();
  }
  
  // Recursively process arrays
  if (Array.isArray(obj)) {
    return obj.map(item => convertFirestoreTimestamps(item));
  }
  
  // Recursively process objects
  if (typeof obj === 'object') {
    const converted: any = {};
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        converted[key] = convertFirestoreTimestamps(obj[key]);
      }
    }
    return converted;
  }
  
  return obj;
}

// ✅ Fetch event realtime (for updates) - FIXED!
useEffect(() => {
  if (!eventId) return;

  const unsubscribe = onSnapshot(
    doc(db, 'events', eventId),
    (docSnap) => {
      if (docSnap.exists()) {
        try {
          // ✅ STEP 1: Get raw data
          const rawData = { id: docSnap.id, ...docSnap.data() };
          
          // ✅ STEP 2: Convert ALL Firestore Timestamps
          const timestampConverted = convertFirestoreTimestamps(rawData);
          
          // ✅ STEP 3: Convert participants from Record to Array
          if (timestampConverted.participants && 
              typeof timestampConverted.participants === 'object' && 
              !Array.isArray(timestampConverted.participants)) {
            
            console.log('🔄 CLIENT: Converting participants from Record to Array');
            
            timestampConverted.participants = Object.entries(timestampConverted.participants).map(
              ([id, participant]: [string, any]) => ({
                id,
                firstName: participant.firstName || '',
                lastName: participant.lastName || '',
                email: participant.email || '',
                confirmed: participant.confirmed ?? false,
                role: participant.role || 'participant',
                status: participant.status || 'accepted',
                addedAt: participant.addedAt || new Date().toISOString(),
                wishlistId: participant.wishlistId || undefined,
                photoURL: participant.photoURL || undefined,
                name: participant.name || undefined,
                profileId: participant.profileId || undefined,
              })
            );
          } else if (!timestampConverted.participants) {
            timestampConverted.participants = [];
          }
          
          console.log('✅ CLIENT: Realtime event updated with array participants');
          
          // ✅ STEP 4: Set event (now with array participants!)
          setEvent(timestampConverted as Event);
          
        } catch (error) {
          console.error('❌ CLIENT: Error processing realtime event update:', error);
        }
      }
    },
    (error) => {
      console.error('Error in realtime listener:', error);
    }
  );

  return () => unsubscribe();
}, [eventId]);

  // Get participants
  const { participants } = useEventParticipants(event || undefined);

  // Fetch wishlists
  useEffect(() => {
    if (!participants || participants.length === 0) return;

    const wishlistIds = participants
      .filter((p) => p.wishlistId)
      .map((p) => p.wishlistId as string);

    if (wishlistIds.length === 0) return;

    const unsubscribers = wishlistIds.map((wishlistId) => {
      return onSnapshot(doc(db, 'wishlists', wishlistId), (docSnap) => {
        if (docSnap.exists()) {
          setWishlists((prev) => ({
            ...prev,
            [wishlistId]: docSnap.data(),
          }));
        }
      });
    });

    return () => {
      unsubscribers.forEach((unsub) => unsub());
    };
  }, [participants]);

  // Chat messages
  const { sendMessage, editMessage, deleteMessage } = useEventMessages(
    event?.messages || []
  );

  // Exclusions
  useEffect(() => {
    if (event?.exclusions) {
      setExclusions(event.exclusions);
    } else {
      setExclusions({});
    }
  }, [event?.exclusions]);

  // Check access (ONLY after currentUserId is set!)
  useEffect(() => {
    if (!event || !currentUserId) return;

    const isOrganizer = event.organizer === currentUserId;
    const isParticipant = event.participants?.some(p => p.id === currentUserId);

    if (!isOrganizer && !isParticipant) {
      router.push('/404');
    }
  }, [event, currentUserId, router]);

  // Computed values
  const isOrganizer = event?.organizer === currentUserId;
  
  const drawnParticipantId = event?.drawnNames?.[currentUserId || ''];
  
  const participantsToBeDrawn = useMemo(() => {
    if (!currentUserId || !participants) return [];
    
    const excludedIds = event?.exclusions?.[currentUserId] || [];
    
    return participants.filter(
      (p) => p.id !== currentUserId && !excludedIds.includes(p.id)
    );
  }, [participants, event?.exclusions, currentUserId]);

  const canShowExclusion = useMemo(() => {
    if (!event?.isLootjesEvent) return false;
    
    const hasDrawnNames = event?.drawnNames && Object.keys(event.drawnNames).length > 0;
    const hasEnoughParticipants = participants && participants.length > 3;
    
    return !hasDrawnNames && hasEnoughParticipants;
  }, [event, participants]);

  // Handlers
  const handleUpdateEvent = async (data: Partial<Event>) => {
    if (!event?.id) return;
    
    try {
      const eventRef = doc(db, 'events', event.id);
      await updateDoc(eventRef, data);
      toast.success('Event bijgewerkt!');
    } catch (error) {
      console.error('Error updating event:', error);
      toast.error('Kon event niet bijwerken');
    }
  };

  const handleNameDrawn = async (drawnName: string) => {
    if (!event || !currentUserId) return;
    
    try {
      const participant = participants.find(
        (p) => `${p.firstName} ${p.lastName}` === drawnName
      );

      if (!participant) {
        throw new Error('Deelnemer niet gevonden');
      }

      await handleUpdateEvent({
        drawnNames: {
          ...event.drawnNames,
          [currentUserId]: participant.id,
        },
      });

      toast.success(`Je trok ${drawnName}!`);
    } catch (error) {
      toast.error('Er is iets misgegaan bij het trekken van een naam.');
    }
  };

  const handleSaveExclusions = async (newExclusions: Record<string, string[]>) => {
    try {
      await handleUpdateEvent({ exclusions: newExclusions });
      setShowExclusionModal(false);
      toast.success('Exclusions opgeslagen!');
    } catch (error) {
      console.error('Error saving exclusions:', error);
      toast.error('Kon exclusions niet opslaan');
    }
  };

  // ✅ Wrapper for sendMessage
  const handleSendMessage = async (text: string, isAnonymous: boolean, gifUrl?: string) => {
    if (!currentUserId || !sessionUser) return;
    
    sendMessage(
      text,
      currentUserId,
      `${sessionUser.firstName} ${sessionUser.lastName}`,
      isAnonymous,
      gifUrl
    );
  };

  // ✅ Check if event exists
  if (!event) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm p-6 text-center">
          <p className="text-gray-600">Evenement niet gevonden.</p>
          <button
            onClick={() => router.push('/dashboard')}
            className="mt-4 text-warm-olive hover:text-cool-olive"
          >
            Terug naar Dashboard
          </button>
        </div>
      </div>
    );
  }

  return (
    <>
      {/* Background Image */}
      <div
        style={{
          backgroundImage: `url(${
            event.backgroundImage ||
            'https://firebasestorage.googleapis.com/v0/b/wish2share4u.firebasestorage.app/o/public%2FWebBackgrounds%2FStandaard%20achtergrond%20Event.jpg?alt=media&token=992cff28-16cd-4264-be7e-46c2bb8b8a56'
          })`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        className="w-full fixed h-screen top-0 -z-10"
      />

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            <EventDetails 
              event={event} 
              participants={participants}
              isOrganizer={isOrganizer}
              updateEvent={handleUpdateEvent}
            />

            {event.isLootjesEvent && (
              <DrawnNameSection
                event={event}
                participants={participants}
                drawnParticipantId={drawnParticipantId}
                onNameDrawn={handleNameDrawn}
                currentUserId={currentUserId}
              />
            )}

            <PartyPrepsSection
              event={event}
              isOrganizer={isOrganizer}
              participants={participants}
              currentUserId={currentUserId}
            />
          </div>

          {/* MIDDLE COLUMN */}
          <div className="lg:col-span-1">
            {isOrganizer ? (
              <AdvancedEventProgressChecklist
                event={event}
                participants={participants}
                currentUserId={currentUserId}
                isOrganizer={isOrganizer}
                wishlists={wishlists}
              />
            ) : (
              <ParticipantProgress
                event={event}
                participants={participants}
                currentUserId={currentUserId}
                wishlists={wishlists}
                drawnParticipantId={drawnParticipantId}
              />
            )}

            <EventWishlistsSection
              participants={participants}
              currentUserId={currentUserId}
              eventId={event.id}
              maxPrice={event.budget}
              organizer={event.organizer}
              isDrawNames={event.isLootjesEvent}
              event={event}
            />
          </div>

          {/* RIGHT COLUMN */}
          <div className="flex flex-col gap-5">
            {/* Exclusion Section */}
            {event.isLootjesEvent && isOrganizer && (
              <div className="backdrop-blur-sm bg-white/40 rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold mb-4">Exclusies instellen</h3>

                {canShowExclusion ? (
                  <div className="mt-4">
                    <p className="text-gray-600 mb-4">
                      Stel hier in welke deelnemers elkaars namen niet kunnen trekken.
                    </p>
                    <button
                      onClick={() => setShowExclusionModal(true)}
                      className="w-full py-2 bg-warm-olive hover:bg-cool-olive transition-colors duration-300 text-white rounded focus:outline-none"
                    >
                      Exclusies maken.
                    </button>
                  </div>
                ) : (
                  <div className="text-gray-600">
                    {event.drawnNames && Object.keys(event.drawnNames).length > 0 ? (
                      <p>De namen zijn al getrokken. Exclusies kunnen niet meer ingesteld worden.</p>
                    ) : participants && participants.length <= 3 ? (
                      <p>Er zijn minmiaal 4 deelnemers nodg om exclusies in te stellen.</p>
                    ) : (
                      <p>Er kunnen geen exclusies ingesteld worden.</p>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Group Chat - Desktop */}
            <div className="hidden xs:block">
              <GroupChat
                eventId={event.id}
                messages={event.messages || []}
                onSendMessage={handleSendMessage}
                onEditMessage={editMessage}
                onDeleteMessage={deleteMessage}
                currentUserId={currentUserId}
                currentUserName={`${sessionUser.firstName} ${sessionUser.lastName}`}
              />
            </div>

            {/* Chat Button - Mobile */}
            <div className="xs:hidden sticky bottom-4 right-4 z-50">
              <div className="w-full text-right">
                <button
                  onClick={() => setIsChatOpen(!isChatOpen)}
                  className="bg-green-900 hover:bg-green-950 text-white p-4 rounded-full shadow-lg focus:outline-none"
                  aria-label="Open Chat"
                >
                  <MessageSquareMore className="w-6 h-6" />
                </button>
              </div>
            </div>

            {/* Chat Modal - Mobile */}
            {isChatOpen && (
              <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex justify-center items-center xs:hidden">
                <div className="rounded-lg shadow-lg p-6 w-full max-w-lg animate-slideInRight">
                  <GroupChat
                    eventId={event.id}
                    messages={event.messages || []}
                    onSendMessage={handleSendMessage}
                    onEditMessage={editMessage}
                    onDeleteMessage={deleteMessage}
                    currentUserId={currentUserId}
                    currentUserName={`${sessionUser.firstName} ${sessionUser.lastName}`}
                    onClose={() => setIsChatOpen(false)}
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Exclusion Modal */}
      {showExclusionModal && (
        <ExclusionModal
          participants={participants}
          exclusions={exclusions}
          onSave={handleSaveExclusions}
          onClose={() => setShowExclusionModal(false)}
        />
      )}
    </>
  );
}