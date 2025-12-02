"use client";

import React, { useEffect, useState } from "react";
import { useStore } from "@/src/lib/store/useStore";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Card,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
  CardHeader,
} from "@/src/components/ui/card";
import { Badge } from "@/src/components/ui/badge";
import { Switch } from "@/src/components/ui/switch";
import { toast } from "sonner";
import { Button } from "@/src/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/src/components/ui/alert-dialog";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/src/lib/firebase";
import { MoreHorizontal, Gift, Lock, Globe } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/src/components/ui/dropdown-menu";

interface ProfileData {
  name?: string;
  avatar?: string;
  [key: string]: any;
}

const WishlistsPage: React.FC = () => {
  const {
    currentUser,
    wishlists,
    loadWishlists,
    updateWishlist,
    deleteWishlist,
  } = useStore();
  const [loadingWishlistId, setLoadingWishlistId] = useState<string | null>(
    null
  );
  const router = useRouter();
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [wishlistToDelete, setWishlistToDelete] = useState<string | null>(null);

  useEffect(() => {
    if (currentUser) {
      loadWishlists();
    }
  }, [currentUser, loadWishlists]);

  const handleTogglePrivacy = async (
    wishlistId: string,
    isPrivate: boolean
  ) => {
    setLoadingWishlistId(wishlistId);
    try {
      await updateWishlist(wishlistId, { isPrivate: !isPrivate });
    } catch (error) {
      console.error("Failed to toggle privacy:", error);
      toast.error("Het is niet gelukt om de privacy-instelling bij te werken.");
    } finally {
      setLoadingWishlistId(null);
    }
  };

  const handleDeleteClick = (e: React.MouseEvent, wishlistId: string) => {
    e.stopPropagation();
    setWishlistToDelete(wishlistId);
    setIsAlertOpen(true);
  };

  const handleDeleteConfirm = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (wishlistToDelete) {
      deleteWishlist(wishlistToDelete)
        .then(() => {
          toast.success("Wishlist succesvol verwijderd");
        })
        .catch((error) => {
          console.error("Failed to delete wishlist:", error);
          toast.error("Het is niet gelukt om de wishlist te verwijderen.");
        })
        .finally(() => {
          setIsAlertOpen(false);
          setWishlistToDelete(null);
        });
    }
  };

  const handleNewWishlist = () => {
    router.push("/dashboard?tab=wishlists&subTab=create");
  };

  const activeProfile = typeof window !== "undefined" ? localStorage.getItem("activeProfile") : null;
  const isMainProfile = activeProfile === "main-account";

  useEffect(() => {
    const getProfileData = async () => {
      if (!currentUser) return;
      const userId = isMainProfile ? currentUser.id : activeProfile;
      const collection = isMainProfile ? "users" : "profiles";
      const profileDoc = await getDoc(doc(db, collection, userId!));
      setProfileData(profileDoc.data() as ProfileData);
    };
    getProfileData();
  }, [currentUser, activeProfile, isMainProfile]);

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl text-accent font-bold">Mijn Wishlists</h1>
        <Button
          onClick={handleNewWishlist}
          className="text-white bg-accent hover:bg-chart-5 rounded-lg px-4 py-2 flex items-center gap-2"
        >
          <Gift size={18} />
          Nieuwe Wishlist
        </Button>
      </div>

      {wishlists?.length > 0 ? (
        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {wishlists.map((wishlist) => (
            <Card
              onClick={() => {
                router.push(
                  `/dashboard/wishlist/${wishlist?.slug}?tab=wishlists&subTab=details`
                );
              }}
              key={wishlist.id}
              className="relative border cursor-pointer border-gray-100 rounded-lg shadow-md hover:shadow-xl transition duration-300 bg-white overflow-hidden max-w-[350px]"
            >
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
                        onSelect={(e) => e.stopPropagation()}
                        onClick={(e) => handleDeleteClick(e, wishlist.id)}
                      >
                        Verwijder Wishlist
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>

              <CardFooter className="flex justify-between items-center pt-4 pb-4 border-t border-gray-100">
                <div className="flex items-center gap-2">
                  {wishlist.isPrivate ? (
                    <Badge className="py-1 px-3 flex items-center gap-1 bg-rose-100 text-[#b34c4c] hover:bg- transition-colors border-none">
                      <Lock size={14} />
                      Privé
                    </Badge>
                  ) : (
                    <Badge className="py-1 px-3 flex items-center gap-1 bg-blue-100 text-blue-600 hover:bg- transition-colors border-none">
                      <Globe size={14} />
                      Openbaar
                    </Badge>
                  )}
                </div>

                <div className="flex items-center">
                  {loadingWishlistId === wishlist.id ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-accent border-t-transparent"></div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Button className="max-w-[40px] max-h-[22px] bg-transparent hover:bg-transparent">
                        <Switch
                          id={`privacy-status-${wishlist.id}`}
                          checked={wishlist.isPrivate}
                          onClick={(e) => {
                            e.stopPropagation();
                            e.preventDefault();
                            handleTogglePrivacy(
                              wishlist.id,
                              wishlist.isPrivate
                            );
                          }}
                          className="data-[state=checked]:bg-warm-olive data-[state=unchecked]:bg-warm-olive/50"
                        />
                      </Button>
                    </div>
                  )}
                </div>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center p-8 bg-gray-50 rounded-lg border border-gray-100">
          <Gift size={48} className="mx-auto text-gray-300 mb-4" />
          <p className="text-gray-600 mb-4">
            Maak je allereerste Wish2Share-lijst!
          </p>
          <Button
            onClick={handleNewWishlist}
            className="text-white bg-accent hover:bg-chart-5 rounded-lg px-4 py-2"
          >
            Nieuwe Wishlist
          </Button>
        </div>
      )}

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
    </div>
  );
};

export default WishlistsPage;
