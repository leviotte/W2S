"use client";

import { useRef } from "react";
import { User, Upload } from "lucide-react";
import { toast } from "react-toastify";
import { compressImage } from "@/utils/imageCompression";

interface PhotoSectionProps {
  photoURL?: string;
  onPhotoChange: (photoURL: string, file: File) => void;
}

export default function PhotoSection({ photoURL, onPhotoChange }: PhotoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      const compressedFile = await compressImage(file);

      const reader = new FileReader();
      reader.onloadend = () => {
        onPhotoChange(reader.result as string, compressedFile);
      };
      reader.readAsDataURL(compressedFile);
    } catch (error) {
      console.error("Photo upload failed:", error);
      toast.error("Foto opladen niet gelukt");
    }
  };

  return (
    <div className="bg-slate-100 shadow-xl rounded-lg p-4">
      <div className="flex items-center space-x-6">
        <div className="relative">
          <div className="h-24 w-24 rounded-full overflow-hidden bg-gray-100">
            {photoURL ? (
              <img
                src={photoURL}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : (
              <User className="h-full w-full p-4 text-gray-400" />
            )}
          </div>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="absolute bottom-0 right-0 bg-white rounded-full p-1 shadow-lg hover:bg-gray-50"
          >
            <Upload className="h-5 w-5 text-gray-600" />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handlePhotoUpload}
            className="hidden"
          />
        </div>
        <div>
          <h3 className="text-lg font-medium text-accent">Profiel Foto</h3>
          <p className="text-sm text-gray-400">JPG of PNG. Max 1MB.</p>
        </div>
      </div>
    </div>
  );
}
