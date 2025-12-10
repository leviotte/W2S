"use client";

import React, { useState, useTransition, useEffect } from "react";
import dynamic from "next/dynamic";
import Image from 'next/image';
import { Plus, Trash2 } from "lucide-react";
import { useRouter, useParams } from "next/navigation";
import { toast } from "sonner";
import { doc, getDoc } from "firebase/firestore";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { app, db } from "@/lib/client/firebase";

import { type Product } from "@/types/product";
import { updatePostAction } from "@/lib/actions/blog-actions";
import { AffiliateProductSearchDialog } from "@/components/products/affiliate-product-search-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { LoadingSpinner } from "@/components/ui/LoadingSpinner";

const ReactQuill = dynamic(() => import("react-quill-new"), { 
  ssr: false, 
  loading: () => <div className="w-full h-32 bg-gray-100 rounded-md animate-pulse" />
});
import "react-quill-new/dist/quill.snow.css";

interface Section {
  id: string;
  subTitle: string;
  content: string;
  items: Product[];
}

export default function UpdatePostPage() {
  const router = useRouter();
  const params = useParams();
  const postId = params.id as string;
  
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  // Form state
  const [headTitle, setHeadTitle] = useState("");
  const [headDescription, setHeadDescription] = useState("");
  const [headImageFile, setHeadImageFile] = useState<File | null>(null);
  const [headImageUrl, setHeadImageUrl] = useState<string>(""); // Houdt zowel preview als bestaande URL bij
  const [subDescription, setSubDescription] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  
  // Dialog state
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // Data laden
  useEffect(() => {
    if (!postId) return;
    const loadPost = async () => {
      setIsLoading(true);
      try {
        const postRef = doc(db, 'posts', postId);
        const docSnap = await getDoc(postRef);
        if (docSnap.exists()) {
          const data = docSnap.data();
          setHeadTitle(data.headTitle || "");
          setHeadDescription(data.headDescription || "");
          setHeadImageUrl(data.headImage || "");
          setSubDescription(data.subDescription || "");
          // Voeg een uniek ID toe aan elke sectie als die ontbreekt
          setSections(data.sections?.map((s: Omit<Section, 'id'>) => ({ ...s, id: crypto.randomUUID() })) || []);
        } else {
          toast.error("Post niet gevonden.");
          router.push('/blog');
        }
      } catch (error) {
        console.error(error);
        toast.error("Kon de post niet laden.");
      } finally {
        setIsLoading(false);
      }
    };
    loadPost();
  }, [postId, router]);


  // --- Alle handlers zijn nu identiek aan CreatePostPage ---

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeadImageFile(file);
      setHeadImageUrl(URL.createObjectURL(file));
    }
  };

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

  const handleOpenSearchDialog = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setIsSearchDialogOpen(true);
  };
  
  const handleProductSelected = (product: Product) => {
    if (!activeSectionId) return;
    setSections(prev => prev.map(s => {
      if (s.id === activeSectionId && !s.items.some(item => item.id === product.id)) {
        return { ...s, items: [...s.items, product] };
      }
      if (s.id === activeSectionId) toast.info("Product al in sectie.");
      return s;
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!headTitle.trim()) return toast.error("Titel is verplicht.");

    startTransition(async () => {
      let finalImageUrl = headImageUrl;
      // Alleen een nieuwe afbeelding uploaden als er een is geselecteerd
      if (headImageFile) {
        finalImageUrl = await new Promise<string>((resolve, reject) => {
            const storage = getStorage(app);
            const fileName = `public/posts/${Date.now()}-${headImageFile.name}`;
            const storageRef = ref(storage, fileName);
            const uploadTask = uploadBytesResumable(storageRef, headImageFile);
            uploadTask.on(
                "state_changed",
                () => {}, // progress
                (error) => {
                    console.error("Upload error:", error);
                    toast.error("Afbeelding uploaden mislukt.");
                    reject(error);
                },
                async () => {
                    const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
                    resolve(downloadURL);
                }
            );
        });
      }

      if (!finalImageUrl) {
        toast.error("De afbeelding kon niet worden verwerkt. Probeer het opnieuw.");
        return;
      }
      
      const result = await updatePostAction({
          id: postId,
          headTitle,
          headDescription,
          headImage: finalImageUrl,
          subDescription,
          sections,
      });

      if (result.success) {
          toast.success("Post succesvol bijgewerkt!");
          router.push(`/blog/${postId}`);
          router.refresh();
      } else {
          toast.error(result.error || "Er is iets misgegaan.");
      }
    });
  };

  if (isLoading) {
    return <div className="flex h-screen items-center justify-center"><LoadingSpinner size="lg" /></div>;
  }

  return (
    <>
      <div className="container mx-auto max-w-4xl py-12">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-center mb-8">Blogbericht Bewerken</h1>
            <form onSubmit={handleSubmit} className="space-y-8">
               {/* De form content is nu identiek aan CreatePostPage */}
              <div className="space-y-4">
                <Input placeholder="Titel van je blog..." value={headTitle} onChange={(e) => setHeadTitle(e.target.value)} required className="text-lg"/>
                <Textarea placeholder="Korte inleiding..." value={headDescription} onChange={(e) => setHeadDescription(e.target.value)} />
                
                <div>
                  <label className="block text-sm font-medium text-gray-600 mb-2">Hoofdafbeelding</label>
                  <Input type="file" accept="image/*" onChange={handleImageSelect} />
                  {headImageUrl && <div className="mt-4"><Image src={headImageUrl} alt="Huidige of nieuwe afbeelding" width={800} height={400} className="rounded-md object-cover w-full"/></div>}
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
                        <Image src={item.imageUrl} alt={item.title} width={48} height={48} className="w-12 h-12 object-cover rounded-md"/>
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
              
              <SubmitButton pendingText="Opslaan..." className="w-full">
    Wijzigingen Opslaan
</SubmitButton>
            </form>
          </CardContent>
        </Card>
      </div>

      <AffiliateProductSearchDialog
        isOpen={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onProductSelected={handleProductSelected}
      />
    </>
  );
}