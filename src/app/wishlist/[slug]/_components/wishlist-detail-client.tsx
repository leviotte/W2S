// src/app/wishlist/[slug]/_components/wishlist-detail-client.tsx
'use client';

import React, { useMemo, useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Gift, Edit2, Save, Trash2, Plus, Minus, X, Image as ImageIcon, Copy
} from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import AffiliateProductSearch from "@/components/products/AffiliateProductSearch";
import ProductDetails from "@/components/products/ProductDetails";
import {
  updateWishlistItemAction,
  deleteWishlistItemAction,
  addItemToWishlistAction,
  updateWishlistBackgroundAction,
  getBackgroundImagesAction,
  getBackgroundCategoriesAction,
  markItemPurchasedAction,
  undoPurchaseWishlistItemAction,
} from "@/lib/server/actions/wishlist";
import type { WishlistItem } from "@/types/wishlist";
import type { BackgroundImage, BackgroundCategory } from "@/types/background";
import type { UserProfile } from "@/types/user";
import type { ProductWithInclusion } from "@/types/product";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { productToWishlistItem } from "@/lib/utils/product-helpers";

export interface WishlistDetailClientProps {
  wishlist: any;
  owner: any;
  currentUser: UserProfile | null;
  isOwner: boolean;
  maxPrice?: number;
}

