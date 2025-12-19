// src/components/event/EventDetailsForm.tsx
"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { format } from 'date-fns';
import type { Event } from "@/types/event";

export interface EventFormData {
  name: string;
  date: string;
  time?: string;
  endTime?: string;
  location?: string;
  theme?: string;
  backgroundImage?: string;
  additionalInfo?: string;
  organizerPhone?: string;
  organizerEmail?: string;
}

interface EventDetailsFormProps {
  initialData: Event; 
  onSave: (data: Partial<Event>) => void; 
  onCancel: () => void;
}

interface BackImages { 
  id: string; 
  imageLink: string; 
  title: string; 
  category: string; 
}

interface Category { 
  id: string; 
  name: string; 
}

// ✅ FIX: Robuuste conversie met null safety
const toFormData = (event: Event): EventFormData => ({
  name: event.name ?? '',
  date: event.date ? format(new Date(event.date), 'yyyy-MM-dd') : '',
  time: event.time ?? undefined,
  endTime: event.endTime ?? undefined,
  location: event.location ?? undefined,
  theme: event.theme ?? undefined,
  backgroundImage: event.backgroundImage ?? undefined,
  additionalInfo: event.additionalInfo ?? undefined,
  organizerPhone: event.organizerPhone ?? undefined,
  organizerEmail: event.organizerEmail ?? undefined,
});

export default function EventDetailsForm({ initialData, onSave, onCancel }: EventDetailsFormProps) {
  const [formData, setFormData] = useState<EventFormData>(toFormData(initialData));
  const [backImages, setBackImages] = useState<BackImages[]>([]);
  const [filteredImages, setFilteredImages] = useState<BackImages[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  // ✅ FIX: Correcte collection references
  const EventBackImageCollection = collection(db, "EventBackImages");
  const CategoryCollection = collection(db, "backgroundCategories");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [imagesSnap, categoriesSnap] = await Promise.all([
          getDocs(EventBackImageCollection),
          getDocs(CategoryCollection)
        ]);

        const imagesData = imagesSnap.docs.map(doc => ({ 
          id: doc.id, 
          ...doc.data() 
        } as BackImages));
        
        const categoriesData = categoriesSnap.docs.map(doc => ({ 
          id: doc.id, 
          name: doc.data().name,
          type: doc.data().type,
        }));

        setBackImages(imagesData);
        setFilteredImages(imagesData);
        setCategories(categoriesData.filter((i: any) => i.type === "event"));
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    if (selectedCategory === "") {
      setFilteredImages(backImages);
    } else {
      const filtered = backImages.filter(img => img.category === selectedCategory);
      setFilteredImages(filtered);

      // Reset selected background if not in filtered list
      if (formData.backgroundImage && !filtered.some(img => img.imageLink === formData.backgroundImage)) {
        setFormData({ ...formData, backgroundImage: "" });
      }
    }
  }, [selectedCategory, backImages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave: Partial<Event> = {
      ...formData,
      date: formData.date,
    };
    onSave(dataToSave);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
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
          <label htmlFor="date" className="block text-sm font-medium">Datum</label>
          <input 
            id="date" 
            name="date" 
            type="date" 
            value={formData.date} 
            onChange={handleChange} 
            required 
            className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive" 
          />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium">Start Tijd</label>
          <input 
            id="time" 
            name="time" 
            type="time" 
            value={formData.time || ""} 
            onChange={handleChange} 
            className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive" 
          />
        </div>
      </div>

      {/* ✅ END TIME (NIEUW!) */}
      <div>
        <label htmlFor="endTime" className="block text-sm font-medium">Einde</label>
        <input 
          id="endTime" 
          name="endTime" 
          type="time" 
          value={formData.endTime || ""} 
          onChange={handleChange} 
          className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive" 
        />
      </div>

      {/* Location */}
      <div>
        <label htmlFor="location" className="block text-sm font-medium">Locatie</label>
        <input 
          id="location" 
          name="location" 
          type="text" 
          value={formData.location || ""} 
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
          value={formData.theme || ""} 
          onChange={handleChange} 
          className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive" 
          placeholder="Bijvoorbeeld: 80s, Superhelden, etc."
        />
      </div>

      {/* ✅ CATEGORY DROPDOWN (EXACT zoals productie) */}
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

      {/* ✅ BACKGROUND DROPDOWN (NIET GRID!) */}
      <div>
        <label className="block text-sm font-medium">Event Achtergrond</label>
        <select
          name="backgroundImage"
          value={formData.backgroundImage || ""}
          onChange={handleChange}
          className="mt-1 bg-transparent block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
        >
          <option value="" disabled>Kies een achtergrond</option>
          {filteredImages.map(image => (
            <option key={image.id} value={image.imageLink}>{image.title}</option>
          ))}
        </select>
      </div>

      {/* Additional Info */}
      <div>
        <label htmlFor="additionalInfo" className="block text-sm font-medium">Extra info</label>
        <textarea 
          id="additionalInfo" 
          name="additionalInfo" 
          value={formData.additionalInfo || ""} 
          onChange={handleChange} 
          rows={3}
          className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive" 
          placeholder="Alle overige info..."
        />
      </div>

      {/* ✅ ORGANIZER CONTACT (GROUPED zoals productie) */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Toon contact info (optioneel)</h3>
        <div>
          <label htmlFor="organizerPhone" className="block text-sm font-medium">GSM-nummer</label>
          <input
            id="organizerPhone"
            name="organizerPhone"
            type="tel"
            value={formData.organizerPhone || ""}
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
            value={formData.organizerEmail || ""}
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
          onClick={onCancel} 
          className="px-4 py-2 border border-black rounded-md hover:bg-white/60 flex items-center transition-all ease-in-out duration-300"
        >
          <X className="h-5 w-5 mr-2" /> Annuleer
        </button>
        <button 
          type="submit" 
          className="px-4 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive flex items-center"
        >
          <Save className="h-5 w-5 mr-2" /> Opslaan
        </button>
      </div>
    </form>
  );
}