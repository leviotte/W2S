'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Plus } from 'lucide-react';
import { toast } from 'sonner';

import type { WishlistItem } from '@/types/wishlist';
import type { BackgroundCategory, BackgroundImage } from "@/modules/dashboard/backgrounds.types";
import { createWishlistAction } from './actions';

import AffiliateProductSearch from '@/components/products/AffiliateProductSearch';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Props {
  eventId?: string;
  participantId?: string;
  categories: BackgroundCategory[];
  images: BackgroundImage[];
}

export default function CreateWishlistForm({
  eventId,
  participantId,
  categories,
  images,
}: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [name, setName] = useState('');
  const [items, setItems] = useState<WishlistItem[]>([]);
  const [backgroundImage, setBackgroundImage] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);

  const filteredImages = useMemo(() => {
    if (selectedCategory === 'all') return images;
    return images.filter(i => i.category === selectedCategory);
  }, [images, selectedCategory]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) return toast.error('Geef je wishlist een naam');
    if (items.length === 0) return toast.error('Voeg minstens één item toe');

    startTransition(async () => {
      try {
        await createWishlistAction({
          name: name.trim(),
          backgroundImage,
          items,
          eventId,
          participantId,
        });

        toast.success('Wishlist aangemaakt');
        router.push('/dashboard/wishlists');
      } catch {
        toast.error('Aanmaken mislukt');
      }
    });
  };

  return (
    <div className="mx-auto px-4 py-8">
      <div className="bg-white rounded-lg shadow-sm p-6">
        <h1 className="text-2xl font-bold mb-6">Nieuwe Wishlist</h1>

        <form onSubmit={onSubmit} className="space-y-6">
          <div>
            <Label>Naam Wishlist</Label>
            <Input
              value={name}
              onChange={e => setName(e.target.value)}
              required
              className="mt-1 border-2"
            />
          </div>

          <div className="flex gap-4">
            <div className="w-1/2">
              <Label>Categorie</Label>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="mt-1 border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  {categories.map(c => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="w-1/2">
              <Label>Achtergrond</Label>
              <Select value={backgroundImage} onValueChange={setBackgroundImage}>
                <SelectTrigger className="mt-1 border-2">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {filteredImages.map(img => (
                    <SelectItem key={img.id} value={img.imageLink}>
                      {img.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {!showAddForm && (
            <button
              type="button"
              onClick={() => setShowAddForm(true)}
              className="w-full flex justify-center gap-2 bg-[#606c38] text-white py-2 rounded-md"
            >
              <Plus className="h-5 w-5" /> Voeg producten toe
            </button>
          )}

          <div className="flex justify-end gap-3">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Annuleer
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Bezig…' : 'Maak Wishlist'}
            </Button>
          </div>
        </form>

        {showAddForm && (
          <div className="pt-6">
            <AffiliateProductSearch items={items} setItems={setItems} />
            <div className="flex justify-end mt-4">
              <Button variant="outline" onClick={() => setShowAddForm(false)}>
                Sluiten
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
