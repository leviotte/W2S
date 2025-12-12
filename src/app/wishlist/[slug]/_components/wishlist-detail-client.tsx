'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Gift, Edit2, Save, Trash2, Plus, X, Image as ImageIcon, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/shared/user-avatar';
import { AffiliateProductSearchDialog } from '@/components/products/affiliate-product-search-dialog';
import {
  updateWishlistItemAction,
  deleteWishlistItemAction,
  addWishlistItemAction,
  updateWishlistBackgroundAction,
  getBackgroundImagesAction,
  getBackgroundCategoriesAction,
} from '@/lib/server/actions/wishlist-actions';
import type { WishlistItem } from '@/types/wishlist';
import type { BackgroundImage, BackgroundCategory } from '@/types/background'
import type { UserProfile } from '@/types/user';
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
  
  // ===== STATE =====
  const [wishlist, setWishlist] = useState(initialWishlist);
  const [editingItem, setEditingItem] = useState<string | null>(null);
  const [editedItem, setEditedItem] = useState<Partial<WishlistItem>>({
    id: '',
    title: '',
    description: '',
    imageUrl: '',
    url: '',
    price: 0,
  });
  const [showAddForm, setShowAddForm] = useState(false);
  const [showProductDialog, setShowProductDialog] = useState(false); // ✅ NEW
  const [isAlertOpen, setIsAlertOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);

  // Background modal state
  const [showBackgroundModal, setShowBackgroundModal] = useState(false);
  const [backgroundImage, setBackgroundImage] = useState(wishlist?.backgroundImage || '');
  const [backgroundImages, setBackgroundImages] = useState<BackgroundImage[]>([]);
  const [categories, setCategories] = useState<BackgroundCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState('');
  const [isLoadingBackgrounds, setIsLoadingBackgrounds] = useState(false);

  // ===== BACKGROUND MODAL =====
  const openBackgroundModal = async () => {
    setShowBackgroundModal(true);
    setIsLoadingBackgrounds(true);

    const [categoriesResult, imagesResult] = await Promise.all([
      getBackgroundCategoriesAction(),
      getBackgroundImagesAction(),
    ]);

    if (categoriesResult.success && categoriesResult.data) {
      setCategories(categoriesResult.data); // ✅ Use .data instead of .categories
    }

    if (imagesResult.success && imagesResult.data) {
      setBackgroundImages(imagesResult.data); // ✅ Use .data instead of .images
    }

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

  // ===== ITEM ACTIONS =====
  const handleEditItem = (item: WishlistItem) => {
    setEditingItem(String(item.id)); // ✅ Convert to string
    setEditedItem(item);
  };

  const handleSaveItem = async (itemId: string | number) => {
    const result = await updateWishlistItemAction({
      wishlistId: wishlist.id,
      itemId: String(itemId), // ✅ Convert to string
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
    setItemToDelete(String(itemId)); // ✅ Convert to string
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

  const addItemToWishlist = async (product: any) => {
    const result = await addWishlistItemAction(wishlist.id, product);

    if (result.success) {
      toast.success('Item toegevoegd');
      router.refresh();
      setShowAddForm(false);
    } else {
      toast.error(result.error || 'Toevoegen mislukt');
    }
  };

  // ===== UTILITIES =====
  const copyUrlToClipboard = () => {
    const currentUrl = window.location.href;
    navigator.clipboard.writeText(currentUrl).then(() => {
      toast.success('URL gekopieerd!');
    });
  };

  const filteredImages = getFilteredImages();

  return (
    <>
      <div>
        {/* Background Image */}
        <div
          style={{
            backgroundImage: `url(${wishlist?.backgroundImage})`,
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            backgroundRepeat: 'no-repeat',
          }}
          className="w-full fixed min-h-screen top-0 z-[-1]"
        />

        {/* Wishlist Content */}
        <div className="max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-8">
          <div className="rounded-lg shadow-sm bg-white/40 backdrop-blur-sm">
            {/* Header */}
            <div className="p-4 sm:p-6 shadow-md">
              <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                {owner && (
                  <UserAvatar
                    profile={{
                      firstName: owner.firstName,
                      lastName: owner.lastName,
                      photoURL: owner.photoURL || owner.avatarURL,
                      displayName: owner.name || `${owner.firstName} ${owner.lastName}`,
                    }}
                    size="h-16 w-16"
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
                  {wishlist.items?.length === 0 && (
                    <p className="text-center text-gray-500">
                      Deze wishlist is nog leeg.
                    </p>
                  )}

                  {wishlist.items?.map((item: WishlistItem) => (
                    <div key={item.id} className="p-3 sm:p-4 bg-white/60 rounded-md">
                      {editingItem === item.id ? (
                        // Edit Mode
                        <div className="space-y-4">
                          <div className="flex items-center space-x-4">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-16 h-16 object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-300 flex items-center justify-center text-gray-500 rounded-md">
                                <span className="text-xs">Geen Afbeelding</span>
                              </div>
                            )}
                            <div>
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
                          <input
                            type="text"
                            value={editedItem.description || ''}
                            onChange={(e) =>
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
                        // View Mode
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                          <div className="flex flex-grow items-start sm:items-center space-x-3 sm:space-x-4">
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.title}
                                className="w-[90px] sm:w-[110px] h-[75px] sm:h-[90px] object-cover rounded-md"
                              />
                            ) : (
                              <div className="w-16 h-16 bg-gray-300 flex items-center justify-center text-gray-500 rounded-md">
                                <span className="text-xs">Geen Afbeelding</span>
                              </div>
                            )}
                            <div>
                              <h3 className="text-sm sm:text-md line-clamp-3">
                                {item.title.length > 100
                                  ? item.title.slice(0, 80) + '...'
                                  : item.title}
                              </h3>
                              {item.description && (
                                <p className="text-gray-600 mt-1 text-xs sm:text-sm">
                                  {item.description}
                                </p>
                              )}
                              {item.price && (
                                <p className="text-gray-600 text-xs sm:text-sm">
                                  €{item.price}
                                </p>
                              )}
                            </div>
                          </div>
                          <div className="flex gap-[5px] self-end sm:self-center">
                            {isOwner ? (
                              <>
                                <button
                                  onClick={() => handleEditItem(item)}
                                  className="p-2 hover:text-gray-600"
                                >
                                  <Edit2 className="h-5 w-5" />
                                </button>
                                <button
                                  onClick={() => confirmDeleteItem(item.id)}
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

        {/* Add Items Dialog */}
        {isOwner && (
          <AffiliateProductSearchDialog
            open={showProductDialog}
            onOpenChange={setShowProductDialog}
            onProductSelect={async (product) => {
              await addItemToWishlist(product);
              setShowProductDialog(false);
            }}
          />
        )}

        {/* Background Modal */}
        {showBackgroundModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-4 sm:p-6">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-900">
                    Bewerk Achtergrond
                  </h2>
                  <button
                    onClick={() => setShowBackgroundModal(false)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                {isLoadingBackgrounds ? (
                  <div className="py-12 text-center">
                    <p className="text-gray-600">Loading...</p>
                  </div>
                ) : (
                  <div className="space-y-4 sm:space-y-6">
                    {/* Category Filter */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Filter op Categorie
                      </label>
                      <select
                        value={selectedCategory}
                        onChange={(e) => setSelectedCategory(e.target.value)}
                        className="block w-full px-3 py-2 border border-gray-300 rounded-md"
                      >
                        <option value="">Alle categorieën</option>
                        {categories.map((category) => (
                          <option key={category.id} value={category.id}>
                            {category.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Current Selection Preview */}
                    {backgroundImage && (
                      <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Huidige Selectie
                        </label>
                        <div className="w-full h-32 sm:h-40 shadow-md rounded-lg overflow-hidden">
                          <img
                            src={backgroundImage}
                            alt="Selected background"
                            className="w-full h-full object-cover"
                          />
                        </div>
                      </div>
                    )}

                    {/* Image Grid */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Kies een Achtergrond
                      </label>
                      {filteredImages.length === 0 ? (
                        <p className="text-center py-8 text-gray-500">
                          Geen achtergronden gevonden
                        </p>
                      ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 sm:gap-4">
                          {filteredImages.map((image) => (
                            <div
                              key={image.id}
                              onClick={() => setBackgroundImage(image.imageLink)}
                              className={`relative cursor-pointer rounded-lg overflow-hidden h-24 sm:h-32 transition-all ${
                                backgroundImage === image.imageLink ? 'ring-4 ring-warm-olive' : ''
                              }`}
                            >
                              <img
                                src={image.imageLink}
                                alt={image.title}
                                className="w-full h-full object-cover"
                              />
                              <div className="absolute inset-0 bg-black bg-opacity-40 flex items-end">
                                <p className="text-white text-xs p-2 w-full truncate">
                                  {image.title}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end space-x-3 pt-4 border-t">
                      <button
                        onClick={() => setShowBackgroundModal(false)}
                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                      >
                        Annuleer
                      </button>
                      <button
                        onClick={handleSaveBackground}
                        disabled={!backgroundImage}
                        className={`px-4 py-2 rounded-md ${
                          backgroundImage
                            ? 'bg-warm-olive text-white hover:bg-warm-olive/90'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        }`}
                      >
                        Opslaan
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Delete Confirmation Dialog */}
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
      </div>
    </>
  );
}