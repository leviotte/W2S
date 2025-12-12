'use client';

import Link from 'next/link';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Package, ExternalLink, Trash2 } from 'lucide-react';
import type { Wishlist } from '@/types/wishlist';

interface WishlistGridProps {
  wishlists: Wishlist[];
  onDelete?: (wishlistId: string) => void;
}

export function WishlistGrid({ wishlists, onDelete }: WishlistGridProps) {
  if (wishlists.length === 0) {
    return (
      <div className="text-center py-12">
        <Package className="mx-auto h-12 w-12 text-muted-foreground" />
        <h3 className="mt-4 text-lg font-semibold">Geen wishlists</h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Maak je eerste wishlist aan om te beginnen!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {wishlists.map((wishlist) => (
        <Card key={wishlist.id} className="flex flex-col">
          <CardHeader>
            <h3 className="font-semibold text-lg truncate">{wishlist.name}</h3>
            {wishlist.description && (
              <p className="text-sm text-muted-foreground line-clamp-2">
                {wishlist.description}
              </p>
            )}
          </CardHeader>
          
          <CardContent className="flex-1">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Items:</span>
                <span className="font-medium">{wishlist.items.length}</span>
              </div>
              {wishlist.isPublic && (
                <div className="flex items-center gap-2 text-green-600">
                  <ExternalLink className="h-4 w-4" />
                  <span>Publiek</span>
                </div>
              )}
            </div>
          </CardContent>

          <CardFooter className="flex gap-2">
            <Button asChild className="flex-1">
              <Link href={`/dashboard/wishlists/${wishlist.id}`}>
                Bekijk
              </Link>
            </Button>
            {onDelete && (
              <Button
                variant="outline"
                size="icon"
                onClick={() => onDelete(wishlist.id)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </CardFooter>
        </Card>
      ))}
    </div>
  );
}