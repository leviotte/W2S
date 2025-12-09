// src/components/event/EventDetailsForm.tsx
"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/client/firebase";
import { format, parseISO } from 'date-fns';
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

interface BackImages { id: string; imageLink: string; title: string; category: string; }
interface Category { id: string; name: string; }

// GOLD STANDARD FIX: De conversiefunctie is nu robuust tegen 'null' waarden.
const toFormData = (event: Event): EventFormData => ({
    name: event.name ?? '',
    date: event.date ? format(new Date(event.date), 'yyyy-MM-dd') : '',
    time: event.time ?? undefined,
    endTime: event.endTime ?? undefined,
    location: event.location ?? undefined,
    theme: event.theme ?? undefined,
    // Hier is de cruciale fix: `null` wordt omgezet naar `undefined`.
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

  // De rest van je component...
  // (Data fetching blijft hetzelfde)
  const EventBackImageCollectionRef = collection(db, "EventBackImages");
  const CategoryCollectionRef = collection(db, "backgroundCategories");

  useEffect(() => {
    // ... je data fetching logica
  }, []);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const dataToSave: Partial<Event> = {
      ...formData,
      date: formData.date ? parseISO(formData.date) : new Date(),
    };
    onSave(dataToSave);
  };
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({...prev, [name]: value}));
  }

  // De JSX blijft identiek.
  return (
    <form onSubmit={handleSubmit} className="space-y-6">
       {/* ... al je input velden ... */}
       {/* Zorg ervoor dat alle inputs een `name` attribuut en de `onChange` handler hebben */}
       <div>
        <label htmlFor="name" className="block text-sm font-medium">Event Name</label>
        <input id="name" name="name" type="text" value={formData.name} onChange={handleChange} required className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-black focus:ring-0" />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label htmlFor="date" className="block text-sm font-medium">Datum</label>
          <input id="date" name="date" type="date" value={formData.date} onChange={handleChange} required className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive" />
        </div>
        <div>
          <label htmlFor="time" className="block text-sm font-medium">Start</label>
          <input id="time" name="time" type="time" value={formData.time || ""} onChange={handleChange} className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive" />
        </div>
      </div>
      
       {/* Buttons */}
       <div className="flex justify-end space-x-3">
        <button type="button" onClick={onCancel} className="px-4 py-2 border border-black rounded-md hover:bg-white/60 flex items-center">
          <X className="h-5 w-5 mr-2" /> Annuleer
        </button>
        <button type="submit" className="px-4 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive flex items-center">
          <Save className="h-5 w-5 mr-2" /> Opslaan
        </button>
      </div>
    </form>
  );
}