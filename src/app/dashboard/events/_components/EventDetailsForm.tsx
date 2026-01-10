// src/app/events/_components/EventDetailsForm.tsx
'use client';

import { useState, useEffect } from 'react';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';
import type { BackImages, Category } from '@/lib/server/types/event-admin';
import { createEventAction, updateEventAction, getEventOptionsAction } from '@/lib/server/actions/events';
import { LoadingSpinner } from '@/components/ui/loading-spinner';
import { EventFormData } from '@/types/event';
import type { Event } from '@/types/event';

interface EventDetailsFormProps {
  initialData: Event & { drawnNames: Record<string, string> };
  onSaved: (data: Partial<Event> & { allowDrawingNames?: boolean }) => Promise<void>;
  onClose: () => void;
}
export default function EventDetailsForm({ initialData, onClose, onSaved }: EventDetailsFormProps) {
  const [formData, setFormData] = useState<EventFormData>({
  name: initialData?.name || '',
  startDateTime: initialData?.startDateTime || new Date().toISOString(),
  endDateTime: initialData?.endDateTime || '',
  location: initialData?.location || '',
  theme: initialData?.theme || '',
  backgroundImage: initialData?.backgroundImage || '',
  additionalInfo: initialData?.additionalInfo || '',
  organizerPhone: initialData?.organizerPhone || '',
  organizerEmail: initialData?.organizerEmail || '',
  budget: initialData?.budget ?? 0,
  maxParticipants: initialData?.maxParticipants ?? 1000,
  isLootjesEvent: initialData?.isLootjesEvent ?? false,
  isPublic: initialData?.isPublic ?? false,
  allowSelfRegistration: initialData?.allowSelfRegistration ?? false,
});

  const [backImages, setBackImages] = useState<BackImages[]>([]);
  const [filteredImages, setFilteredImages] = useState<BackImages[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);

  // ✅ haal server-side opties
  useEffect(() => {
    (async () => {
      try {
        const { backImages, categories } = await getEventOptionsAction();
        setBackImages(backImages);
        setFilteredImages(backImages);
        setCategories(categories.filter(c => c.type === 'event'));
      } catch (error) {
        console.error(error);
        toast.error('Fout bij laden opties');
      }
    })();
  }, []);

  // ✅ filter images bij categorie-selectie
  useEffect(() => {
    if (!selectedCategory) {
      setFilteredImages(backImages);
    } else {
      const filtered = backImages.filter(img => img.categoryId === selectedCategory);
      setFilteredImages(filtered);
      if (formData.backgroundImage && !filtered.some(img => img.imageLink === formData.backgroundImage)) {
        setFormData(prev => ({ ...prev, backgroundImage: '' }));
      }
    }
  }, [selectedCategory, backImages]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setIsLoading(true);

  try {
    // Zet start en end tijd om naar ISO
    const startDateTime = formData.startDateTime;
    const endDateTime = formData.endDateTime || undefined;

    // ✅ Alleen de velden die user via form kan aanpassen
    const dataToSave: EventFormData = {
  name: formData.name,
  startDateTime,
  endDateTime,
  location: formData.location || undefined,
  theme: formData.theme || undefined,
  backgroundImage: formData.backgroundImage || undefined,
  additionalInfo: formData.additionalInfo || undefined,
  organizerPhone: formData.organizerPhone || undefined,
  organizerEmail: formData.organizerEmail || undefined,
  budget: formData.budget,
  maxParticipants: formData.maxParticipants,
  isLootjesEvent: formData.isLootjesEvent,
  isPublic: formData.isPublic,
  allowSelfRegistration: formData.allowSelfRegistration,
};

    let result;
    if (initialData?.id) {
      result = await updateEventAction(initialData.id, dataToSave);
    } else {
      result = await createEventAction(dataToSave);
    }

    if (result.success) {
      toast.success('Evenement opgeslagen!');
      if (!initialData?.id && (result as any).eventId && onSaved) onSaved((result as any).eventId);

      onClose();
    } else {
      toast.error(result.message || 'Fout bij opslaan');
    }
  } catch (err) {
    console.error(err);
    toast.error('Onverwachte fout');
  } finally {
    setIsLoading(false);
  }
};

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium">Event Naam</label>
        <input
          id="name"
          name="name"
          type="text"
          value={formData.name}
          onChange={handleChange}
          required
          className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-black focus:ring-0"
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="startDateTime" className="block text-sm font-medium">Datum en Tijd</label>
          <input
            id="startDateTime"
            name="startDateTime"
            type="datetime-local"
            value={formData.startDateTime.slice(0,16)}
            onChange={handleChange}
            required
            className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
          />
        </div>
        <div>
          <label htmlFor="endDateTime" className="block text-sm font-medium">Einde (optioneel)</label>
          <input
            id="endDateTime"
            name="endDateTime"
            type="datetime-local"
            value={formData.endDateTime?.slice(0,16) || ''}
            onChange={handleChange}
            className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
          />
        </div>
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium">Locatie</label>
        <input
          id="location"
          name="location"
          type="text"
          value={formData.location || ''}
          onChange={handleChange}
          className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
          placeholder="Straat en nummer, Locatie"
        />
      </div>

      {/* Theme */}
      <div>
        <label htmlFor="theme" className="block text-sm font-medium">Thema</label>
        <input
          id="theme"
          name="theme"
          type="text"
          value={formData.theme || ''}
          onChange={handleChange}
          className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
          placeholder="Bijvoorbeeld: 80s, Superhelden, etc."
        />
      </div>

      {/* Category */}
      <div>
        <label className="block text-sm font-medium">Categorie Achtergronden</label>
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="mt-1 bg-transparent block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
        >
          <option value="">Alle categorieën</option>
          {categories.map(cat => (
            <option key={cat.id} value={cat.id}>{cat.name}</option>
          ))}
        </select>
      </div>

      {/* Background */}
      <div>
        <label className="block text-sm font-medium">Event Achtergrond</label>
        <select
          name="backgroundImage"
          value={formData.backgroundImage || ''}
          onChange={handleChange}
          className="mt-1 bg-transparent block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
        >
          <option value="" disabled>Kies een achtergrond</option>
          {filteredImages.map(img => (
            <option key={img.id} value={img.imageLink}>{img.title}</option>
          ))}
        </select>
      </div>

      {/* Additional Info */}
      <div>
        <label htmlFor="additionalInfo" className="block text-sm font-medium">Extra info</label>
        <textarea
          id="additionalInfo"
          name="additionalInfo"
          value={formData.additionalInfo || ''}
          onChange={handleChange}
          rows={3}
          className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
          placeholder="Alle overige info..."
        />
      </div>

      {/* Organizer Contact */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Toon contact info (optioneel)</h3>
        <div>
          <label htmlFor="organizerPhone" className="block text-sm font-medium">GSM-nummer</label>
          <input
            id="organizerPhone"
            name="organizerPhone"
            type="tel"
            value={formData.organizerPhone || ''}
            onChange={handleChange}
            className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
            placeholder="+32 475/12.34.56"
          />
        </div>
        <div>
          <label htmlFor="organizerEmail" className="block text-sm font-medium">E-mailadres</label>
          <input
            id="organizerEmail"
            name="organizerEmail"
            type="email"
            value={formData.organizerEmail || ''}
            onChange={handleChange}
            className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
            placeholder="name@voorbeeld.com"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 border border-black rounded-md hover:bg-white/60 flex items-center transition-all ease-in-out duration-300"
        >
          <X className="h-5 w-5 mr-2" /> Annuleer
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive flex items-center"
        >
          {isLoading ? <LoadingSpinner size="sm" className="mr-2" /> : <Save className="h-5 w-5 mr-2" />}
          Opslaan
        </button>
      </div>
    </form>
  );
}
