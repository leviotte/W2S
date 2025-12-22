// src/app/dashboard/event/[id]/request/[Id]/page.tsx
import { Suspense } from 'react';
import { notFound, redirect } from 'next/navigation';
import { getServerSession } from '@/lib/auth/get-server-session';
// ✅ FIX: Use correct import
import { getEventByIdAction } from '@/lib/server/actions/events';
import WishlistRequestClient from '@/app/wishlist/_components/WishlistRequestClient';
import { LoadingSpinner } from '@/components/ui/loading-spinner';

interface PageProps {
  params: Promise<{ eventId: string; participantId: string }>;
  searchParams: Promise<{ type?: string; tab?: string; subTab?: string }>;
}

export default async function WishlistRequestPage({ params, searchParams }: PageProps) {
  const session = await getServerSession();
  if (!session) {
    redirect('/auth/login');
  }

  const { eventId, participantId } = await params;
  const { type = 'wishlist' } = await searchParams;

  // ✅ FIX: Use correct action
  const result = await getEventByIdAction(eventId);
  
  // ✅ FIX: Correct property check
  if (!result.success || !result.data) {
    notFound();
  }

  // ✅ FIX: Use result.data instead of result.event
  const event = result.data;

  // ✅ Find participant
  const participant = Object.values(event.participants || {}).find(
    (p) => p.id === participantId
  );

  // ✅ FIX: Provide fallback empty participant if not found (TypeScript satisfaction)
  if (!participant) {
    notFound();
  }

  return (
    <Suspense fallback={<LoadingSpinner />}>
      <WishlistRequestClient
        event={event}
        participant={participant}
        currentUser={session.user}
        type={type as 'invitation' | 'drawn' | 'wishlist' | 'crossOff'}
      />
    </Suspense>
  );
}

export async function generateMetadata({ params }: PageProps) {
  const { eventId } = await params;
  return {
    title: 'Vraag een wishlist aan - Wish2Share',
    description: 'Nodig een deelnemer uit om een wishlist aan te maken',
  };
}