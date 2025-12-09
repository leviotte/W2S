// src/app/dashboard/profile/_components/photo-form.tsx
'use client';

import { useState, useRef, useTransition } from 'react';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

import { updatePhotoURL } from '@/app/dashboard/profile/actions';
import { uploadFile } from '@/lib/client/storage';
import type { UserProfile } from '@/types/user';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/user-avatar';
import { SubmitButton } from '@/components/ui/submit-button';

interface PhotoFormProps {
  profile: UserProfile;
}

export default function PhotoForm({ profile }: PhotoFormProps) {
  const [isPending, startTransition] = useTransition();
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (previewUrl) URL.revokeObjectURL(previewUrl); // Ruim oude preview op
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const handleSubmit = () => {
    if (!file) {
      toast.error('Selecteer eerst een bestand.');
      return;
    }

    startTransition(async () => {
      try {
        // 1. Upload het bestand vanaf de CLIENT naar Firebase Storage
        const photoURL = await uploadFile(file, `profile-pictures/${profile.id}/${file.name}`);

        // 2. Roep de SERVER action aan met de resulterende URL
        const result = await updatePhotoURL(photoURL);

        if (result.success) {
          toast.success(result.message);
          setFile(null);
          setPreviewUrl(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          toast.error(result.message);
        }
      } catch (error) {
        toast.error('Upload mislukt. Probeer het opnieuw.');
        console.error(error);
      }
    });
  };

  return (
    // We gebruiken nu een form met een action die onze transition-wrapped handler aanroept
    <form action={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Profielfoto</CardTitle>
          <CardDescription>Een duidelijke foto helpt anderen je te herkennen.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          <UserAvatar user={profile} src={previewUrl ?? profile.photoURL} className="h-32 w-32" />
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Wijzig Foto
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            name="photo"
            accept="image/png, image/jpeg, image/webp"
            onChange={handleFileChange}
            className="hidden"
          />
          {file && <p className="text-xs text-muted-foreground">{file.name}</p>}
        </CardContent>
        <CardFooter className="flex justify-end">
          <SubmitButton isSubmitting={isPending} disabled={!file || isPending}>
            Opslaan
          </SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}