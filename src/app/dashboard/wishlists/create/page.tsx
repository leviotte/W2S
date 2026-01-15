// app/dashboard/wishlists/create/page.tsx
import 'server-only';

import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { adminDb } from '@/lib/server/firebase-admin';
import CreateWishlistForm from './[eventId]/[participantId]/CreateWishlistForm';
import type { BackgroundCategory, BackgroundImage } from "@/modules/dashboard/backgrounds.types";

interface PageProps {
  searchParams?: {
    event?: string;
    eventId?: string;
    participant?: string;
    participantId?: string;
  };
}

export default async function Page({ searchParams }: PageProps) {
  const session = await getServerSession(authOptions);

if (!session) redirect("/login");

  const eventId = searchParams?.event ?? searchParams?.eventId;
  const participantId = searchParams?.participant ?? searchParams?.participantId;

  const [categoriesSnap, imagesSnap] = await Promise.all([
    adminDb
      .collection('backgroundCategories')
      .where('type', '==', 'wishlist')
      .get(),
    adminDb.collection('WishlistBackImages').get(),
  ]);

  const categories = categoriesSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as BackgroundCategory[];

  const images = imagesSnap.docs.map(d => ({
    id: d.id,
    ...d.data(),
  })) as BackgroundImage[];

  return (
    <CreateWishlistForm
      eventId={eventId}
      participantId={participantId}
      categories={categories}
      images={images}
    />
  );
}
