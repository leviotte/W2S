'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import Image from 'next/image';
import { Trash2, Plus, GripVertical, X } from 'lucide-react';
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { updatePostAction } from '@/lib/server/actions/blog';
import type { Product } from '@/types/product';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { AffiliateProductSearchDialog } from '@/components/products/affiliate-product-search-dialog';

interface UpdatePostFormProps {
  post: any;
}

interface Section {
  id: string;
  subTitle: string;
  content: string;
  items: Product[];
}

export function UpdatePostForm({ post }: UpdatePostFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const [headTitle, setHeadTitle] = useState(post.headTitle || '');
  const [headDescription, setHeadDescription] = useState(post.headDescription || '');
  const [headImage, setHeadImage] = useState(post.headImage || '');
  const [subDescription, setSubDescription] = useState(post.subDescription || '');
  const [published, setPublished] = useState(post.published || false);
  const [featured, setFeatured] = useState(post.featured || false);
  const [sections, setSections] = useState<Section[]>(post.sections || []);

  const [activeSection, setActiveSection] = useState<string | null>(null);
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState(false);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleAddSection = () => {
    const newSection: Section = {
      id: crypto.randomUUID(),
      subTitle: '',
      content: '',
      items: [],
    };
    setSections([...sections, newSection]);
  };

  const handleRemoveSection = (sectionId: string) => {
    setSections(sections.filter((s) => s.id !== sectionId));
  };

  const handleUpdateSection = (sectionId: string, field: keyof Section, value: any) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId ? { ...s, [field]: value } : s
      )
    );
  };

  const handleAddProductToSection = (sectionId: string) => {
    setActiveSection(sectionId);
    setIsSearchDialogOpen(true);
  };

  const handleProductSelect = (product: Product) => {
    if (activeSection) {
      setSections(
        sections.map((s) =>
          s.id === activeSection
            ? { ...s, items: [...s.items, product] }
            : s
        )
      );
    }
    setActiveSection(null);
  };

  const handleRemoveProduct = (sectionId: string, productId: string | number) => {
    setSections(
      sections.map((s) =>
        s.id === sectionId
          ? { ...s, items: s.items.filter((p) => p.id !== productId) }
          : s
      )
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setSections((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!headTitle.trim()) {
      toast.error('Titel is verplicht');
      return;
    }

    if (!headImage.trim()) {
      toast.error('Hoofdafbeelding is verplicht');
      return;
    }

    startTransition(async () => {
      const result = await updatePostAction({
        id: post.id,
        headTitle,
        headDescription,
        headImage,
        subDescription,
        sections,
        published,
        featured,
      });

      if (result.success) {
        toast.success('Post succesvol bijgewerkt!');
        router.push(`/blog/${post.id}`);
        router.refresh();
      } else {
        toast.error(result.error || 'Er is een fout opgetreden');
      }
    });
  };

  return (
    <>
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Head Title */}
        <div className="space-y-2">
          <Label htmlFor="headTitle">Hoofdtitel *</Label>
          <Input
            id="headTitle"
            value={headTitle}
            onChange={(e) => setHeadTitle(e.target.value)}
            placeholder="Geef je post een titel..."
            required
          />
        </div>

        {/* Head Description */}
        <div className="space-y-2">
          <Label htmlFor="headDescription">Hoofdbeschrijving</Label>
          <Textarea
            id="headDescription"
            value={headDescription}
            onChange={(e) => setHeadDescription(e.target.value)}
            placeholder="Een korte beschrijving..."
            rows={3}
          />
        </div>

        {/* Head Image */}
        <div className="space-y-2">
          <Label htmlFor="headImage">Hoofdafbeelding URL *</Label>
          <Input
            id="headImage"
            type="url"
            value={headImage}
            onChange={(e) => setHeadImage(e.target.value)}
            placeholder="https://example.com/image.jpg"
            required
          />
          {headImage && (
            <div className="relative w-full h-64 mt-2">
              <Image
                src={headImage}
                alt="Preview"
                fill
                className="object-cover rounded-md"
              />
            </div>
          )}
        </div>

        {/* Sub Description */}
        <div className="space-y-2">
          <Label htmlFor="subDescription">Sub-beschrijving</Label>
          <Textarea
            id="subDescription"
            value={subDescription}
            onChange={(e) => setSubDescription(e.target.value)}
            placeholder="Aanvullende informatie..."
            rows={4}
          />
        </div>

        {/* Published & Featured */}
        <div className="flex gap-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="published"
              checked={published}
              onCheckedChange={setPublished}
            />
            <Label htmlFor="published">Gepubliceerd</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="featured"
              checked={featured}
              onCheckedChange={setFeatured}
            />
            <Label htmlFor="featured">Uitgelicht</Label>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Secties</Label>
            <Button type="button" onClick={handleAddSection} variant="outline" size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Sectie toevoegen
            </Button>
          </div>

          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={sections.map((s) => s.id)} strategy={verticalListSortingStrategy}>
              {sections.map((section) => (
                <SortableSection
                  key={section.id}
                  section={section}
                  onUpdate={handleUpdateSection}
                  onRemove={handleRemoveSection}
                  onAddProduct={handleAddProductToSection}
                  onRemoveProduct={handleRemoveProduct}
                />
              ))}
            </SortableContext>
          </DndContext>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <Button type="submit" disabled={isPending}>
            {isPending ? 'Opslaan...' : 'Post bijwerken'}
          </Button>
          <Button type="button" variant="outline" onClick={() => router.back()}>
            Annuleren
          </Button>
        </div>
      </form>

      <AffiliateProductSearchDialog
        open={isSearchDialogOpen}
        onOpenChange={setIsSearchDialogOpen}
        onProductSelect={handleProductSelect}
      />
    </>
  );
}

// Sortable Section Component
interface SortableSectionProps {
  section: Section;
  onUpdate: (id: string, field: keyof Section, value: any) => void;
  onRemove: (id: string) => void;
  onAddProduct: (id: string) => void;
  onRemoveProduct: (sectionId: string, productId: string | number) => void;
}

function SortableSection({
  section,
  onUpdate,
  onRemove,
  onAddProduct,
  onRemoveProduct,
}: SortableSectionProps) {
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({
    id: section.id,
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <Card ref={setNodeRef} style={style}>
      <CardContent className="p-4 space-y-4">
        <div className="flex items-start gap-2">
          <button
            type="button"
            className="mt-2 cursor-grab active:cursor-grabbing"
            {...attributes}
            {...listeners}
          >
            <GripVertical className="h-5 w-5 text-muted-foreground" />
          </button>
          <div className="flex-1 space-y-4">
            <Input
              placeholder="Sectietitel..."
              value={section.subTitle}
              onChange={(e) => onUpdate(section.id, 'subTitle', e.target.value)}
            />
            <Textarea
              placeholder="Sectie content..."
              value={section.content}
              onChange={(e) => onUpdate(section.id, 'content', e.target.value)}
              rows={4}
            />

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label className="text-sm">Producten ({section.items.length})</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => onAddProduct(section.id)}
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Product toevoegen
                </Button>
              </div>

              {section.items.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {section.items.map((product) => (
                    <div key={product.id} className="relative group">
                      <div className="relative aspect-square">
                        <Image
                          src={product.imageUrl}
                          alt={product.title}
                          fill
                          className="object-cover rounded-md"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => onRemoveProduct(section.id, product.id)}
                        className="absolute top-1 right-1 p-1 bg-destructive text-destructive-foreground rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="h-4 w-4" />
                      </button>
                      <p className="text-xs mt-1 line-clamp-2">{product.title}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => onRemove(section.id)}
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}