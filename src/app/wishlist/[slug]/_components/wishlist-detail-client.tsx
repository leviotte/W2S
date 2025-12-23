// src/app/wishlist/[slug]/_components/wishlist-detail-client.tsx
'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Gift, Edit2, Save, Trash2, Plus, Minus, X, Image as ImageIcon, Copy,
} from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/shared/user-avatar';
import AffiliateProductSearch from '@/components/products/AffiliateProductSearch';
import ProductDetails from '@/components/products/ProductDetails';
import {
  updateWishlistItemAction,
  deleteWishlistItemAction,
  addWishlistItemAction,
  updateWishlistBackgroundAction,
  getBackgroundImagesAction,
  getBackgroundCategoriesAction,
} from '@/lib/server/actions/wishlist';

import type { WishlistItem } from '@/types/wishlist';
import type { BackgroundImage, BackgroundCategory } from '@/types/background';
import type { UserProfile } from '@/types/user';
import type { ProductWithInclusion } from '@/types/product';

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

import { productToWishlistItem } from '@/lib/utils/product-helpers';

interface WishlistDetailClientProps {
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
  const [selectedProductForDetails, setSelectedProductForDetails] = useState<ProductWithInclusion | null>(null);

  // Achtergrond
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(wishlist?.backgroundImage || '');
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([]);
  const [categories, setCategories] = useState<BackgroundCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);

  // Sticky footer voor batch knoppen
  const dialogFooterRef = useRef<HTMLDivElement>(null);

  useEffect(() => setWishlist(initialWishlist), [initialWishlist]);

  // BACKGROUND MODAL FUNCTIES
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
      toast.warning('Selecteer een achtergrond');
      return;
    }
    const result = await updateWishlistBackgroundAction(wishlist.id, backgroundImage);
    if (result.success) {
      setWishlist({ ...wishlist, backgroundImage });
      setShowBackgroundModal(false);
      toast.success('Achtergrond bijgewerkt');
      router.refresh();
    } else {
      toast.error(result.error || 'Bijwerken mislukt');
    }
  };

  const getFilteredImages = () => {
    if (!selectedCategory) return backgroundImages;
    return backgroundImages.filter((img) => img.category === selectedCategory);
  };

  // ITEM ACTIES
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
      toast.success('Item bijgewerkt');
      router.refresh();
    } else {
      toast.error(result.error || 'Bijwerken mislukt');
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
      toast.success('Item verwijderd');
      router.refresh();
    } else {
      toast.error(result.error || 'Verwijderen mislukt');
    }
    setIsAlertOpen(false);
    setItemToDelete(null);
  };

  // URL COPY
  const copyUrlToClipboard = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast.success('URL gekopieerd!');
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

  // BATCHWISE TOEVOEGEN
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
        const result = await addWishlistItemAction(wishlist.id, wishlistItem);
        if (!result.success) errors++;
      })
    );
    if (errors === 0) {
      toast.success('Alle items toegevoegd');
    } else {
      toast.error(`Sommige items konden niet toegevoegd worden (${errors})`);
    }
    setPendingItems([]);
    setShowProductDialog(false);
    router.refresh();
  };

  // CLEAN HTML HELPER (verwijdert <br />)
  const cleanHtml = (input?: string) => {
    if (!input) return '';
    // Alle <br>, <br />, <br/> verwijderen én dubbele witregels opschonen
    return input.replace(/<br\s*\/?>/gi, ' ').replace(/\s{2,}/g, ' ').trim();
  };

  // Productdetails openen
  function openProductDetails(item: WishlistItem) {
    setSelectedProductForDetails({
      ...item,
      isIncluded: true,
      images: item.images ? item.images : item.imageUrl ? [item.imageUrl] : [],
      description: cleanHtml(item.description),
    });
  }

  return (
    <>
      {/* ===== Achtergrond ===== */}
      <div
        style={{
          backgroundImage: `url(${wishlist?.backgroundImage})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat',
        }}
        className="w-full fixed min-h-screen top-0 z-[-1]"
      />

      {/* ===== Wishlist Content ===== */}
      <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
        <div className="rounded-lg shadow-sm bg-white/40 backdrop-blur-sm">
          
          {/* ===== Header ===== */}
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

          {/* ===== Items List ===== */}
          {!showAddForm && (
            <div className="p-4 sm:p-6">
              <div className="space-y-4 sm:space-y-6">
                {deduplicatedItems.length === 0 && (
                  <p className="text-center text-gray-500">
                    Deze wishlist is nog leeg.
                  </p>
                )}

                {deduplicatedItems.map((item: WishlistItem) => (
                  <div
                    key={item.id}
                    className="p-3 sm:p-4 bg-white/60 rounded-md cursor-pointer hover:bg-warm-olive/10 transition"
                    onClick={() => openProductDetails(item)}
                  >
                    {editingItem === String(item.id) ? (
                      // ===== EDIT MODE =====
                      <div className="space-y-4">
                        <div className="flex items-center space-x-4">
                          {/* ==== Geen cropping: afbeeldingen volledig zichtbaar maken ==== */}
                          {item.imageUrl ? (
                            <div className="relative flex-shrink-0">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-16 h-16 bg-white object-contain rounded-md border"
                                style={{ objectFit: 'contain', background: 'white' }}
                              />
                              {(item.quantity || 1) > 1 && (
                                <span className="absolute -top-2 -right-2 bg-warm-olive text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                                  {item.quantity}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-300 flex items-center justify-center text-gray-500 rounded-md">
                              <span className="text-xs">Geen Afbeelding</span>
                            </div>
                          )}
                          <div className="flex-1">
                            <h3 className="text-sm sm:text-md line-clamp-3">
                              {item.title}
                            </h3>
                            {item.price && (
                              <p className="text-gray-600 text-xs sm:text-sm">
                                €{item.price}
                              </p>
                            )}
                          </div>
                        </div>
                        {/* Quantity controls */}
                        <div className="flex items-center space-x-3">
                          <label className="text-sm font-medium">Aantal:</label>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                const newQty = Math.max(1, (editedItem.quantity || 1) - 1);
                                setEditedItem({ ...editedItem, quantity: newQty });
                              }}
                              className="p-1 border rounded hover:bg-gray-100"
                            >
                              <Minus className="h-4 w-4" />
                            </button>
                            <span className="px-3 py-1 border rounded min-w-[40px] text-center">{editedItem.quantity || 1}</span>
                            <button
                              onClick={e => {
                                e.stopPropagation();
                                const newQty = (editedItem.quantity || 1) + 1;
                                setEditedItem({ ...editedItem, quantity: newQty });
                              }}
                              className="p-1 border rounded hover:bg-gray-100"
                            >
                              <Plus className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                        <input
                          type="text"
                          value={editedItem.description || ''}
                          onChange={e =>
                            setEditedItem({
                              ...editedItem,
                              description: e.target.value,
                            })
                          }
                          className="block w-full rounded-md border-2 border-gray-300 px-3 py-2 shadow-sm focus:border-warm-olive focus:ring-warm-olive"
                          placeholder="Notitie (bijv. kleur, maat)"
                        />
                        <div className="flex justify-end space-x-2">
                          <button
                            onClick={() => handleSaveItem(item.id)}
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
                      </div>
                    ) : (
                      // ===== VIEW MODE =====
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex flex-grow items-start sm:items-center space-x-3 sm:space-x-4">
                          {item.imageUrl ? (
                            <div className="relative flex-shrink-0">
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-[90px] sm:w-[110px] h-[75px] sm:h-[90px] object-contain rounded-md border bg-white"
                                style={{ objectFit: 'contain', background: 'white' }}
                              />
                              {(item.quantity || 1) > 1 && (
                                <span className="absolute -top-2 -right-2 bg-warm-olive text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center shadow-md">
                                  {item.quantity}
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="w-16 h-16 bg-gray-300 flex items-center justify-center text-gray-500 rounded-md">
                              <span className="text-xs">Geen Afbeelding</span>
                            </div>
                          )}
                          {/* Alleen noodzakelijke info */}
                          <div>
                            <h3 className="text-sm sm:text-md line-clamp-2">
                              {item.title.length > 100
                                ? item.title.slice(0, 80) + '...'
                                : item.title}
                            </h3>
                            {item.price && (
                              <p className="text-gray-600 text-xs sm:text-sm">
                                €{item.price}{' '}
                                {(item.quantity || 1) > 1 && `× ${item.quantity}`}
                              </p>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-[5px] self-end sm:self-center">
                          {isOwner ? (
                            <>
                              <button
                                onClick={e => { e.stopPropagation(); handleEditItem(item); }}
                                className="p-2 hover:text-gray-600"
                              >
                                <Edit2 className="h-5 w-5" />
                              </button>
                              <button
                                onClick={e => { e.stopPropagation(); confirmDeleteItem(item.id); }}
                                className="p-2 text-[#b34c4c] hover:text-red-600"
                              >
                                <Trash2 className="h-5 w-5" />
                              </button>
                            </>
                          ) : (
                            <a
                              href={item.url || '#'}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="bg-warm-olive text-white px-3 sm:px-4 py-2 rounded-md hover:bg-cool-olive transition-colors flex items-center text-xs sm:text-sm"
                              onClick={e => e.stopPropagation()}
                            >
                              <Gift className="h-4 w-4 sm:h-5 sm:w-5 mr-1 sm:mr-2" />
                              Koop dit cadeau
                            </a>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* ===== Add Item Button ===== */}
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

      {/* ===== Add Items Dialog ===== */}
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
            {/* Sticky knoppenbalk ONDERAAN, altijd zichtbaar boven de scroll! */}
<div
  className="
    fixed left-0 right-0
    bottom-0
    z-30
    bg-white
    bg-opacity-95
    border-t border-gray-200
    px-6 py-3
    flex justify-end gap-3
    max-w-6xl
    mx-auto
    shadow-[0_0_16px_0_rgba(0,0,0,0.03)]
  "
  style={{
    // Zorg dat je knoppen nooit overlapt worden buiten de dialog
    borderBottomLeftRadius: '1rem',
    borderBottomRightRadius: '1rem',
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

      {/* ===== Product Details MODAL ===== */}
      {selectedProductForDetails && (
        <ProductDetails
          product={{
            ...selectedProductForDetails,
            description: cleanHtml(selectedProductForDetails.description),
          }}
          setModal={() => setSelectedProductForDetails(null)}
        />
      )}

      {/* ===== Delete Confirmation Dialog ===== */}
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
            <AlertDialogAction onClick={handleDeleteItem}
              className="bg-red-600 hover:bg-red-700"
            >
              Verwijder
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}