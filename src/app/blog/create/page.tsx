"use client";

import React, { useState, useTransition } from "react";
import dynamic from "next/dynamic";
import Image from 'next/image';
import { Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app } from "@/lib/client/firebase";

import { type Product } from "@/types/product";
import { createPostAction } from "@/lib/actions/blog-actions";
import { AffiliateProductSearchDialog } from "@/components/products/affiliate-product-search-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";

// Dynamisch importeren van ReactQuill om SSR te vermijden.
const ReactQuill = dynamic(() => import("react-quill-new"), {
  ssr: false,
  loading: () => <div className="w-full h-32 bg-gray-100 rounded-md animate-pulse" />
});
import "react-quill-new/dist/quill.snow.css";

// Type definitie voor een sectie in de blogpost.
interface Section {
  id: string;
  subTitle: string;
  content: string;
  items: Product[];
}

export default function CreatePostPage() {
  const router = useRouter();
  // useTransition voor een non-blocking UI tijdens de server action.
  const [isPending, startTransition] = useTransition();

  // State voor de hoofd-velden van de post.
  const [headTitle, setHeadTitle] = useState("");
  const [headDescription, setHeadDescription] = useState("");
  const [headImageFile, setHeadImageFile] = useState<File | null>(null);
  const [headImageUrl, setHeadImageUrl] = useState<string>("");
  const [subDescription, setSubDescription] = useState("");

  // State voor de dynamische secties.
  const [sections, setSections] = useState<Section[]>([
    { id: crypto.randomUUID(), subTitle: "", content: "", items: [] },
  ]);

  // State voor de product zoek-dialog.
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // State voor de upload progress.
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeadImageFile(file);
      setHeadImageUrl(URL.createObjectURL(file));
    }
  };

  // --- Sectie Beheer ---
  const addSection = () => {
    setSections([...sections, { id: crypto.randomUUID(), subTitle: "", content: "", items: [] }]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((section) => section.id !== id));
  };

  const updateSectionField = (id: string, field: 'subTitle' | 'content', value: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };

  const removeItemFromSection = (sectionId: string, itemId: string | number) => {
    setSections(prev => prev.map(s => s.id === sectionId ? { ...s, items: s.items.filter(item => item.id !== itemId) } : s));
  };

  // --- Product Dialog Beheer ---
  const handleOpenSearchDialog = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setIsSearchDialogOpen(true);
  };

  const handleProductSelected = (product: Product) => {
    if (!activeSectionId) return;

    setSections(prev => prev.map(s => {
      if (s.id === activeSectionId) {
        if (s.items.some(item => item.id === product.id)) {
          toast.info("Dit product is al toegevoegd aan deze sectie.");
          return s;
        }
        return { ...s, items: [...s.items, product] };
      }
      return s;
    }));
  };

  // --- Formulier Submission ---
  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault(); // Voorkom standaard form-submit.
    if (!headTitle.trim()) return toast.error("Titel is verplicht.");
    if (!headImageFile) return toast.error("Een hoofdafbeelding is verplicht.");

    startTransition(async () => {
      let uploadedImageUrl = headImageUrl;
      
      // Enkel uploaden als er een nieuw bestand is geselecteerd.
      if (headImageFile) {
        const promise = new Promise<string>((resolve, reject) => {
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
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    setUploadProgress(null);
                    resolve(downloadURL);
                }
            );
        });

        try {
            uploadedImageUrl = await promise;
        } catch {
            toast.error("De afbeelding kon niet worden geüpload. Probeer het opnieuw.");
            return; // Stop de executie.
        }
      }

      // Roep de server action aan met alle data.
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
          toast.error(result.error || "Er is iets misgegaan bij het aanmaken van de post.");
      }
    });
  };

  return (
    <>
      <div className="container mx-auto max-w-4xl py-12">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Nieuw Blogbericht Maken</h1>
            {/* CORRECTIE: Gebruik onSubmit voor client-side logica VOOR de server action */}
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="space-y-4">
                {/* CORRECTIE: Gebruik onChange voor input handling */}
                <Input placeholder="Titel van je blog..." value={headTitle} onChange={(e) => setHeadTitle(e.target.value)} required className="text-lg" />
                <Textarea placeholder="Korte inleiding..." value={headDescription} onChange={(e) => setHeadDescription(e.target.value)} />

                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Hoofdafbeelding</label>
                  <Input type="file" accept="image/*" onChange={handleImageSelect} required />
                  {uploadProgress !== null && <p className="text-sm text-gray-500 mt-2">Uploaden: {Math.round(uploadProgress)}%</p>}
                  {headImageUrl && <div className="mt-4"><Image src={headImageUrl} alt="Preview" width={800} height={400} className="rounded-md object-cover w-full" /></div>}
                </div>

                <Textarea placeholder="Extra beschrijving onder de afbeelding..." value={subDescription} onChange={(e) => setSubDescription(e.target.value)} />
              </div>

              {sections.map((section, index) => (
                <div key={section.id} className="space-y-4 p-4 border rounded-lg relative">
                  <div className="flex justify-between items-center">
                    <h2 className="text-xl font-semibold">Sectie {index + 1}</h2>
                    {sections.length > 1 && <Button type="button" variant="ghost" size="icon" onClick={() => removeSection(section.id)}><Trash2 className="h-5 w-5 text-destructive" /></Button>}
                  </div>
                  <Input placeholder="Subtitel..." value={section.subTitle} onChange={(e) => updateSectionField(section.id, "subTitle", e.target.value)} />
                  <ReactQuill theme="snow" value={section.content} onChange={(value) => updateSectionField(section.id, "content", value)} />

                  <div className="space-y-2">
                    {section.items.map(item => (
                      <div key={item.id} className="flex items-center gap-4 p-2 border rounded-md">
                        <Image src={item.imageUrl} alt={item.title} width={48} height={48} className="w-12 h-12 object-cover rounded-md" />
                        <div className="flex-1">
                          <p className="text-sm font-medium">{item.title}</p>
                          <p className="text-xs text-gray-600">€{typeof item.price === 'number' ? item.price.toFixed(2) : item.price}</p>
                        </div>
                        <Button type="button" variant="ghost" size="icon" onClick={() => removeItemFromSection(section.id, item.id)}><Trash2 className="h-5 w-5 text-destructive" /></Button>
                      </div>
                    ))}
                  </div>

                  <Button type="button" variant="outline" className="w-full" onClick={() => handleOpenSearchDialog(section.id)}>
                    <Plus className="mr-2 h-4 w-4" /> Product Toevoegen
                  </Button>
                </div>
              ))}

              <Button type="button" variant="outline" onClick={addSection} className="flex items-center gap-2">
                <Plus className="h-4 w-4" /> Sectie Toevoegen
              </Button>
              
              {/* CORRECTIE: 'isPending' prop verwijderd, 'pendingText' wordt gebruikt door de component zelf. */}
              <SubmitButton pendingText="Publiceren..." className="w-full" disabled={isPending}>
                Publiceer Post
              </SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* CORRECTIE: Props gecorrigeerd naar standaard React conventies */}
      <AffiliateProductSearchDialog
        isOpen={isSearchDialogOpen}
        onClose={() => setIsSearchDialogOpen(false)}
        onProductSelect={handleProductSelected}
      />
    </>
  );
}