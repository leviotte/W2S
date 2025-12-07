// src/components/profile/PhotoSection.tsx
"use client";

import { useRef } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { UserAvatar } from "@/components/shared/user-avatar";
import { Button } from "@/components/ui/button";
import { compressImage } from "@/lib/utils/imageCompression"; // We behouden deze nuttige functie!

interface PhotoSectionProps {
  photoURL?: string;
  onChange: (base64: string, file: File) => void;
}

export default function PhotoSection({ photoURL, onChange }: PhotoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedFile = await compressImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        onChange(reader.result as string, compressedFile);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Photo upload failed:", error);
      toast.error("Foto opladen mislukt. Probeer een ander bestand.");
    }
  };

  return (
    <div className="bg-slate-100 shadow-xl rounded-lg p-6">
      <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-6">
        <UserAvatar 
          src={photoURL} 
          name=" " 
          size="lg" 
          className="h-24 w-24"
        />
        <div className="text-center sm:text-left">
          <h3 className="text-lg font-medium text-accent">Profiel Foto</h3>
          <p className="text-sm text-gray-500 mb-2">JPG of PNG. Max 1MB.</p>
          <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
            <Upload className="mr-2 h-4 w-4" /> Wijzig Foto
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
}