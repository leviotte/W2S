// src/app/dashboard/wishlists/create/CreateWishlistClient.tsx
'use client';
import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';
import { WishlistItem } from '@/types/wishlist';
import AffiliateProductSearch from '@/components/products/AffiliateProductSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Props {
  categories: { id: string; name: string; type: string }[];
  backImages: { id: string; imageLink: string; title: string; category: string }[];
  filteredImages: { id: string; imageLink: string; title: string; category: string }[];
  currentUserId: string;
  handleCreateWishlist: (data: { name: string; backgroundImage?: string; items: WishlistItem[] }) => Promise<any>;
}

export default function CreateWishlistClient({ categories, backImages, filteredImages, handleCreateWishlist }: Props) {
  const router = useRouter();
  const [wishlistName, setWishlistName] = useState('');
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [isPending, startTransition] = useTransition();

  const filteredBackImages = selectedCategory === 'all'
    ? backImages
    : backImages.filter(img => img.category === selectedCategory);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wishlistName.trim()) return toast.error('Geef je wishlist een naam');
    if (items.length === 0) return toast.error('Voeg minstens één item toe aan je wishlist');

    startTransition(async () => {
      const result = await handleCreateWishlist({ name: wishlistName, backgroundImage, items });
      if (result.success) {
        toast.success('Wishlist succesvol aangemaakt! 🎉');
        router.push('/dashboard/wishlists');
      } else {
        toast.error(result.message || 'Er ging iets mis');
      }
    });
  };

  return (
    <div className="mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-6">Nieuwe Wishlist</h1>
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <Label htmlFor="wishlistName">Naam Wishlist</Label>
            <Input id="wishlistName" type="text" value={wishlistName} onChange={(e) => setWishlistName(e.target.value)} placeholder="Bijvoorbeeld: Verjaardag 2025" className="mt-1 border-2" required />
          </div>

          <div className="flex items-center w-full justify-between gap-4">
            <div className="w-[49%]">
              <Label>Categorie Achtergronden</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1 border-2">
                  <SelectValue placeholder="Alle categorieën" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle categorieën</SelectItem>
                  {categories.map(cat => (<SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-[49%]">
              <Label>Wishlist Achtergrond</Label>
              <Select value={backgroundImage} onValueChange={setBackgroundImage}>
                <SelectTrigger className="mt-1 border-2">
                  <SelectValue placeholder="Kies een achtergrond" />
                </SelectTrigger>
                <SelectContent>
                  {filteredBackImages.filter(img => img.imageLink?.trim()).map(img => (<SelectItem key={img.id} value={img.imageLink}>{img.title}</SelectItem>))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!showAddForm && <button type="button" onClick={() => setShowAddForm(true)} className="w-full max-w-lg mx-auto flex items-center justify-center gap-2 px-4 py-2 bg-[#606c38] text-white rounded-md hover:bg-[#4a5526] transition-colors"><Plus className="h-5 w-5" />Voeg producten toe</button>}

          <div className="flex justify-end space-x-3">
            {!showAddForm && <Button type="button" variant="outline" onClick={() => router.back()}>Annuleer</Button>}
            <Button type="submit" disabled={isPending} className="bg-[#606c38] hover:bg-[#4a5526]">{isPending ? 'Bezig...' : 'Maak Wishlist'}</Button>
          </div>
        </form>

        {showAddForm && (
          <div className="mb-10 py-10 pt-2">
            <AffiliateProductSearch items={items} setItems={setItems} />
            <div className="w-full flex justify-end space-x-3 mt-6">
              <Button type="button" variant="outline" onClick={() => setShowAddForm(false)}>Sluiten</Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
