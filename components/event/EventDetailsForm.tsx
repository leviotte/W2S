// app/components/event/EventDetailsForm.tsx
"use client";

import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";

export interface EventDetailsData {
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
  initialData: EventDetailsData;
  onSave: (data: EventDetailsData) => void;
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

export default function EventDetailsForm({
  initialData,
  onSave,
  onCancel,
}: EventDetailsFormProps) {
  const [formData, setFormData] = useState<EventDetailsData>(initialData);
  const [backImages, setBackImages] = useState<BackImages[]>([]);
  const [filteredImages, setFilteredImages] = useState<BackImages[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("");

  const EventBackImageCollectionRef = collection(db, "EventBackImages");
  const CategoryCollectionRef = collection(db, "backgroundCategories");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const categorySnapshot = await getDocs(CategoryCollectionRef);
        const categoriesData: Category[] = categorySnapshot.docs
          .map((doc) => ({ id: doc.id, name: doc.data().name, type: doc.data().type }))
          .filter((i) => i.type === "event");
        setCategories(categoriesData);

        const imageSnapshot = await getDocs(EventBackImageCollectionRef);
        const backgroundImages: BackImages[] = imageSnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as BackImages[];
        setBackImages(backgroundImages);
        setFilteredImages(backgroundImages);
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (!selectedCategory) {
      setFilteredImages(backImages);
    } else {
      const filtered = backImages.filter((img) => img.category === selectedCategory);
      setFilteredImages(filtered);
      if (formData.backgroundImage && !filtered.some((img) => img.imageLink === formData.backgroundImage)) {
        setFormData({ ...formData, backgroundImage: "" });
      }
    }
  }, [selectedCategory, backImages]);

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => setSelectedCategory(e.target.value);
  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); onSave(formData); };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Event Name */}
      <div>
        <label className="block text-sm font-medium">Event Name</label>
        <input
          type="text"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-black focus:ring-0"
          required
        />
      </div>

      {/* Date & Time */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Datum</label>
          <input
            type="date"
            value={formData.date}
            onChange={(e) => setFormData({ ...formData, date: e.target.value })}
            className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Start</label>
          <input
            type="time"
            value={formData.time || ""}
            onChange={(e) => setFormData({ ...formData, time: e.target.value })}
            className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
          />
        </div>
      </div>

      {/* End Time */}
      <div>
        <label className="block text-sm font-medium">Einde</label>
        <input
          type="time"
          value={formData.endTime || ""}
          onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
          className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
        />
      </div>

      {/* Location & Theme */}
      <div>
        <label className="block text-sm font-medium">Locatie</label>
        <input
          type="text"
          value={formData.location || ""}
          onChange={(e) => setFormData({ ...formData, location: e.target.value })}
          className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
          placeholder="Straat en nummer, Locatie"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Thema</label>
        <input
          type="text"
          value={formData.theme || ""}
          onChange={(e) => setFormData({ ...formData, theme: e.target.value })}
          className="mt-1 bg-transparent placeholder:text-[#000] block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
          placeholder="Bijvoorbeeld: 80s, Superhelden, etc."
        />
      </div>

      {/* Category & Background */}
      <div>
        <label className="block text-sm font-medium">Categorie Achtergronden</label>
        <select
          value={selectedCategory}
          onChange={handleCategoryChange}
          className="mt-1 bg-transparent block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
        >
          <option value="">Alle categorieën</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>{category.name}</option>
          ))}
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Event Achtergrond</label>
        <select
          value={formData.backgroundImage || ""}
          onChange={(e) => setFormData({ ...formData, backgroundImage: e.target.value })}
          className="mt-1 bg-transparent block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
        >
          <option value="" disabled>Kies een achtergrond</option>
          {filteredImages.map((image) => (
            <option key={image.id} value={image.imageLink}>{image.title}</option>
          ))}
        </select>
      </div>

      {/* Additional Info */}
      <div>
        <label className="block text-sm font-medium">Extra info</label>
        <textarea
          value={formData.additionalInfo || ""}
          onChange={(e) => setFormData({ ...formData, additionalInfo: e.target.value })}
          className="mt-1 bg-transparent block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
          rows={3}
          placeholder="Alle overige info..."
        />
      </div>

      {/* Organizer Info */}
      <div className="space-y-4">
        <h3 className="text-sm font-medium">Toon contact info (optioneel)</h3>
        <div>
          <label className="block text-sm font-medium">GSM-nummer</label>
          <input
            type="tel"
            value={formData.organizerPhone || ""}
            onChange={(e) => setFormData({ ...formData, organizerPhone: e.target.value })}
            className="mt-1 bg-transparent block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
            placeholder="+32 475/12.34.56"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">E-mailadres</label>
          <input
            type="email"
            value={formData.organizerEmail || ""}
            onChange={(e) => setFormData({ ...formData, organizerEmail: e.target.value })}
            className="mt-1 bg-transparent block w-full rounded-md border-[1.5px] border-black shadow-sm focus:border-warm-olive focus:ring-warm-olive"
            placeholder="name@voorbeeld.com"
          />
        </div>
      </div>

      {/* Buttons */}
      <div className="flex justify-end space-x-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 border border-black rounded-md hover:bg-white/60 flex items-center"
        >
          <X className="h-5 w-5 mr-2" />
          Annuleer
        </button>
        <button
          type="submit"
          className="px-4 py-2 bg-warm-olive text-white rounded-md hover:bg-cool-olive flex items-center"
        >
          <Save className="h-5 w-5 mr-2" />
          Opslaan
        </button>
      </div>
    </form>
  );
}
