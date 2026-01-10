// src/app/admin/backgrounds/_components/backgrounds-tab.tsx
'use client';

import { useState, useEffect, useTransition } from 'react';
import { Trash, Upload, ImageOff, Loader2 } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
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
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import type { BackgroundImage, BackgroundCategory, BackgroundType } from "@/modules/dashboard/backgrounds.types";
import {
  uploadBackgroundImage,
  deleteBackgroundImage,
  toggleBackgroundLive,
  addBackgroundCategory,
} from '@/lib/server/actions/backgrounds';

type Props = {
  subTab: string;
  initialImages: BackgroundImage[];
  initialCategories: BackgroundCategory[];
};

export function BackgroundsTab({ subTab, initialImages, initialCategories }: Props) {
  const backgroundType: BackgroundType = 
    subTab === 'event' ? 'event' 
    : subTab === 'wishlist' ? 'wishlist' 
    : 'web';

  const [images, setImages] = useState<BackgroundImage[]>(initialImages);
  const [categories, setCategories] = useState<BackgroundCategory[]>(initialCategories);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imageTitle, setImageTitle] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (categories.length > 0 && !selectedCategory) {
      setSelectedCategory(categories[0].id);
    }
  }, [categories, selectedCategory]);

  useEffect(() => {
    if (imageFile) {
      const reader = new FileReader();
      reader.onload = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(imageFile);
    } else {
      setImagePreview(null);
    }
  }, [imageFile]);

  const handleClearImage = () => {
    setImageFile(null);
    setImagePreview(null);
  };

  const handleAddCategory = async () => {
    if (!newCategoryName.trim()) {
      toast.error('Voer een categorie naam in');
      return;
    }

    startTransition(async () => {
      const result = await addBackgroundCategory(backgroundType, newCategoryName);
      
      if (result.success) {
        setCategories([...categories, {
          id: result.data.id,
          name: result.data.name,
          type: backgroundType,
        }]);
        setSelectedCategory(result.data.id);
        setNewCategoryName('');
        setIsAddingCategory(false);
        toast.success('Categorie toegevoegd');
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleUpload = async () => {
    if (!imageFile || !imageTitle.trim()) {
      toast.error('Selecteer een afbeelding en voer een titel in');
      return;
    }

    const formData = new FormData();
    formData.append('file', imageFile);
    formData.append('title', imageTitle);
    formData.append('type', backgroundType);
    if (selectedCategory) {
      formData.append('category', selectedCategory);
    }

    startTransition(async () => {
      setUploadProgress(0);
      
      const result = await uploadBackgroundImage(formData);
      
      if (result.success) {
        setImages([...images, {
          id: result.data.id,
          imageLink: result.data.url,
          title: imageTitle,
          isLive: false,
          category: selectedCategory,
        }]);
        
        setImageFile(null);
        setImageTitle('');
        setImagePreview(null);
        setUploadProgress(null);
        
        toast.success('Achtergrond geüpload');
      } else {
        toast.error(result.error);
        setUploadProgress(null);
      }
    });
  };

  const handleDelete = async (id: string, imageLink: string) => {
    if (!confirm('Weet je zeker dat je deze achtergrond wilt verwijderen?')) {
      return;
    }

    startTransition(async () => {
      const result = await deleteBackgroundImage(backgroundType, id, imageLink);
      
      if (result.success) {
        setImages(images.filter((img) => img.id !== id));
        toast.success('Achtergrond verwijderd');
      } else {
        toast.error(result.error);
      }
    });
  };

  const handleToggleLive = async (id: string) => {
    startTransition(async () => {
      const result = await toggleBackgroundLive(backgroundType, id);
      
      if (result.success) {
        setImages(images.map((img) =>
          img.id === id 
            ? { ...img, isLive: true }
            : { ...img, isLive: false }
        ));
        toast.success('Status bijgewerkt');
      } else {
        toast.error(result.error);
      }
    });
  };

  const filteredImages = selectedCategory
    ? images.filter((img) => img.category === selectedCategory)
    : images;

  const titles = {
    web: 'Website Achtergronden',
    wishlist: 'Wishlist Achtergronden',
    event: 'Event Achtergronden',
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900">
          Beheer {titles[backgroundType]}
        </h2>
        <p className="text-gray-600 mt-1">
          Vernieuw de pagina na het instellen van een achtergrond om de wijzigingen te zien
        </p>
      </div>

      {/* Category Filter */}
      <div className="bg-white p-4 rounded-lg shadow-sm">
        <Label htmlFor="category-select">Categorie</Label>
        <div className="flex gap-2 mt-2">
          <Select value={selectedCategory} onValueChange={setSelectedCategory}>
            <SelectTrigger id="category-select" className="flex-1">
              <SelectValue placeholder="Selecteer categorie" />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.id} value={cat.id}>
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          <Button
            variant="outline"
            onClick={() => setIsAddingCategory(!isAddingCategory)}
          >
            + Nieuwe
          </Button>
        </div>

        {isAddingCategory && (
          <div className="mt-4 flex gap-2">
            <Input
              value={newCategoryName}
              onChange={(e) => setNewCategoryName(e.target.value)}
              placeholder="Categorie naam"
              onKeyDown={(e) => e.key === 'Enter' && handleAddCategory()}
            />
            <Button onClick={handleAddCategory} disabled={isPending}>
              Toevoegen
            </Button>
            <Button
              variant="ghost"
              onClick={() => {
                setIsAddingCategory(false);
                setNewCategoryName('');
              }}
            >
              Annuleren
            </Button>
          </div>
        )}
      </div>

      {/* Images Grid */}
      <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 gap-4">
        {filteredImages.map((image) => (
          <div
            key={image.id}
            className={cn(
              'relative group border rounded-lg overflow-hidden shadow-md',
              'transition-all duration-200',
              image.isLive && 'ring-2 ring-green-500'
            )}
          >
            <img
              src={image.imageLink}
              alt={image.title}
              className="w-full h-40 object-cover"
            />
            
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="icon"
                variant="destructive"
                onClick={() => handleDelete(image.id, image.imageLink)}
                disabled={isPending}
              >
                <Trash className="w-4 h-4" />
              </Button>
            </div>

            <div className="flex flex-col xs:flex-row gap-3 items-center justify-between bg-gray-800 text-white text-sm p-2">
              <div className="flex-1">
                <span className="font-medium">{image.title}</span>
                {image.category && (
                  <span className="text-xs bg-blue-600 px-2 py-1 rounded ml-2">
                    {categories.find((c) => c.id === image.category)?.name}
                  </span>
                )}
              </div>
              
              <Switch
                checked={image.isLive}
                onCheckedChange={() => handleToggleLive(image.id)}
                disabled={isPending}
              />
            </div>
          </div>
        ))}
      </div>

      {/* Upload New Image */}
      <div className="bg-white p-6 shadow-md rounded-lg">
        <h3 className="text-lg font-bold text-gray-700 mb-4">
          Nieuwe Achtergrond Toevoegen
        </h3>
        
        <div className="space-y-4">
          <div>
            <Label htmlFor="image-title">Titel</Label>
            <Input
              id="image-title"
              type="text"
              value={imageTitle}
              onChange={(e) => setImageTitle(e.target.value)}
              placeholder="Voer afbeelding titel in"
            />
          </div>

          <div>
            <Label>Voorbeeld</Label>
            <div className="border rounded-md p-3 bg-gray-50 mt-2">
              {imagePreview ? (
                <div className="relative">
                  <img
                    src={imagePreview}
                    alt="Preview"
                    className="max-h-48 rounded max-w-full mx-auto object-contain"
                  />
                  <Button
                    size="icon"
                    variant="secondary"
                    className="absolute top-2 right-2"
                    onClick={handleClearImage}
                  >
                    <Trash className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-6 text-gray-500">
                  <ImageOff className="w-12 h-12 mb-2" />
                  <p className="text-sm">Geen afbeelding geselecteerd</p>
                </div>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="image-file">Selecteer Afbeelding</Label>
            <Input
              id="image-file"
              type="file"
              accept="image/*"
              onChange={(e) => setImageFile(e.target.files?.[0] || null)}
              className="mt-1"
            />
          </div>

          <Button
            onClick={handleUpload}
            disabled={isPending || !imageFile || !imageTitle}
            className="w-full"
          >
            {isPending ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Uploaden...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                Upload Afbeelding
              </>
            )}
          </Button>

          {uploadProgress !== null && (
            <div className="mt-4">
              <div className="flex justify-between text-sm mb-1">
                <span>Uploaden...</span>
                <span>{uploadProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}