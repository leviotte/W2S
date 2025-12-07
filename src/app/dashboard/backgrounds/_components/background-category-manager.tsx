// src/app/dashboard/backgrounds/_components/background-category-manager.tsx
'use client';

import { useState, useTransition } from 'react';
import { useFormState } from 'react-dom';
import { BackgroundCategory } from '@/types/background';
import { addCategoryAction, deleteCategoryAction } from '../_actions/category-actions';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { PlusCircle, Trash2, X } from 'lucide-react';

interface BackgroundCategoryManagerProps {
  initialCategories: BackgroundCategory[];
}

export function BackgroundCategoryManager({ initialCategories }: BackgroundCategoryManagerProps) {
  const [isAdding, setIsAdding] = useState(false);
  const categories = initialCategories;

  const [isPending, startTransition] = useTransition();

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Weet je zeker dat je de categorie '${name}' wilt verwijderen?`)) return;
    
    startTransition(async () => {
      const result = await deleteCategoryAction(id);
      if (result.success) {
        toast.success(result.message);
      } else {
        toast.error(result.message);
      }
    });
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {['wishlist', 'event', 'web'].map((type) => (
          <Card key={type}>
            <CardHeader>
              <CardTitle className="capitalize">{type} Categorieën</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {categories
                  .filter((cat) => cat.type === type)
                  .map((category) => (
                    <li key={category.id} className="flex justify-between items-center bg-muted/50 p-2 rounded">
                      <span className="font-medium">{category.name}</span>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(category.id, category.name)}
                        disabled={isPending}
                        aria-label={`Verwijder ${category.name}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </li>
                  ))}
                 {categories.filter((cat) => cat.type === type).length === 0 && (
                    <p className="text-sm text-muted-foreground">Geen categorieën.</p>
                 )}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>
      
      <div>
        {isAdding ? (
          <AddCategoryForm close={() => setIsAdding(false)} />
        ) : (
          <Button onClick={() => setIsAdding(true)}>
            <PlusCircle className="mr-2 h-4 w-4" />
            Nieuwe Categorie Toevoegen
          </Button>
        )}
      </div>
    </div>
  );
}

// Sub-component voor het toevoegen, met eigen form state management
function AddCategoryForm({ close }: { close: () => void }) {
  const [formState, action] = useFormState(addCategoryAction, { success: false, message: '' });
  
  if (formState.success) {
    toast.success(formState.message);
    close();
  } else if (formState.message) {
    toast.error(formState.message);
  }

  return (
    <Card className="max-w-md">
      <CardHeader>
        <CardTitle>Nieuwe Categorie</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={action} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium mb-1">Naam</label>
            <Input id="name" name="name" placeholder="bv. Abstract, Natuur, etc." required />
          </div>
          <div>
             <label htmlFor="type" className="block text-sm font-medium mb-1">Type</label>
             <Select name="type" defaultValue="wishlist" required>
                <SelectTrigger id="type">
                    <SelectValue placeholder="Kies een type" />
                </SelectTrigger>
                <SelectContent>
                    <SelectItem value="wishlist">Wishlist</SelectItem>
                    <SelectItem value="event">Event</SelectItem>
                    <SelectItem value="web">Web</SelectItem>
                </SelectContent>
            </Select>
          </div>
          <div className="flex justify-end space-x-2 pt-2">
            <Button type="button" variant="ghost" onClick={close}>Annuleren</Button>
            <Button type="submit">Opslaan</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}