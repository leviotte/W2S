// src/components/profile/PhotoSection.tsx
"use client";

import { useState, useRef } from "react";
import { Upload, User } from "lucide-react";

interface PhotoSectionProps {
  photoURL?: string;
  onChange: (base64: string, file: File) => void;
}

export function PhotoSection({ photoURL, onChange }: PhotoSectionProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | undefined>(photoURL);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      alert("Selecteer een geldige afbeelding (JPG of PNG)");
      return;
    }

    // Validate file size (max 1MB)
    if (file.size > 1024 * 1024) {
      alert("Bestand is te groot. Maximum 1MB.");
      return;
    }

    // Convert to base64 for preview
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = reader.result as string;
      setPreview(base64);
      onChange(base64, file);
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="mt-4">
      <label className="block font-medium mb-2">Profiel Foto</label>
      <p className="text-sm text-gray-500 mb-2">JPG of PNG. Max 1MB.</p>
      
      <div className="flex items-center gap-4">
        {/* Preview */}
        <div className="w-24 h-24 rounded-full border-2 border-gray-300 flex items-center justify-center overflow-hidden bg-gray-100">
          {preview ? (
            <img
              src={preview}
              alt="Profile preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <User className="w-12 h-12 text-gray-400" />
          )}
        </div>

        {/* Upload Button */}
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          className="px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-md flex items-center gap-2 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Kies Foto
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png"
          onChange={handleFileChange}
          className="hidden"
        />
      </div>
    </div>
  );
}