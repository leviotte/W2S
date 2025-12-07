// src/app/blog/create/page.tsx
"use client";

import React, { useState, useTransition, useCallback } from "react";
import dynamic from "next/dynamic";
import Image from 'next/image';
import { Plus, Trash2, UploadCloud, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/client/firebase";

// Importeer onze robuuste, centrale types
import { type Product, type WishlistItem } from "@/types/product";

// Importeer de nieuwe Server Action en de verbeterde zoekcomponent
import { createPostAction } from "@/lib/actions/blog-actions";
import { AffiliateProductSearch } from "@/components/blog/AffiliateProductSearch";

// UI componenten van Shadcn
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";

// Dynamisch importeren van de editor om server-side rendering te vermijden
const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false, 
  loading: () => <p>Loading editor...</p> 
});
import "react-quill-new/dist/quill.snow.css";

// De Section type, nu met een uniek ID voor stabiele React keys
interface Section {
  id: string;
  subTitle: string;
  content: string;
  items: WishlistItem[];
}

export default function CreatePostPage() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // State voor de hoofdvelden
  const [headTitle, setHeadTitle] = useState("");
  const [headDescription, setHeadDescriptionText] = useState("");
  const [headImageFile, setHeadImageFile] = useState<File | null>(null);
  const [headImageUrl, setHeadImageUrl] = useState<string>(""); // Kan preview of finale URL zijn
  const [subDescription, setSubDescriptionText] = useState("");
  
  // State voor de dynamische secties
  const [sections, setSections] = useState<Section[]>([
    { id: crypto.randomUUID(), subTitle: "", content: "", items: [] },
  ]);

  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  // --- AFBEELDING BEHEER ---
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeadImageFile(file);
      // Maak een lokale preview URL zodat de gebruiker de afbeelding direct ziet
      setHeadImageUrl(URL.createObjectURL(file));
    }
  };

  // --- SECTIE BEHEER ---
  const addSection = () => {
    setSections([...sections, { id: crypto.randomUUID(), subTitle: "", content: "", items: [] }]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((section) => section.id !== id));
  };

  // OPGELOST: Deze functie is nu type-veilig en update enkel de tekstvelden.
  const updateSectionField = (id: string, field: 'subTitle' | 'content', value: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  // OPGELOST: Deze functie voegt een product toe en mapt het naar het WishlistItem type.
  const addProductToSection = (sectionId: string, product: Product) => {
    const newItem: WishlistItem = { ...product }; // Jouw types zijn al perfect compatibel!
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: [...s.items, newItem] } : s));
  };

  const removeItemFromSection = (sectionId: string, itemId: string | number) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: s.items.filter(item => item.id !== itemId) } : s));
  };

  // --- FORM SUBMISSIE MET SERVER ACTION ---
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!headTitle.trim()) return toast.error("Titel is verplicht.");
    if (!headImageFile) return toast.error("Een hoofdafbeelding is verplicht.");

    startTransition(async () => {
      // Stap 1: Upload de afbeelding naar Firebase Storage
      const uploadedImageUrl = await new Promise<string | null>((resolve) => {
          if (!headImageFile) {
              resolve(null);
              return;
          }
          const storage = getStorage(app);
          const fileName = `public/posts/${Date.now()}-${headImageFile.name}`;
          const storageRef = ref(storage, fileName);
          const uploadTask = uploadBytesResumable(storageRef, headImageFile);

          uploadTask.on(
              "state_changed",
              (snapshot) => setUploadProgress((snapshot.bytesTransferred / snapshot.totalBytes) * 100),
              (error) => {
                  console.error("Upload error:", error);
                  toast.error("Afbeelding uploaden mislukt.");
                  setUploadProgress(null);
                  resolve(null);
              },
              async () => {
                  const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                  setUploadProgress(null);
                  resolve(downloadURL);
              }
          );
      });

      if (!uploadedImageUrl) {
          toast.error("De afbeelding kon niet worden geüpload. Probeer het opnieuw.");
          return;
      }
      
      // Stap 2: Roep de Server Action aan met de data
      const result = await createPostAction({
          headTitle,
          headDescription,
          headImage: uploadedImageUrl,
          subDescription,
          sections,
      });

      if (result.success) {
          toast.success("Post succesvol aangemaakt!");
          router.push("/blog");
      } else {
          toast.error(result.error || "Er is iets misgegaan.");
      }
    });
  };

  return (
    <div className="container mx-auto max-w-4xl py-12">
      <Card>
        <CardContent className="p-8">
          <h1 className="text-3xl font-bold text-center mb-8">Nieuw Blogbericht Maken</h1>
          <form onSubmit={handleSubmit} className="space-y-8">
            {/* --- HOOFD SECTIE --- */}
            <div className="space-y-4">
              <Input placeholder="Titel van je blog..." value={headTitle} onChange={(e) => setHeadTitle(e.target.value)} required className="text-lg"/>
              <Textarea placeholder="Korte inleiding..." value={headDescription} onChange={(e) => setHeadDescriptionText(e.target.value)} />
              
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">Hoofdafbeelding</label>
                <Input type="file" accept="image/*" onChange={handleImageSelect} required />
                {uploadProgress !== null && <p>Uploaden: {Math.round(uploadProgress)}%</p>}
                {headImageUrl && <div className="mt-4"><Image src={headImageUrl} alt="Preview" width={800} height={400} className="rounded-md object-cover w-full"/></div>}
              </div>

              <Textarea placeholder="Extra beschrijving onder de afbeelding..." value={subDescription} onChange={(e) => setSubDescriptionText(e.target.value)} />
            </div>

            {/* --- DYNAMISCHE SECTIES --- */}
            {sections.map((section, index) => (
              <div key={section.id} className="space-y-4 p-4 border rounded-lg relative">
                <div className="flex justify-between items-center">
                  <h2 className="text-xl font-semibold">Sectie {index + 1}</h2>
                  {sections.length > 1 && <Button variant="ghost" size="icon" onClick={() => removeSection(section.id)}><Trash2 className="h-5 w-5 text-destructive" /></Button>}
                </div>
                <Input placeholder="Subtitel..." value={section.subTitle} onChange={(e) => updateSectionField(section.id, "subTitle", e.target.value)} />
                <ReactQuill theme="snow" value={section.content} onChange={(value) => updateSectionField(section.id, "content", value)} />
                
                {/* Toegevoegde producten */}
                <div className="space-y-2">
                  {section.items.map(item => (
                    <div key={item.id} className="flex items-center gap-4 p-2 border rounded-md">
                      <Image src={item.imageUrl} alt={item.title} width={48} height={48} className="w-12 h-12 object-cover rounded-md"/>
                      <div className="flex-1"><p className="text-sm font-medium">{item.title}</p><p className="text-xs text-gray-600">€{item.price.toFixed(2)}</p></div>
                      <Button variant="ghost" size="icon" onClick={() => removeItemFromSection(section.id, item.id)}><Trash2 className="h-5 w-5 text-destructive" /></Button>
                    </div>
                  ))}
                </div>

                {/* Product zoekcomponent */}
                <AffiliateProductSearch onProductSelected={(product) => addProductToSection(section.id, product)} />
              </div>
            ))}

            <Button type="button" variant="outline" onClick={addSection} className="flex items-center gap-2">
              <Plus className="h-4 w-4" /> Sectie Toevoegen
            </Button>
            
            <Button type="submit" disabled={isPending} className="w-full">
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isPending ? 'Publiceren...' : 'Publiceer Post'}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}