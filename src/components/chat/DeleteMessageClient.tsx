// src/components/chat/DeleteMessageClient.tsx
"use client";

import React, { useState } from "react";
import { Trash2, X } from "lucide-react";

interface DeleteMessageProps {
  onDelete: () => Promise<void>;
  onCancel: () => void;
}

export default function DeleteMessageClient({ onDelete, onCancel }: DeleteMessageProps) {
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    setLoading(true);
    try {
      await onDelete();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-700">Weet je zeker dat je dit bericht wilt verwijderen?</span>
      <button
        onClick={handleDelete}
        disabled={loading}
        className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
      >
        <Trash2 className="w-5 h-5" />
      </button>
      <button
        onClick={onCancel}
        disabled={loading}
        className="p-2 bg-gray-400 text-white rounded-lg hover:bg-gray-500 transition-colors"
      >
        <X className="w-5 h-5" />
      </button>
    </div>
  );
}
