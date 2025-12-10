'use client';

import { useRef } from 'react';
import { Upload } from 'lucide-react';
import { toast } from 'sonner';
import { UserAvatar } from '@/components/shared/user-avatar';
import { Button } from '@/components/ui/button';
import { compressImage } from '@/lib/utils/imageCompression'; 

interface PhotoSectionProps {
  photoURL?: string | null; // Null is ook een geldige waarde
  displayName: string; // We hebben een naam nodig voor de fallback
  onChange: (base64: string, file: File) => void;
}

export default function PhotoSection({ photoURL, displayName, onChange }: PhotoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedFile = await compressImage(file, {
        maxSizeMB: 1,
        maxWidthOrHeight: 1024,
      });
      const reader = new FileReader();
      // Correcte syntax voor de onload event handler
      reader.onload = () => {
        onChange(reader.result as string, compressedFile);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error('Photo upload failed:', error);
      toast.error('Foto opladen mislukt. Probeer een ander bestand.');
    }
  };

  return (
    // Consistente styling met 'card'
    <div className="bg-card shadow-lg rounded-lg p-6 border">
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <UserAvatar 
          src={photoURL} 
          name={displayName} // Gebruik de displayName voor de fallback initialen
          className="h-24 w-24 text-2xl" //sizing via className, plus tekstgrootte voor initialen
        />
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-medium text-card-foreground">Profiel Foto</h3>
          <p className="text-sm text-muted-foreground mb-3">JPG of PNG. Max 1MB.</p>
          {/* Correcte onClick handler */}
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Wijzig Foto
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png, image/jpeg"
            onChange={handlePhotoUpload} // Correcte onChange handler
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}