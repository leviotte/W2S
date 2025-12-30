// src/app/wishlist/_components/WishlistsSection.tsx
'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Eye, Plus } from 'lucide-react';
import { toast } from 'sonner';
import type { Wishlist } from '@/types/wishlist';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

interface Props {
  wishlists: Record<string, Wishlist>;
  isOwnProfile?: boolean;
}

export default function WishlistsSection({ wishlists, isOwnProfile = false }: Props) {
  const router = useRouter();

  const wishlistArray = useMemo(() => Object.values(wishlists), [wishlists]);
  const publicWishlists = useMemo(() => wishlistArray.filter(w => w.isPublic), [wishlistArray]);
  const displayWishlists = isOwnProfile ? wishlistArray : publicWishlists;

  const handleViewWishlist = (wishlistSlug: string) => router.push(`/wishlist/${wishlistSlug}`);
  const handleCreateWishlist = () => router.push('/dashboard/wishlists/create');

  if (!displayWishlists.length && !isOwnProfile) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Gift className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Deze gebruiker heeft nog geen publieke wishlists.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex items-center justify-between">
        <CardTitle className="flex items-center gap-2">
          <Gift className="h-5 w-5" />
          Wishlists {!isOwnProfile && '(Publiek)'}
        </CardTitle>
        {isOwnProfile && (
          <Button onClick={handleCreateWishlist} size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Nieuwe Wishlist
          </Button>
        )}
      </CardHeader>
      <CardContent>
        {displayWishlists.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-muted-foreground mb-4">Je hebt nog geen wishlists.</p>
            <Button onClick={handleCreateWishlist}>
              <Plus className="h-4 w-4 mr-2" />
              Maak je eerste wishlist
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {displayWishlists.map((wishlist) => (
              <div
                key={wishlist.id}
                className="border rounded-lg p-4 hover:bg-accent/5 transition-colors cursor-pointer"
                onClick={() => handleViewWishlist(wishlist.slug || wishlist.id)}
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold mb-1">{wishlist.name}</h3>
                    {wishlist.description && <p className="text-sm text-muted-foreground line-clamp-2 mb-2">{wishlist.description}</p>}
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>{wishlist.items.length} items</span>
                      {wishlist.isPublic && (
                        <span className="flex items-center gap-1 text-green-600">
                          <Eye className="h-3 w-3" />
                          Publiek
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
