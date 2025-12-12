'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { createPostAction } from '@/lib/server/actions/blog';
import { uploadBlogImage } from '@/lib/utils/upload';
import { AffiliateProductsSearch } from '@/components/affiliate/affiliate-products-search';
import type { BlogSection, BlogSectionItem } from '@/types/blog';
import type { AmazonProduct } from '@/types/affiliate';
import 'react-quill-new/dist/quill.snow.css';

// Dynamic import voor React Quill (client-only)
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => (
    <div className="h-64 bg-gray-100 animate-pulse rounded-md flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
    </div>
  ),
});

// ============================================================================
// QUILL MODULES CONFIG
// ============================================================================

const quillModules = {
  toolbar: [
    [{ header: [1, 2, 3, false] }],
    ['bold', 'italic', 'underline', 'strike'],
    [{ list: 'ordered' }, { list: 'bullet' }],
    [{ color: [] }, { background: [] }],
    ['link', 'image'],
    ['clean'],
  ],
};

const quillFormats = [
  'header',
  'bold',
  'italic',
  'underline',
  'strike',
  'list',
  'bullet',
  'color',
  'background',
  'link',
  'image',
];

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function CreatePostForm() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state
  const [headTitle, setHeadTitle] = useState('');
  const [headDescription, setHeadDescription] = useState('');
  const [headImage, setHeadImage] = useState<string>('');
  const [headImageFile, setHeadImageFile] = useState<File | null>(null);
  const [subDescription, setSubDescription] = useState('');
  const [sections, setSections] = useState<BlogSection[]>([
    { subTitle: '', content: '', items: [] },
  ]);

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  // Handle image upload
  const handleUploadImage = async () => {
    if (!headImageFile) {
      toast.error('Selecteer eerst een afbeelding');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const url = await uploadBlogImage(headImageFile, (progress) => {
        setUploadProgress(progress);
      });

      setHeadImage(url);
      toast.success('Afbeelding geüpload!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload mislukt. Probeer opnieuw.');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  // Add section
  const addSection = () => {
    setSections([...sections, { subTitle: '', content: '', items: [] }]);
    toast.success('Sectie toegevoegd');
  };

  // Remove section
  const removeSection = (index: number) => {
    if (sections.length === 1) {
      toast.error('Je moet minstens 1 sectie hebben');
      return;
    }
    setSections(sections.filter((_, i) => i !== index));
    toast.success('Sectie verwijderd');
  };

  // Update section
  const updateSection = (
    index: number,
    field: keyof BlogSection,
    value: any
  ) => {
    setSections(
      sections.map((section, i) =>
        i === index ? { ...section, [field]: value } : section
      )
    );
  };

  // Add item to section
  const addItemToSection = (sectionIndex: number, item: BlogSectionItem) => {
    setSections(
      sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, items: [...(section.items || []), item] }
          : section
      )
    );
  };

  // Remove item from section
  const removeItemFromSection = (sectionIndex: number, itemId: string) => {
    setSections(
      sections.map((section, i) =>
        i === sectionIndex
          ? {
              ...section,
              items: section.items?.filter((item) => item.id !== itemId) || [],
            }
          : section
      )
    );
  };

  // Submit form
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!headImage) {
      toast.error('Upload eerst een hoofdafbeelding');
      return;
    }

    if (!headTitle.trim()) {
      toast.error('Titel is verplicht');
      return;
    }

    if (!headDescription.trim()) {
      toast.error('Beschrijving is verplicht');
      return;
    }

    startTransition(async () => {
      const result = await createPostAction({
        headTitle: headTitle.trim(),
        headDescription: headDescription.trim(),
        headImage,
        subDescription: subDescription.trim() || undefined,
        sections: sections.filter(
          (s) => s.subTitle || s.content || (s.items && s.items.length > 0)
        ),
      });

      if (result.success) {
        toast.success('Post succesvol aangemaakt! 🎉');
      if (result.data?.id)
        router.push(`/post/${result.data.id}`);
      } else {
        toast.error(result.error);
      }
    });
  };

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="max-w-4xl mx-auto px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-xl shadow-lg p-6 sm:p-8 space-y-6"
      >
        {/* Header */}
        <div className="text-center border-b pb-6">
          <h1 className="text-3xl font-bold text-gray-900">
            Nieuwe Blog Post
          </h1>
          <p className="mt-2 text-gray-600">
            Maak een nieuwe inspirerende blog post aan
          </p>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="headTitle">
            Titel <span className="text-red-500">*</span>
          </Label>
          <Input
            id="headTitle"
            value={headTitle}
            onChange={(e) => setHeadTitle(e.target.value)}
            placeholder="Bijv: De 10 Beste Cadeaus voor Valentijn 2024"
            required
            disabled={isPending}
            className="text-lg"
          />
          <p className="text-xs text-gray-500">
            Maak het pakkend en SEO-vriendelijk
          </p>
        </div>

        {/* Head Description */}
        <div className="space-y-2">
          <Label htmlFor="headDescription">
            Hoofd Beschrijving <span className="text-red-500">*</span>
          </Label>
          <Textarea
            id="headDescription"
            value={headDescription}
            onChange={(e) => setHeadDescription(e.target.value)}
            placeholder="Een korte samenvatting die lezers enthousiast maakt..."
            rows={3}
            required
            disabled={isPending}
          />
          <p className="text-xs text-gray-500">
            Deze tekst verschijnt in zoekresultaten en sociale media
          </p>
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label htmlFor="headImage">
            Hoofd Afbeelding <span className="text-red-500">*</span>
          </Label>
          <div className="flex flex-col sm:flex-row gap-2">
            <Input
              id="headImage"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  // Valideer bestandsgrootte (max 5MB)
                  if (file.size > 5 * 1024 * 1024) {
                    toast.error('Afbeelding moet kleiner zijn dan 5MB');
                    e.target.value = '';
                    return;
                  }
                  setHeadImageFile(file);
                }
              }}
              disabled={isPending || isUploading}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleUploadImage}
              disabled={!headImageFile || isUploading || isPending}
              className="sm:w-32"
            >
              {isUploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  {uploadProgress}%
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload
                </>
              )}
            </Button>
          </div>

          {headImage && (
            <div className="mt-4 relative w-full aspect-video rounded-lg overflow-hidden border-2 border-green-500">
              <Image
                src={headImage}
                alt="Preview"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 800px"
              />
              <div className="absolute top-2 right-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-semibold">
                ✓ Geüpload
              </div>
            </div>
          )}

          {headImageFile && !headImage && (
            <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
              <p className="text-sm text-blue-800">
                📁 <strong>{headImageFile.name}</strong> geselecteerd. Klik op
                "Upload" om te uploaden.
              </p>
            </div>
          )}
        </div>

        {/* Sub Description */}
        <div className="space-y-2">
          <Label htmlFor="subDescription">
            Sub Beschrijving <span className="text-gray-400">(optioneel)</span>
          </Label>
          <Textarea
            id="subDescription"
            value={subDescription}
            onChange={(e) => setSubDescription(e.target.value)}
            placeholder="Extra context die direct onder de hoofdafbeelding verschijnt..."
            rows={2}
            disabled={isPending}
          />
        </div>

        {/* Sections */}
        <div className="space-y-6 pt-6 border-t">
          <div className="flex justify-between items-center">
            <div>
              <Label className="text-lg font-semibold">Inhoud Secties</Label>
              <p className="text-sm text-gray-600 mt-1">
                Bouw je post op met secties, tekst en producten
              </p>
            </div>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSection}
              disabled={isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Sectie
            </Button>
          </div>

          {sections.map((section, index) => (
            <SectionEditor
              key={index}
              section={section}
              index={index}
              onUpdate={(field, value) => updateSection(index, field, value)}
              onRemove={() => removeSection(index)}
              onAddItem={(item) => addItemToSection(index, item)}
              onRemoveItem={(itemId) => removeItemFromSection(index, itemId)}
              canRemove={sections.length > 1}
              disabled={isPending}
            />
          ))}
        </div>

        {/* Submit Button */}
        <div className="flex gap-3 pt-6 border-t">
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isPending}
            className="flex-1"
          >
            Annuleren
          </Button>
          <Button
            type="submit"
            className="flex-1 sm:flex-[2]"
            size="lg"
            disabled={isPending || isUploading || !headImage}
          >
            {isPending ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Bezig met publiceren...
              </>
            ) : (
              <>
                Post Publiceren
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}

