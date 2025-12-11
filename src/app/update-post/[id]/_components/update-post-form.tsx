'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import dynamic from 'next/dynamic';
import { Plus, Trash2, Upload, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { updateBlogPost } from '@/lib/server/actions/blog';
import { uploadBlogImage } from '@/lib/utils/upload';
import { AffiliateProductsSearch } from '@/components/affiliate/affiliate-products-search';
import type { BlogPost, BlogSection, BlogSectionItem } from '@/types/blog';
import type { AmazonProduct } from '@/types/affiliate';
import 'react-quill-new/dist/quill.snow.css';

const ReactQuill = dynamic(() => import('react-quill-new'), { 
  ssr: false,
  loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded" />,
});

// ============================================================================
// TYPES
// ============================================================================

type Props = {
  post: BlogPost;
};

// ============================================================================
// COMPONENT
// ============================================================================

export function UpdatePostForm({ post }: Props) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  // Form state (initialize with existing data)
  const [headTitle, setHeadTitle] = useState(post.headTitle);
  const [headDescription, setHeadDescription] = useState(post.headDescription);
  const [headImage, setHeadImage] = useState<string>(post.headImage);
  const [headImageFile, setHeadImageFile] = useState<File | null>(null);
  const [subDescription, setSubDescription] = useState(post.subDescription || '');
  const [sections, setSections] = useState<BlogSection[]>(
    post.sections || [{ subTitle: '', content: '', items: [] }]
  );

  // Upload state
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // ============================================================================
  // HANDLERS
  // ============================================================================

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
      toast.success('Afbeelding geüpload');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload mislukt');
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const addSection = () => {
    setSections([...sections, { subTitle: '', content: '', items: [] }]);
  };

  const removeSection = (index: number) => {
    setSections(sections.filter((_, i) => i !== index));
  };

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

  const addItemToSection = (sectionIndex: number, item: BlogSectionItem) => {
    setSections(
      sections.map((section, i) =>
        i === sectionIndex
          ? { ...section, items: [...(section.items || []), item] }
          : section
      )
    );
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!headImage) {
      toast.error('Hoofdafbeelding is verplicht');
      return;
    }

    if (!headTitle.trim() || !headDescription.trim()) {
      toast.error('Titel en beschrijving zijn verplicht');
      return;
    }

    startTransition(async () => {
      const result = await updateBlogPost(post.id, {
        headTitle,
        headDescription,
        headImage,
        subDescription,
        sections: sections.filter(
          (s) => s.subTitle || s.content || (s.items && s.items.length > 0)
        ),
      });

      if (result.success) {
        toast.success('Post bijgewerkt!');
        router.push(`/post/${post.id}`);
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
      <form onSubmit={handleSubmit} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">
            Post Bewerken
          </h1>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.push(`/post/${post.id}`)}
            disabled={isPending}
          >
            Annuleren
          </Button>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="headTitle">Titel *</Label>
          <Input
            id="headTitle"
            value={headTitle}
            onChange={(e) => setHeadTitle(e.target.value)}
            placeholder="Enter een pakkende titel..."
            required
            disabled={isPending}
          />
        </div>

        {/* Head Description */}
        <div className="space-y-2">
          <Label htmlFor="headDescription">Hoofd Beschrijving *</Label>
          <Textarea
            id="headDescription"
            value={headDescription}
            onChange={(e) => setHeadDescription(e.target.value)}
            placeholder="Korte samenvatting van de post..."
            rows={3}
            required
            disabled={isPending}
          />
        </div>

        {/* Image Upload */}
        <div className="space-y-2">
          <Label htmlFor="headImage">Hoofd Afbeelding *</Label>
          <div className="flex gap-2">
            <Input
              id="headImage"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) setHeadImageFile(file);
              }}
              disabled={isPending || isUploading}
              className="flex-1"
            />
            <Button
              type="button"
              onClick={handleUploadImage}
              disabled={!headImageFile || isUploading || isPending}
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
            <div className="mt-4 relative w-full aspect-video rounded-lg overflow-hidden">
              <img
                src={headImage}
                alt="Preview"
                className="w-full h-full object-cover"
              />
            </div>
          )}
        </div>

        {/* Sub Description */}
        <div className="space-y-2">
          <Label htmlFor="subDescription">Sub Beschrijving</Label>
          <Textarea
            id="subDescription"
            value={subDescription}
            onChange={(e) => setSubDescription(e.target.value)}
            placeholder="Extra context onder de hoofdafbeelding..."
            rows={2}
            disabled={isPending}
          />
        </div>

        {/* Sections */}
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <Label className="text-lg">Secties</Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addSection}
              disabled={isPending}
            >
              <Plus className="h-4 w-4 mr-2" />
              Sectie Toevoegen
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
        <Button
          type="submit"
          className="w-full"
          size="lg"
          disabled={isPending || isUploading}
        >
          {isPending ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Post Updaten...
            </>
          ) : (
            'Wijzigingen Opslaan'
          )}
        </Button>
      </form>
    </div>
  );
}

// ============================================================================
// SECTION EDITOR (same as create post)
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
  const ReactQuill = dynamic(() => import('react-quill-new'), { ssr: false });

  const handleAddProduct = (product: AmazonProduct) => {
    const item: BlogSectionItem = {
      id: crypto.randomUUID(),
      title: product.Title,
      image: product.ImageURL || '',
      description: product.Features.join(', '),
      url: product.URL || '',
      price: product.Price || '',
    };
    onAddItem(item);
  };

  return (
    <div className="p-6 border border-gray-200 rounded-lg space-y-4 relative">
      {/* Header */}
      <div className="flex justify-between items-center">
        <Label className="text-base font-semibold">Sectie {index + 1}</Label>
        {canRemove && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onRemove}
            disabled={disabled}
            className="text-red-500 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        )}
      </div>

      {/* Sub Title */}
      <div className="space-y-2">
        <Label>Subtitel</Label>
        <Input
          value={section.subTitle || ''}
          onChange={(e) => onUpdate('subTitle', e.target.value)}
          placeholder="Optionele subtitel..."
          disabled={disabled}
        />
      </div>

      {/* Content (Rich Text) */}
      <div className="space-y-2">
        <Label>Inhoud</Label>
        <ReactQuill
          theme="snow"
          value={section.content}
          onChange={(value) => onUpdate('content', value)}
          placeholder="Schrijf hier je content..."
        />
      </div>

      {/* Added Items */}
      {section.items && section.items.length > 0 && (
        <div className="space-y-2">
          <Label>Toegevoegde Producten</Label>
          <div className="grid gap-2">
            {section.items.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-4 p-3 bg-gray-50 rounded-lg"
              >
                {item.image && (
                  <img
                    src={item.image}
                    alt={item.title}
                    className="w-16 h-16 object-cover rounded"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{item.title}</p>
                  {item.price && (
                    <p className="text-sm text-gray-600">{item.price}</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveItem(item.id)}
                  disabled={disabled}
                  className="text-red-500"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Affiliate Products Search */}
      <AffiliateProductsSearch onAddProduct={handleAddProduct} />
    </div>
  );
}