// src/components/chat/EditMessageClient.tsx
"use client";

import React, { useState } from "react";
import { Check, X } from "lucide-react";

interface EditMessageProps {
  initialText: string;
  onSave: (newText: string) => Promise<void>;
  onCancel: () => void;
}

export default function EditMessageClient({ initialText, onSave, onCancel }: EditMessageProps) {
  const [text, setText] = useState(initialText);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!text.trim()) return;
    setLoading(true);
    try {
      await onSave(text.trim());
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="flex-grow p-2 border rounded-lg"
        autoFocus
      />
      <button
        onClick={handleSave}
        disabled={loading}
        className="p-2 bg-warm-olive text-white rounded-lg hover:bg-cool-olive transition-colors"
      >
        <Check className="w-5 h-5" />
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
