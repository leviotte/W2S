// src/app/dashboard/wishlist-backgrounds/page.tsx
import { Suspense } from "react";
import WishlistBackImagesClient from "./wishlist-backgrounds-client";
import { fetchWishlistBackImages, fetchWishlistCategories } from "./wishlist-backgrounds.server";

export const metadata = {
  title: "Wishlist Achtergronden | Wish2Share",
  description: "Beheer en upload achtergrondafbeeldingen voor wishlists",
};

export default async function WishlistBackGroundsPage() {
  const [categories, images] = await Promise.all([
    fetchWishlistCategories(),
    fetchWishlistBackImages(),
  ]);

  return (
    <Suspense fallback={<p>Loading...</p>}>
      <WishlistBackImagesClient initialCategories={categories} initialImages={images} />
    </Suspense>
  );
}
