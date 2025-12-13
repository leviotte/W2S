// src/app/update-post/[id]/_components/update-post-form.tsx
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
import { updatePostAction } from "@/lib/server/actions/blog";
import { AffiliateProductSearchDialog } from "@/components/products/affiliate-product-search-dialog";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { SubmitButton } from "@/components/ui/submit-button";
import { LoadingSpinner } from "@/components/ui/loading-spinner";

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
  const [headImageUrl, setHeadImageUrl] = useState<string>("");
  const [subDescription, setSubDescription] = useState("");
  const [sections, setSections] = useState<Section[]>([]);
  
  // Dialog state
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);

  // ✅ Data laden
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
          setSections(data.sections?.map((s: Omit<Section, 'id'>) => ({ 
            ...s, 
            id: crypto.randomUUID() 
          })) || []);
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

  // ✅ Image handler
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setHeadImageFile(file);
      setHeadImageUrl(URL.createObjectURL(file));
    }
  };

  // ✅ Section handlers
  const addSection = () => {
    setSections([...sections, { 
      id: crypto.randomUUID(), 
      subTitle: "", 
      content: "", 
      items: [] 
    }]);
  };

  const removeSection = (id: string) => {
    setSections(sections.filter((section) => section.id !== id));
  };

  const updateSectionField = (id: string, field: 'subTitle' | 'content', value: string) => {
    setSections(prev => prev.map(s => s.id === id ? { ...s, [field]: value } : s));
  };
  
  const removeItemFromSection = (sectionId: string, itemId: string | number) => {
    setSections(prev => prev.map(s => 
      s.id === sectionId 
        ? { ...s, items: s.items.filter(item => item.id !== itemId) } 
        : s
    ));
  };

  // ✅ Product dialog handlers
  const handleOpenSearchDialog = (sectionId: string) => {
    setActiveSectionId(sectionId);
    setIsSearchDialogOpen(true);
  };
  
  const handleProductSelect = (product: Product) => {
    if (!activeSectionId) return;
    setSections(prev => prev.map(s => {
      if (s.id === activeSectionId && !s.items.some(item => item.id === product.id)) {
        toast.success(`${product.title} toegevoegd!`);
        return { ...s, items: [...s.items, product] };
      }
      if (s.id === activeSectionId) {
        toast.info("Product al in sectie.");
      }
      return s;
    }));
    setIsSearchDialogOpen(false);
  };

  // ✅ CORRECT: Submit handler met 1 parameter (id zit IN het object)
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!headTitle.trim()) {
      return toast.error("Titel is verplicht.");
    }

    startTransition(async () => {
      let finalImageUrl = headImageUrl;
      
      // Upload nieuwe afbeelding als geselecteerd
      if (headImageFile) {
        try {
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
        } catch (error) {
          toast.error("Afbeelding kon niet worden geüpload.");
          return;
        }
      }

      if (!finalImageUrl) {
        toast.error("De afbeelding kon niet worden verwerkt.");
        return;
      }
      
      // ✅ CORRECT: 1 parameter met id erin
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
    return (
      <div className="flex h-screen items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <>
      <div className="container mx-auto max-w-4xl py-12">
        <Card>
          <CardContent className="p-8">
            <h1 className="text-3xl font-bold text-center mb-8">
              Blogbericht Bewerken
            </h1>
            
            <form onSubmit={handleSubmit} className="space-y-8">
              {/* Hoofdgegevens */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Titel *
                  </label>
                  <Input 
                    placeholder="Titel van je blog..." 
                    value={headTitle} 
                    onChange={(e) => setHeadTitle(e.target.value)} 
                    required 
                    className="text-lg"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Korte Beschrijving
                  </label>
                  <Textarea 
                    placeholder="Korte inleiding..." 
                    value={headDescription} 
                    onChange={(e) => setHeadDescription(e.target.value)}
                    rows={3}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium mb-2">
                    Hoofdafbeelding
                  </label>
                  <Input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleImageSelect}
                  />
                  {headImageUrl && (
                    <div className="mt-4 relative w-full h-64 rounded-lg overflow-hidden">
                      <Image 
                        src={headImageUrl} 
                        alt="Hoofdafbeelding" 
                        fill
                        className="object-cover"
                      />
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    Extra Beschrijving
                  </label>
                  <Textarea 
                    placeholder="Extra beschrijving onder de afbeelding..." 
                    value={subDescription} 
                    onChange={(e) => setSubDescription(e.target.value)}
                    rows={3}
                  />
                </div>
              </div>

              {/* Secties */}
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Secties</h2>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={addSection}
                    size="sm"
                  >
                    <Plus className="h-4 w-4 mr-2" /> 
                    Sectie Toevoegen
                  </Button>
                </div>

                {sections.map((section, index) => (
                  <div 
                    key={section.id} 
                    className="space-y-4 p-6 border rounded-lg bg-card"
                  >
                    <div className="flex justify-between items-center">
                      <h3 className="text-lg font-semibold">
                        Sectie {index + 1}
                      </h3>
                      {sections.length > 1 && (
                        <Button 
                          type="button" 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => removeSection(section.id)}
                        >
                          <Trash2 className="h-5 w-5 text-destructive" />
                        </Button>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Subtitel
                      </label>
                      <Input 
                        placeholder="Sectie subtitel..." 
                        value={section.subTitle} 
                        onChange={(e) => updateSectionField(section.id, "subTitle", e.target.value)}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        Inhoud
                      </label>
                      <ReactQuill 
                        theme="snow" 
                        value={section.content} 
                        onChange={(value) => updateSectionField(section.id, "content", value)}
                        className="bg-white"
                      />
                    </div>
                    
                    {/* Producten in sectie */}
                    <div className="space-y-2">
                      <label className="block text-sm font-medium">
                        Producten ({section.items.length})
                      </label>
                      
                      {section.items.map(item => (
                        <div 
                          key={item.id} 
                          className="flex items-center gap-4 p-3 border rounded-md bg-background"
                        >
                          <Image 
                            src={item.imageUrl} 
                            alt={item.title} 
                            width={48} 
                            height={48} 
                            className="w-12 h-12 object-cover rounded-md"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">
                              {item.title}
                            </p>
                            <p className="text-xs text-muted-foreground">
                              €{typeof item.price === 'number' ? item.price.toFixed(2) : item.price}
                            </p>
                          </div>
                          <Button 
                            type="button" 
                            variant="ghost" 
                            size="icon" 
                            onClick={() => removeItemFromSection(section.id, item.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      ))}

                      <Button 
                        type="button" 
                        variant="outline" 
                        className="w-full" 
                        onClick={() => handleOpenSearchDialog(section.id)}
                      >
                        <Plus className="mr-2 h-4 w-4" /> 
                        Product Toevoegen
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Submit */}
              <div className="flex justify-end gap-4 pt-4">
                <Button 
                  type="button" 
                  variant="ghost" 
                  onClick={() => router.back()}
                >
                  Annuleren
                </Button>
                <SubmitButton 
                  pendingText="Opslaan..." 
                  disabled={isPending}
                >
                  Wijzigingen Opslaan
                </SubmitButton>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>

      {/* ✅ CORRECT: Radix UI prop naming */}
      <AffiliateProductSearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onProductSelect={handleProductSelect}
      />
    </>
  );
}