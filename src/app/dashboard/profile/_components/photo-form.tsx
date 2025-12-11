'use client';

import { useState, useRef, useTransition, FormEvent } from 'react';
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
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  // FIX 1: We gebruiken onSubmit en e.preventDefault() voor client-side logica
  const handleSubmit = (e: FormEvent) => {
    e.preventDefault(); 
    if (!file) {
      toast.error('Selecteer eerst een bestand.');
      return;
    }

    startTransition(async () => {
      try {
        const photoURL = await uploadFile(file, `profile-pictures/${profile.id}/${file.name}`);
        const result = await updatePhotoURL(photoURL);

        // FIX 2: Correcte afhandeling van het Server Action resultaat
        if (result.success) {
          // De server action geeft geen 'message', dus tonen we een eigen bericht.
          toast.success("Profielfoto succesvol bijgewerkt!"); 
          setFile(null);
          setPreviewUrl(null);
          if (fileInputRef.current) fileInputRef.current.value = '';
        } else {
          // Het error object bevat de 'error' property, niet 'message'.
          toast.error(result.error); 
        }
      } catch (error) {
        toast.error('Upload mislukt. Probeer het opnieuw.');
        console.error(error);
      }
    });
  };

  return (
    // We gebruiken nu onSubmit omdat onze handler client-side logica bevat
    <form onSubmit={handleSubmit}>
      <Card>
        <CardHeader>
          <CardTitle>Profielfoto</CardTitle>
          <CardDescription>Een duidelijke foto helpt anderen je te herkennen.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
          {/* FIX 3: Correcte props doorgeven aan UserAvatar */}
          <UserAvatar 
            src={previewUrl ?? profile.photoURL} 
            name={profile.displayName}
            className="h-32 w-32" 
          />
          {/* FIX 4: Correcte JSX syntax voor event handlers */}
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
          {/* We gebruiken een gewone SubmitButton. De form's onSubmit vangt dit af. */}
          <SubmitButton pending={isPending} pendingText="Uploaden..." disabled={!file}>
            Upload Foto
          </SubmitButton>
        </CardFooter>
      </Card>
    </form>
  );
}