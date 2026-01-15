// app/dashboard/wishlists/create/[eventId]/[participantId]/page.tsx
import 'server-only';

import { redirect } from 'next/navigation';
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth-options";
import { adminDb } from '@/lib/server/firebase-admin';
import CreateWishlistForm from './CreateWishlistForm';
import type { BackgroundCategory, BackgroundImage } from "@/modules/dashboard/backgrounds.types";

interface PageProps {
  params: {
    eventId: string;
    participantId: string;
  };
}

export default async function Page({ params }: PageProps) {
  const session = await getServerSession(authOptions);

if (!session) redirect("/login");

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
      eventId={params.eventId}
      participantId={params.participantId}
      categories={categories}
      images={images}
    />
  );
}
