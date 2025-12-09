// src/app/dashboard/profile/_components/photo-form.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { useFormState } from 'react-dom';
import { toast } from 'sonner';
import { Upload } from 'lucide-react';

import { updatePhotoAction } from '@/app/dashboard/profile/actions';
import type { UserProfile } from '@/types/user';

import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/shared/user-avatar';
import { SubmitButton } from '@/components/ui/submit-button';

interface PhotoFormProps {
  profile: UserProfile;
}

export default function PhotoForm({ profile }: PhotoFormProps) {
  const [state, formAction] = useFormState(updatePhotoAction, { success: false, message: '' });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Effect voor toast-notificaties
  useEffect(() => {
    if (state.message) {
      state.success ? toast.success('Succes', { description: state.message }) : toast.error('Fout', { description: state.message });
      // Als de upload succesvol was, verwijder de preview zodat de nieuwe prop-waarde wordt getoond
      if (state.success) {
        setPreviewUrl(null); 
        if(fileInputRef.current) fileInputRef.current.value = ''; // Reset de file input
      }
    }
  }, [state]);

  // Effect om de object URL op te schonen
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (previewUrl) URL.revokeObjectURL(previewUrl); // Ruim de vorige preview op
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profielfoto</CardTitle>
        <CardDescription>Een duidelijke foto helpt anderen je te herkennen. Max 4MB.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent>
          <div className="flex items-center gap-6">
            <UserAvatar 
              src={previewUrl ?? profile.photoURL} 
              name={profile.firstName} 
              size="lg" 
              className="h-24 w-24"
            />
            <div className="grid gap-2">
                <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                    <Upload className="mr-2 h-4 w-4" /> Wijzig Foto
                </Button>
                <input
                    ref={fileInputRef}
                    type="file"
                    name="photo" // BELANGRIJK: de naam moet matchen met de server action
                    accept="image/png, image/jpeg, image/webp"
                    onChange={handleFileChange}
                    className="hidden"
                />
                 <p className="text-xs text-muted-foreground">
                    {fileInputRef.current?.files?.[0]?.name ?? 'Geen bestand geselecteerd.'}
                </p>
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <SubmitButton disabled={!previewUrl}>Foto Opslaan</SubmitButton>
        </CardFooter>
      </form>
    </Card>
  );
}