export function WishlistDetailClient({
  wishlist: initialWishlist,
  owner,
  currentUser,
  isOwner,
  maxPrice,
}: WishlistDetailClientProps) {
  const router = useRouter();

  // STATE
  const [wishlist, setWishlist] = useState(initialWishlist);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editedItem, setEditedItem] = useState<Partial<WishlistItem>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false);
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [pendingItems, setPendingItems] = useState<any[]>([]);
  const [showBuyDialog, setShowBuyDialog] = useState(false);
  const [buyItemId, setBuyItemId] = useState<string | null>(null);
  const [showUndoDialog, setShowUndoDialog] = useState(false);
  const [undoItemId, setUndoItemId] = useState<string | null>(null);
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<ProductWithInclusion | null>(null);

  // Achtergrond
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(wishlist?.backgroundImage || "");
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([]);
  const [categories, setCategories] = useState<BackgroundCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);

  useEffect(() => setWishlist(initialWishlist), [initialWishlist]);

  // Achtergrond modal ophalen
  const openBackgroundModal = async () => {
    setShowBackgroundModal(true);
    setIsLoadingBackgrounds(true);
    const [categoriesResult, imagesResult] = await Promise.all([
      getBackgroundCategoriesAction(),
      getBackgroundImagesAction(),
    ]);
    if (categoriesResult.success && categoriesResult.data) setCategories(categoriesResult.data);
    if (imagesResult.success && imagesResult.data) setBackgroundImages(imagesResult.data);
    setIsLoadingBackgrounds(false);
  };

  const handleSaveBackground = async () => {
    if (!backgroundImage) {
      toast.warning("Selecteer een achtergrond");
      return;
    }
    const result = await updateWishlistBackgroundAction(wishlist.id, backgroundImage);
    if (result.success) {
      setWishlist({ ...wishlist, backgroundImage });
      setShowBackgroundModal(false);
      toast.success("Achtergrond bijgewerkt");
      router.refresh();
    } else {
      toast.error(result.error || "Bijwerken mislukt");
    }
  };

  const getFilteredImages = () => {
    if (!selectedCategory) return backgroundImages;
    return backgroundImages.filter((img) => img.category === selectedCategory);
  };

  // WISHLIST ITEM LOGICA
  const handleEditItem = (item: WishlistItem) => {
    setEditingItem(String(item.id));
    setEditedItem(item);
  };

  const handleSaveItem = async (itemId: string | number) => {
    const result = await updateWishlistItemAction({
      wishlistId: wishlist.id,
      itemId: String(itemId),
      updates: editedItem,
    });
    if (result.success) {
      const updatedItems = wishlist.items.map((item: WishlistItem) =>
        String(item.id) === String(itemId) ? { ...item, ...editedItem } : item
      );
      setWishlist({ ...wishlist, items: updatedItems });
      setEditingItem(null);
      toast.success("Item bijgewerkt");
      router.refresh();
    } else {
      toast.error(result.error || "Bijwerken mislukt");
    }
  };

  const confirmDeleteItem = (itemId: string | number) => {
    setItemToDelete(String(itemId));
    setIsAlertOpen(true);
  };

  const handleDeleteItem = async () => {
    if (!itemToDelete) return;
    const result = await deleteWishlistItemAction(wishlist.id, itemToDelete);
    if (result.success) {
      const updatedItems = wishlist.items.filter(
        (item: WishlistItem) => String(item.id) !== String(itemToDelete)
      );
      setWishlist({ ...wishlist, items: updatedItems });
      toast.success("Item verwijderd");
      router.refresh();
    } else {
      toast.error(result.error || "Verwijderen mislukt");
    }
    setIsAlertOpen(false);
    setItemToDelete(null);
  };

  // URL COPY
  const copyUrlToClipboard = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast.success("URL gekopieerd!");
    });
  };

  // DEDUPLICATE items
  const deduplicatedItems = useMemo(() => {
    if (!wishlist.items) return [];
    const map = new Map();
    for (const item of wishlist.items) {
      map.set(String(item.id), item);
    }
    return Array.from(map.values());
  }, [wishlist.items]);

  const filteredImages = getFilteredImages();

  // BATCH-ADD
  const handlePendingAdd = (newItems: any[]) => {
    setPendingItems((prev) => {
      const existingIds = new Set([
        ...prev.map((item) => String(item.id)),
        ...deduplicatedItems.map((item) => String(item.id)),
      ]);
      return [
        ...prev,
        ...newItems.filter((item) => !existingIds.has(String(item.id))),
      ];
    });
  };

  const handleRemovePendingItem = (id: string | number) => {
    setPendingItems((items) => items.filter((item) => String(item.id) !== String(id)));
  };

  const handleBatchSavePendingItems = async () => {
    if (pendingItems.length === 0) return;
    let errors = 0;
    await Promise.all(
      pendingItems.map(async (product) => {
        const wishlistItem = productToWishlistItem(product);
        const result = await addItemToWishlistAction(wishlist.id, wishlistItem);
        if (!result.success) errors++;
      })
    );
    if (errors === 0) {
      toast.success("Alle items toegevoegd");
    } else {
      toast.error(`Sommige items konden niet toegevoegd worden (${errors})`);
    }
    setPendingItems([]);
    setShowProductDialog(false);
    router.refresh();
  };

  // CLEAN HTML
  const cleanHtml = (input?: string) => {
    if (!input) return "";
    return input.replace(/<br\s*\/?>/gi, " ").replace(/\s{2,}/g, " ").trim();
  };

  // PRODUCT DETAILS MODAL
  function openProductDetails(item: WishlistItem) {
    setSelectedProductForDetails({
      ...item,
      isIncluded: true,
      images: item.images ? item.images : item.imageUrl ? [item.imageUrl] : [],
      description: item.description ? cleanHtml(item.description) : undefined,
    });
  }

  // BUTTON ZONE LOGICA
  function getActionButton({ item, isOwner, isPurchased, isPurchaser }: { item: WishlistItem, isOwner: boolean, isPurchased: boolean, isPurchaser: boolean }) {
    if (isOwner) {
      return (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); handleEditItem(item); }}
            className="p-2 hover:text-gray-600"
            aria-label="Bewerk item"
            tabIndex={0}
            type="button"
          >
            <Edit2 className="h-5 w-5" />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); confirmDeleteItem(String(item.id)); }}
            className="p-2 text-[#b34c4c] hover:text-red-600"
            aria-label="Verwijder item"
            tabIndex={0}
            type="button"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </>
      );
    }
    // NIET-eigenaar logica:
    if (!isPurchased) {
      return (
        <button
          onClick={e => {
            e.stopPropagation();
            setBuyItemId(String(item.id));
            setShowBuyDialog(true);
          }}
          className="bg-warm-olive text-white px-3 sm:px-4 py-2 rounded-md hover:bg-cool-olive transition-colors flex items-center text-xs sm:text-sm"
          aria-label="Koop dit cadeau"
          tabIndex={0}
          type="button"
        >
          <Gift className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
          Koop dit cadeau
        </button>
      );
    }
    if (isPurchased && isPurchaser) {
      return (
        <div className="flex flex-row gap-2 items-center">
          <span className="bg-warm-olive text-white px-2 py-1 text-xs rounded h-7 flex items-center">
            Jij kocht dit cadeau
          </span>
          <button
            onClick={e => {
              e.stopPropagation();
              setUndoItemId(String(item.id));
              setShowUndoDialog(true);
            }}
            className="px-2 py-1 border rounded text-xs bg-gray-50 border-gray-200 hover:bg-gray-200 transition h-7"
            tabIndex={0}
            type="button"
          >
            Ongedaan maken
          </button>
        </div>
      );
    }
    return null;
  }

  return (
    <>
      {/* Achtergrond */}
      <div
        style={{
          backgroundImage: `url(${wishlist?.backgroundImage})`,
          backgroundSize: "cover",
          backgroundPosition: "center",
          backgroundRepeat: "no-repeat",
        }}
        className="w-full fixed min-h-screen top-0 z-[-1]"
      />

      {/* Wishlist Card */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="rounded-lg shadow-sm bg-white/40 backdrop-blur-sm">
          {/* Header */}
          <div className="p-4 sm:p-6 shadow-md">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              {owner && (
                <UserAvatar
                  photoURL={owner.photoURL || owner.avatarURL}
                  firstName={owner.firstName}
                  lastName={owner.lastName}
                  name={owner.name}
                  size="xl"
                />
              )}
              <div className="flex-grow">
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                  {wishlist.name}
                </h1>
                {owner && (
                  <p className="text-gray-600">
                    Wishlist van {owner.name || `${owner.firstName} ${owner.lastName}`}
                  </p>
                )}
              </div>
              <div className="flex flex-col sm:flex-row gap-2 sm:space-x-3">
                {isOwner && (
                  <button
                    onClick={openBackgroundModal}
                    className="hover:bg-white/40 border border-black px-3 py-2 rounded-md flex items-center justify-center"
                  >
                    <ImageIcon className="h-5 w-5 mr-2" />
                    <span className="text-sm sm:text-base">Bewerk Achtergrond</span>
                  </button>
                )}
                <button
                  onClick={copyUrlToClipboard}
                  className="hover:bg-white/40 border border-black px-3 py-2 rounded-md flex items-center justify-center"
                >
                  <Copy className="h-5 w-5 mr-2" />
                  <span className="text-sm sm:text-base">Kopieer URL</span>
                </button>
              </div>
            </div>
          </div>

          {/* Items List */}
          {!showAddForm && (
            <div className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {deduplicatedItems.length === 0 && (
                  <p className="text-center text-gray-500">
                    Deze wishlist is nog leeg.
                  </p>
                )}

                {deduplicatedItems.map((item: WishlistItem) => {
                  const userId = currentUser?.id;
                  const isPurchased = !!item.purchasedBy;
                  const isPurchaser = item.purchasedBy === userId;
                  if (!isOwner && isPurchased && !isPurchaser) return null;

                  return (
                    <div
                      key={String(item.id)}
                      className={`p-3 sm:p-4 bg-white/60 rounded-md transition select-none group hover:shadow-md ${
                        isPurchased
                          ? "opacity-60 relative"
                          : "hover:bg-warm-olive/10 cursor-pointer"
                      }`}
                      style={{ position: "relative" }}
                      onClick={() => openProductDetails(item)}
                      tabIndex={0}
                      role="button"
                      aria-label={`Bekijk details van ${item.title}`}
                      onKeyDown={e => { if (e.key === "Enter") openProductDetails(item); }}
                    >
                      {editingItem === String(item.id) ? (
                        // EDIT MODE
                        <div className="space-y-4">
                          {/* Voeg je form fields toe */}
                          <button
                            onClick={() => handleSaveItem(String(item.id))}
                            className="p-2 text-green-600 hover:text-green-800"
                          >
                            <Save className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => setEditingItem(null)}
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      ) : (
                        // VIEW MODE
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex items-center gap-4 flex-1 min-w-0">
                            {item.imageUrl && (
                              <img
                                src={item.imageUrl}
                                alt={item.title ?? ""}
                                className="w-16 h-16 rounded-lg object-cover bg-gray-100 shadow-sm border border-gray-200"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="font-medium text-gray-900 truncate">
                                {item.title || "-"}
                              </div>
                              {item.price !== undefined && (
                                <span className="text-sm text-gray-600">
                                  &euro; {typeof item.price === "number" ? item.price.toFixed(2) : item.price}
                                </span>
                              )}
                              {item.description && (
                                <div
                                  className="text-xs text-gray-500 mt-1 line-clamp-2"
                                  dangerouslySetInnerHTML={{
                                    __html: cleanHtml(item.description),
                                  }}
                                />
                              )}
                            </div>
                          </div>
                          {/* Actieknoppen */}
                          <div className="flex gap-[5px] self-end sm:self-center items-center justify-end min-w-[160px]">
                            {getActionButton({ item, isOwner, isPurchased, isPurchaser })}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Add Item Button */}
          {isOwner && (
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 mb-8">
              <button
                onClick={() => setShowProductDialog(true)}
                className="w-full px-4 py-2 border border-black rounded-md bg-white/40 backdrop-blur-sm flex items-center justify-center hover:bg-white/60"
              >
                <Plus className="h-5 w-5 mr-2" />
                Item toevoegen
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==== Add Items Dialog ==== */}
      {isOwner && showProductDialog && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] relative flex flex-col overflow-hidden">
            <div className="flex justify-between items-center mb-4 p-6 pb-2">
              <h3 className="text-lg font-semibold">Producten toevoegen</h3>
              <button onClick={() => { setPendingItems([]); setShowProductDialog(false); }}>
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="overflow-auto flex-1 px-6">
              <AffiliateProductSearch
                items={[...wishlist.items, ...pendingItems]}
                setItems={handlePendingAdd}
                eventBudget={maxPrice}
              />
            </div>
            <div
              className={
                "fixed left-0 right-0 bottom-0 z-30 bg-white bg-opacity-95 border-t border-gray-200 px-6 py-3 flex justify-end gap-3 max-w-6xl mx-auto shadow-[0_0_16px_0_rgba(0,0,0,0.03)]"
              }
              style={{
                borderBottomLeftRadius: "1rem",
                borderBottomRightRadius: "1rem",
              }}
            >
              <button
                onClick={() => { setPendingItems([]); setShowProductDialog(false); }}
                className="rounded px-4 py-2 bg-gray-200 hover:bg-gray-300 font-medium"
              >
                Annuleer
              </button>
              <button
                onClick={handleBatchSavePendingItems}
                disabled={pendingItems.length === 0}
                className="rounded px-4 py-2 bg-warm-olive text-white hover:bg-cool-olive disabled:opacity-60 font-medium"
              >
                Sla op
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ==== Product Details Modal ==== */}
      {selectedProductForDetails && (
        <ProductDetails
          product={{
            ...selectedProductForDetails,
            description: cleanHtml(selectedProductForDetails.description),
          }}
          setModal={() => setSelectedProductForDetails(null)}
        />
      )}

      {/* ==== Delete Confirmation Modal ==== */}
      <AlertDialog open={isAlertOpen} onOpenChange={setIsAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ben je zeker?</AlertDialogTitle>
            <AlertDialogDescription>
              Dit item zal permanent verwijderd worden.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuleer</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700"
            >
              Verwijder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ==== KOOP BEVESTIGING Dialog ==== */}
      <AlertDialog open={showBuyDialog} onOpenChange={setShowBuyDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Wil je dit cadeau als gekocht markeren?</AlertDialogTitle>
      <AlertDialogDescription>
        Je kan deze aankoop altijd ongedaan maken.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuleer</AlertDialogCancel>
      <AlertDialogAction
        disabled={!buyItemId}
        onClick={async () => {
          if (!buyItemId) return;
          const item = deduplicatedItems.find(i => String(i.id) === buyItemId);
          if (!currentUser?.id || !item) return;
          const result = await markItemPurchasedAction(
            wishlist.id,
            String(item.id),
            currentUser.id
          );
          setShowBuyDialog(false);
          setBuyItemId(null);
          if (result?.success) {
            toast.success("Cadeau als gekocht gemarkeerd!");
            if (item.url) window.open(item.url, "_blank");
            router.refresh();
          } else {
            toast.error(result?.error || "Aankoop mislukt");
          }
        }}
      >
        Ja, markeer als gekocht
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>

      {/* ==== ONGEDAAN MAKEN Dialog ==== */}
      <AlertDialog open={showUndoDialog} onOpenChange={setShowUndoDialog}>
  <AlertDialogContent>
    <AlertDialogHeader>
      <AlertDialogTitle>Aankoop ongedaan maken?</AlertDialogTitle>
      <AlertDialogDescription>
        Je zal dit item opnieuw kunnen aankopen of voor iemand anders laten kopen.
      </AlertDialogDescription>
    </AlertDialogHeader>
    <AlertDialogFooter>
      <AlertDialogCancel>Annuleer</AlertDialogCancel>
      <AlertDialogAction
        disabled={!undoItemId}
        onClick={async () => {
          if (!undoItemId) return; // extra safety!
          await undoPurchaseWishlistItemAction(wishlist.id, undoItemId);
          setShowUndoDialog(false);
          setUndoItemId(null);
          toast.success("Aankoop ongedaan gemaakt!");
          router.refresh();
        }}
      >
        Maak aankoop ongedaan
      </AlertDialogAction>
    </AlertDialogFooter>
  </AlertDialogContent>
</AlertDialog>
    </>
  );
}