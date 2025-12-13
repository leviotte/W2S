// src/app/blog/create/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useFormState } from 'react-dom';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

import { useRequireAuth } from '@/hooks/useRequireAuth';
import { createPostAction } from '@/lib/server/actions/blog';
import type { Product } from '@/types/product';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { AffiliateProductSearchDialog } from '@/components/products/affiliate-product-search-dialog';
import PageTitle from '@/components/layout/page-title';
import { SubmitButton } from '@/components/ui/submit-button';

const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });
import 'react-quill-new/dist/quill.snow.css';

export default function CreateBlogPostPage() {
  const router = useRouter();
  useRequireAuth();

  const [headImage, setHeadImage] = useState('');
  const [sections, setSections] = useState<Array<{ title: string; content: string }>>([
    { title: '', content: '' },
  ]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  // ✅ CORRECTE INITIAL STATE (matched met server action return type)
  const initialState = { 
    success: false, 
    error: '', 
    details: undefined,
    data: undefined 
  };
  
  const [formState, formAction] = useFormState(createPostAction, initialState);

  // ✅ REDIRECT BIJ SUCCESS
  useEffect(() => {
    if (formState.success && formState.data?.id) {
      toast.success('Blog post aangemaakt!');
      router.push(`/post/${formState.data.id}`);
    }
  }, [formState.success, formState.data, router]);

  // ✅ ERROR TOAST
  useEffect(() => {
    if (!formState.success && formState.error) {
      toast.error(formState.error);
    }
  }, [formState.success, formState.error]);

  const handleAddSection = () => {
    setSections([...sections, { title: '', content: '' }]);
  };

  const handleRemoveSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

  const handleSectionChange = (index: number, field: 'title' | 'content', value: string) => {
    const updated = [...sections];
    updated[index][field] = value;
    setSections(updated);
  };

  const handleProductSelected = (product: Product) => {
    if (!products.some(p => p.id === product.id)) {
      setProducts([...products, product]);
      toast.success(`${product.title} toegevoegd!`);
    } else {
      toast.info('Dit product staat al in de lijst.');
    }
    setIsSearchDialogOpen(false);
  };

  const removeProduct = (productId: string | number) => {
    setProducts(products.filter(p => p.id !== productId));
    toast.warning('Product verwijderd.');
  };

  return (
    <>
      <div className="container mx-auto max-w-4xl py-8">
        <PageTitle title="Nieuwe Blog Post Maken" description="Deel je verhaal met de community" />

        <form action={formAction} className="space-y-8 mt-8">
          <Card>
            <CardHeader><CardTitle>Hoofdgegevens</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="headTitle">Titel</Label>
                <Input 
                  id="headTitle" 
                  name="headTitle" 
                  placeholder="Bv: De beste cadeautips voor 2025" 
                  required 
                />
                {/* ✅ CORRECTE ERROR HANDLING: details in plaats van errors */}
                {formState.details?.headTitle && (
                  <p className="text-sm text-destructive mt-1">{formState.details.headTitle[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="headDescription">Korte Beschrijving</Label>
                <Textarea
                  id="headDescription"
                  name="headDescription"
                  placeholder="Vat je post samen in een paar zinnen..."
                  rows={3}
                />
                {formState.details?.headDescription && (
                  <p className="text-sm text-destructive mt-1">{formState.details.headDescription[0]}</p>
                )}
              </div>

              <div>
                <Label htmlFor="headImage">Header Afbeelding URL</Label>
                <Input
                  id="headImage"
                  name="headImage"
                  type="url"
                  placeholder="https://example.com/image.jpg"
                  value={headImage}
                  onChange={(e) => setHeadImage(e.target.value)}
                />
                {headImage && (
                  <div className="mt-2 relative w-full h-48 rounded-lg overflow-hidden">
                    <Image src={headImage} alt="Preview" fill className="object-cover" />
                  </div>
                )}
                {formState.details?.headImage && (
                  <p className="text-sm text-destructive mt-1">{formState.details.headImage[0]}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Secties</CardTitle>
              <Button type="button" onClick={handleAddSection} size="sm">
                <Plus className="h-4 w-4 mr-2" /> Sectie Toevoegen
              </Button>
            </CardHeader>
            <CardContent className="space-y-6">
              {sections.map((section, index) => (
                <div key={index} className="border rounded-lg p-4 space-y-4">
                  <div className="flex items-center justify-between">
                    <Label>Sectie {index + 1}</Label>
                    {sections.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => handleRemoveSection(index)}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor={`section-title-${index}`}>Titel</Label>
                    <Input
                      id={`section-title-${index}`}
                      value={section.title}
                      onChange={(e) => handleSectionChange(index, 'title', e.target.value)}
                      placeholder="Sectie titel..."
                    />
                  </div>

                  <div>
                    <Label htmlFor={`section-content-${index}`}>Inhoud</Label>
                    <ReactQuill
                      theme="snow"
                      value={section.content}
                      onChange={(value) => handleSectionChange(index, 'content', value)}
                      className="bg-white"
                    />
                  </div>
                </div>
              ))}
              {formState.details?.sections && (
                <p className="text-sm text-destructive">{formState.details.sections[0]}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle>Affiliate Producten</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2 rounded-md border p-4 min-h-[100px]">
                {products.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Nog geen producten toegevoegd.
                  </p>
                )}
                {products.map((product) => (
                  <div key={product.id} className="flex items-center gap-4 p-2 bg-background rounded-md">
                    <Image
                      src={product.imageUrl || '/default-avatar.png'}
                      alt={product.title}
                      width={40}
                      height={40}
                      className="w-10 h-10 object-cover rounded"
                    />
                    <div className="flex-1">
                      <p className="text-sm font-medium line-clamp-1">{product.title}</p>
                      <p className="text-xs text-muted-foreground">€{product.price}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      type="button"
                      onClick={() => removeProduct(product.id)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => setIsSearchDialogOpen(true)}
              >
                <Plus className="mr-2 h-4 w-4" /> Product Toevoegen
              </Button>
            </CardContent>
          </Card>

          {/* Hidden inputs voor server action */}
          <input type="hidden" name="sections" value={JSON.stringify(sections)} />
          <input type="hidden" name="products" value={JSON.stringify(products)} />

          <div className="flex justify-end gap-4 pt-4">
            <Button type="button" variant="ghost" onClick={() => router.back()}>
              Annuleren
            </Button>
            <SubmitButton />
          </div>
        </form>
      </div>

      <AffiliateProductSearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onProductSelect={handleProductSelected}
      />
    </>
  );
}