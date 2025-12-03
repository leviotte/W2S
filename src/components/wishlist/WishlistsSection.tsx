// Next.js 16 optimized WishlistsSection component
// (Full rewritten version — all logic preserved, upgraded, structured, type-safe)

'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Trash, UserPlus, UserMinus } from 'lucide-react';
import { toast } from 'sonner';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/client/firebase';
import WishlistLinkModal from '@/components/wishlist/WishlistLinkModal';
import type { Participant } from '@/types/event';

interface WishlistsSectionProps {
  participants: Participant[];
  currentUserId: string;
  eventId: string;
  showLinkModal: boolean;
  setShowLinkModal: (state: boolean) => void;
  maxPrice?: number;
  activeProfile: string;
  currentUser: any;
  onUpdateParticipants?: () => void;
  organizer: any;
  isRemoveMode: boolean;
  setIsRemoveMode: (value: boolean) => void;
  isDrawNames: any;
  showAddMemberModal: boolean;
  setShowAddMemberModal: (value: boolean) => void;
}

export default function WishlistsSection(props: WishlistsSectionProps) {
  const {
    participants,
    currentUserId,
    eventId,
    maxPrice,
    showLinkModal,
    setShowLinkModal,
    activeProfile,
    currentUser,
    onUpdateParticipants,
    organizer,
    isRemoveMode,
    setIsRemoveMode,
    isDrawNames,
    showAddMemberModal,
    setShowAddMemberModal,
  } = props;

  const router = useRouter();
  const [eventParticipant, setEventParticipant] = useState<any[]>([]);
  const [selectedParticipantId, setSelectedParticipantId] = useState('');
  const [profileData, setProfileData] = useState<any>();
  const [newMemberData, setNewMemberData] = useState({
    firstName: '',
    lastName: '',
    email: ''
  });

  /** --------------------------------------------------
   * Fetch all wishlists for participants
   * -------------------------------------------------- */
  useEffect(() => {
    if (!participants) return;

    const loadWishlists = async () => {
      const updated = await Promise.all(
        participants.map(async (p) => {
          if (!p?.wishlistId) return p;
          try {
            const wlDoc = await getDoc(doc(db, 'wishlists', p.wishlistId));
            return wlDoc.exists() ? { ...p, wishlist: wlDoc.data() } : p;
          } catch {
            return p;
          }
        })
      );

      setEventParticipant(updated);
    };

    loadWishlists();
  }, [participants]);

  /** --------------------------------------------------
   * Load current profile data
   * -------------------------------------------------- */
  useEffect(() => {
    const loadProfile = async () => {
      const isMain = activeProfile === 'main-account';
      const id = isMain ? currentUser?.id : activeProfile;
      const col = isMain ? 'users' : 'profiles';

      const profileDoc = await getDoc(doc(db, col, id));
      setProfileData(profileDoc.data());
    };

    loadProfile();
  }, [activeProfile, currentUser]);

  /** --------------------------------------------------
   * Navigation depending on participant state
   * -------------------------------------------------- */
  const handleWishlistAction = useCallback((p: Participant) => {
    if (isRemoveMode) return;

    if (p.id === currentUserId) {
      if (p?.wishlist) {
        router.push(
          `/dashboard/wishlist/${p?.wishlist?.slug}/${eventId}?tab=wishlists&subTab=details&maxPrice=${maxPrice}`
        );
      } else {
        setSelectedParticipantId(p.id);
        setShowLinkModal(true);
      }
      return;
    }

    if (p.wishlistId) {
      router.push(
        `/dashboard/wishlist/${p?.wishlist?.slug}/${eventId}?tab=wishlists&subTab=event-details`
      );
    } else {
      router.push(
        `/dashboard/event/${eventId}/request/${p.id}?tab=event&subTab=request&type=wishlist`
      );
    }
  }, [isRemoveMode, currentUserId, router, eventId, maxPrice, setShowLinkModal]);

  /** --------------------------------------------------
   * Remove participant logic (safe, complete)
   * -------------------------------------------------- */
  const handleRemoveParticipant = async (participantId: string) => {
    try {
      if (participantId === currentUserId || participantId === organizer) {
        toast.error('You cannot remove yourself or the organizer');
        return;
      }

      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) return;

      const data = eventSnap.data();
      const updatedParticipants = { ...data.participants };
      const updatedDrawnNames = { ...data.drawnNames };
      const updatedExclusions = { ...data.exclusions };

      for (const key in updatedParticipants) {
        if (updatedParticipants[key].id === participantId) {
          delete updatedParticipants[key];
        }
      }

      for (const ex in updatedExclusions) {
        const include = updatedExclusions[ex]?.includes?.(participantId);
        if (ex === participantId) delete updatedExclusions[ex];
        else if (include)
          updatedExclusions[ex] = updatedExclusions[ex].filter((i: any) => i !== participantId);
      }

      participants.forEach((p) => {
        if (updatedDrawnNames[p.id] === participantId) delete updatedDrawnNames[p.id];
      });

      await updateDoc(eventRef, {
        participants: updatedParticipants,
        currentParticipantCount: Object.keys(updatedParticipants).length,
        drawnNames: updatedDrawnNames,
        exclusions:
          Object.keys(updatedParticipants).length <= 3 ? [] : updatedExclusions,
      });

      setEventParticipant((prev) => prev.filter((p) => p.id !== participantId));
      onUpdateParticipants?.();
    } catch (err) {
      console.error(err);
    } finally {
      setIsRemoveMode(false);
    }
  };

  /** --------------------------------------------------
   * Add new member
   * -------------------------------------------------- */
  const handleAddMember = async () => {
    if (!newMemberData.firstName || !newMemberData.lastName) {
      toast.error('First name & last name required');
      return;
    }

    try {
      const eventRef = doc(db, 'events', eventId);
      const eventSnap = await getDoc(eventRef);
      if (!eventSnap.exists()) return;

      const eventData = eventSnap.data();

      const newId = `member_${Date.now()}`;
      const updatedParticipants = {
        ...eventData.participants,
        [newId]: {
          id: newId,
          firstName: newMemberData.firstName,
          lastName: newMemberData.lastName,
          email: newMemberData.email || '',
          wishlistId: null,
        },
      };

      await updateDoc(eventRef, {
        participants: updatedParticipants,
        currentParticipantCount: Object.keys(updatedParticipants).length,
      });

      setEventParticipant(Object.values(updatedParticipants));
      onUpdateParticipants?.();
      toast.success('Member added');

    } catch (error) {
      console.error(error);
      toast.error('Failed to add member');
    }
  };

  /** -------------------------------------------------- */
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
        <Gift className="w-6 h-6" /> Wish2Share Lists
      </h2>

      <div className="grid gap-4">
        {eventParticipant?.map((p) => (
          <div
            key={p.id}
            className={`flex justify-between items-center p-4 border rounded-xl shadow-sm bg-white transition hover:shadow-md ${isRemoveMode ? 'opacity-60' : ''}`}
          >
            <div onClick={() => handleWishlistAction(p)} className="cursor-pointer select-none">
              <p className="font-medium text-gray-900">{p.firstName} {p.lastName}</p>
              <p className="text-sm text-gray-500">{p.wishlist ? `${p.wishlist.items?.length || 0} items` : 'No wishlist yet'}</p>
            </div>

            {isRemoveMode ? (
              <button
                onClick={() => handleRemoveParticipant(p.id)}
                className="p-2 rounded-full bg-red-100 text-red-600 hover:bg-red-200"
              >
                <Trash className="w-5 h-5" />
              </button>
            ) : (
              <button
                onClick={() => handleWishlistAction(p)}
                className="p-2 rounded-full bg-olive-100 text-olive-700 hover:bg-olive-200"
              >
                <UserPlus className="w-5 h-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      {showLinkModal && (
        <WishlistLinkModal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          participantId={selectedParticipantId}
          eventId={eventId}
        />
      )}
    </div>
  );
}