// ============================================================================
// SECTION EDITOR SUB-COMPONENT
// ============================================================================

type SectionEditorProps = {
  section: BlogSection;
  index: number;
  onUpdate: (field: keyof BlogSection, value: any) => void;
  onRemove: () => void;
  onAddItem: (item: BlogSectionItem) => void;
  onRemoveItem: (itemId: string) => void;
  canRemove: boolean;
  disabled: boolean;
};

function SectionEditor({
  section,
  index,
  onUpdate,
  onRemove,
  onAddItem,
  onRemoveItem,
  canRemove,
  disabled,
}: SectionEditorProps) {
  const ReactQuill = dynamic(() => import('react-quill-new'), {
    ssr: false,
    loading: () => (
      <div className="h-48 bg-gray-100 animate-pulse rounded" />
    ),
  });

  const handleAddProduct = (product: AmazonProduct) => {
    const item: BlogSectionItem = {
      id: crypto.randomUUID(),
      title: product.Title,
      image: product.ImageURL || '',
      description: product.Features?.join(', ') || '',
      url: product.URL || '',
      price: product.Price || '',
    };
    onAddItem(item);
  };

  return (
    <div className="p-4 sm:p-6 border-2 border-gray-200 rounded-lg space-y-4 relative bg-gray-50">
      {/* Header */}
      <div className="flex justify-between items-center pb-3 border-b border-gray-300">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-accent text-white flex items-center justify-center font-bold">
            {index + 1}
          </div>
          <Label className="text-base font-semibold text-gray-900">
            Sectie {index + 1}
          </Label>
        </div>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Verwijder
          </Button>
        )}
      </div>

      {/* Sub Title */}
      <div className="space-y-2">
        <Label htmlFor={`subTitle-${index}`}>
          Subtitel <span className="text-gray-400">(optioneel)</span>
        </Label>
        <Input
          id={`subTitle-${index}`}
          value={section.subTitle || ''}
          onChange={(e) => onUpdate('subTitle', e.target.value)}
          placeholder="Bijv: Waarom dit belangrijk is..."
          disabled={disabled}
        />
      </div>

      {/* Content (Rich Text) */}
      <div className="space-y-2">
        <Label htmlFor={`content-${index}`}>Inhoud</Label>
        <div className="bg-white rounded-md">
          <ReactQuill
            theme="snow"
            value={section.content}
            onChange={(value) => onUpdate('content', value)}
            placeholder="Schrijf hier je content met opmaak..."
            modules={quillModules}
            formats={quillFormats}
          />
        </div>
        <p className="text-xs text-gray-500">
          Gebruik de toolbar voor tekst opmaak, links en afbeeldingen
        </p>
      </div>

      {/* Added Items */}
      {section.items && section.items.length > 0 && (
        <div className="space-y-2 pt-4">
          <Label className="text-sm font-semibold text-gray-700">
            Toegevoegde Producten ({section.items.length})
          </Label>
          <div className="grid gap-2">
            {section.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-200 hover:border-accent transition-colors"
              >
                {item.image && (
                  <div className="relative w-16 h-16 flex-shrink-0">
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover rounded"
                      sizes="64px"
                    />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{item.title}</p>
                  {item.price && (
                    <p className="text-sm text-accent font-semibold">
                      {item.price}
                    </p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={disabled}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50 flex-shrink-0"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affiliate Products Search */}
      <div className="pt-4 border-t border-gray-300">
        <AffiliateProductsSearch onAddProduct={handleAddProduct} />
      </div>
    </div>
  );
}