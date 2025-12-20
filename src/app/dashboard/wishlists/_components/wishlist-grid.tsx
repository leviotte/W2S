// src/app/dashboard/wishlists/_components/wishlist-grid.tsx
'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Lock, Globe, MoreHorizontal } from 'lucide-react';
import { toast } from 'sonner';

import type { Wishlist } from '@/types/wishlist';
import { 
  toggleWishlistPrivacyAction, 
  deleteWishlistAction 
} from '../_actions/wishlist-actions';

import { Card, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface WishlistGridProps {
  wishlists: Wishlist[];
}

export function WishlistGrid({ wishlists }: WishlistGridProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [loadingWishlistId, setLoadingWishlistId] = useState<string | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [wishlistToDelete, setWishlistToDelete] = useState<string | null>(null);

  // ✅ PRIVACY TOGGLE HANDLER
  const handleTogglePrivacy = async (e: React.MouseEvent, wishlistId: string, isPrivate: boolean) => {
    e.stopPropagation();
    setLoadingWishlistId(wishlistId);

    startTransition(async () => {
      try {
        const result = await toggleWishlistPrivacyAction(wishlistId, !isPrivate);
        
        if (result.success) {
          toast.success(isPrivate ? 'Wishlist is nu openbaar' : 'Wishlist is nu privé');
          router.refresh();
        } else {
          toast.error(result.error || 'Kon privacy niet wijzigen');
        }
      } catch (error) {
        console.error('Toggle privacy error:', error);
        toast.error('Er ging iets mis');
      } finally {
        setLoadingWishlistId(null);
      }
    });
  };

  // ✅ DELETE HANDLERS
  const handleDeleteClick = (e: React.MouseEvent, wishlistId: string) => {
    e.stopPropagation();
    setWishlistToDelete(wishlistId);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!wishlistToDelete) return;

    startTransition(async () => {
      try {
        const result = await deleteWishlistAction(wishlistToDelete);
        
        if (result.success) {
          toast.success('Wishlist succesvol verwijderd');
          router.refresh();
        } else {
          toast.error(result.error || 'Kon wishlist niet verwijderen');
        }
      } catch (error) {
        console.error('Delete wishlist error:', error);
        toast.error('Er ging iets mis');
      } finally {
        setIsAlertOpen(false);
        setWishlistToDelete(null);
      }
    });
  };

  // ✅ CARD CLICK HANDLER
  const handleCardClick = (wishlist: Wishlist) => {
  // ✅ Gebruik slug ALS het bestaat, anders fallback naar ID
  const identifier = wishlist.slug || wishlist.id;
  router.push(`/dashboard/wishlists/${identifier}`);
};

  // ✅ EMPTY STATE
  if (wishlists.length === 0) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-100">
        <Gift size={48} className="mx-auto text-gray-300 mb-4" />
        <p className="text-gray-600 mb-4">
          Maak je allereerste Wish2Share-lijst!
        </p>
        <Button
          onClick={() => router.push('/dashboard/wishlists/create')}
          className="text-white bg-accent hover:bg-chart-5 rounded-lg px-4 py-2"
        >
          Nieuwe Wishlist
        </Button>
      </div>
    );
  }

  // ✅ GRID LAYOUT (EXACT ALS PRODUCTIE)
  return (
    <>
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
        {wishlists.map((wishlist) => {
          const isPrivate = wishlist.isPublic === false;
          
          return (
            <Card
  key={wishlist.id}
  onClick={() => handleCardClick(wishlist)} // ✅ Hele wishlist doorgeven
  className="relative border cursor-pointer border-gray-100 rounded-lg shadow-md hover:shadow-xl transition duration-300 bg-white overflow-hidden max-w-[350px]"
>
              {/* ✅ Decorative top colored bar */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-accent"></div>

              <CardHeader className="pt-6">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-lg font-bold text-accent mb-1">
                      {wishlist.name}
                    </CardTitle>
                    <CardDescription className="text-gray-500 text-sm">
                      {wishlist.description || "Geen beschrijving beschikbaar"}
                    </CardDescription>
                  </div>

                  {/* ✅ DROPDOWN MENU (3 dots) */}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 hover:bg-gray-300"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreHorizontal className="h-4 w-4 text-gray-500" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      className="w-48 !border-gray-400 !p-0"
                    >
                      <DropdownMenuItem
                        className="text-[#b34c4c] focus:text-red-600 cursor-pointer p-2 hover:!bg-warm-olive/20 !bg-transparent"
                        onClick={(e) => handleDeleteClick(e, wishlist.id)}
                      >
                        Verwijder Wishlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              {/* ✅ FOOTER met Privacy Badge + Toggle */}
              <CardFooter className="flex justify-between items-center pt-4 pb-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {isPrivate ? (
                    <Badge className="py-1 px-3 flex items-center gap-1 bg-rose-100 text-[#b34c4c] hover:bg-rose-100 transition-colors border-none">
                      <Lock size={14} />
                      Privé
                    </Badge>
                  ) : (
                    <Badge className="py-1 px-3 flex items-center gap-1 bg-blue-100 text-blue-600 hover:bg-blue-100 transition-colors border-none">
                      <Globe size={14} />
                      Openbaar
                    </Badge>
                  )}
                </div>

                {/* ✅ FIXED: Geen Button wrapper meer! */}
                <div className="flex items-center">
                  {loadingWishlistId === wishlist.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
                  ) : (
                    <Switch
                      id={`privacy-status-${wishlist.id}`}
                      checked={isPrivate}
                      onClick={(e) => handleTogglePrivacy(e, wishlist.id, isPrivate)}
                      className="data-[state=checked]:bg-warm-olive data-[state=unchecked]:bg-warm-olive/50"
                    />
                  )}
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>

      {/* ✅ DELETE CONFIRMATION DIALOG */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent onClick={(e) => e.stopPropagation()}>
          <AlertDialogHeader>
            <AlertDialogTitle>Ben je zeker?</AlertDialogTitle>
            <AlertDialogDescription>
              Deze actie kan niet ongedaan gemaakt worden. Dit zal je verlanglijst
              permanent verwijderen en uw gegevens van onze servers verwijderen.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="hover:bg-gray-100 hover:text-accent text-accent border-none"
              onClick={(e) => e.stopPropagation()}
            >
              Annuleer
            </AlertDialogCancel>
            <AlertDialogAction
              className="bg-[#b34c4c] hover:bg-red-600 text-white border-none"
              onClick={handleDeleteConfirm}
            >
              Verwijder wishlist
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}