// src/components/chat/GifPicker.tsx
"use client";

import React, { useState } from 'react';
import { Grid } from '@giphy/react-components';
import { GiphyFetch } from '@giphy/js-fetch-api';
import { IGif } from '@giphy/js-types';
import { Search, X } from 'lucide-react';

// BELANGRIJKE VERBETERING: Haal de API key veilig uit environment variables.
// Deze wordt alleen naar de client gestuurd omdat hij 'NEXT_PUBLIC_' als prefix heeft.
const giphyApiKey = process.env.NEXT_PUBLIC_GIPHY_API_KEY;

let gf: GiphyFetch | null = null;
if (giphyApiKey) {
  gf = new GiphyFetch(giphyApiKey);
}

interface GifPickerProps {
  onGifSelect: (gif: IGif) => void;
  onClose: () => void;
}

export default function GifPicker({ onGifSelect, onClose }: GifPickerProps) {
  const [searchTerm, setSearchTerm] = useState('');

  // Als de GiphyFetch instance niet geïnitialiseerd kon worden (geen API key), toon een fout.
  if (!gf) {
    return (
      <div className="bg-white rounded-lg shadow-lg w-[320px] h-[400px] flex flex-col items-center justify-center p-4">
        <p className="text-red-600 text-center">
          Giphy API Key is niet geconfigureerd. Voeg NEXT_PUBLIC_GIPHY_API_KEY toe aan je .env.local bestand.
        </p>
      </div>
    );
  }

  const fetchGifs = (offset: number) => {
    // gf kan hier niet null zijn door de check hierboven.
    if (searchTerm) {
      return gf!.search(searchTerm, { offset, limit: 10 });
    }
    return gf!.trending({ offset, limit: 10 });
  };

  return (
    <div className="bg-white rounded-lg shadow-lg w-[320px] max-h-[400px] flex flex-col">
      <div className="p-3 border-b border-gray-200">
        <div className="flex items-center space-x-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={searchTerm}
              // CORRECTIE: 'onChange' prop toegevoegd
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Zoek GIFs..."
              className="w-full pl-8 pr-3 py-1.5 rounded-md border border-gray-300 focus:border-warm-olive focus:ring-0"
            />
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          </div>
          <button
            // CORRECTIE: 'onClick' prop toegevoegd
            onClick={onClose}
            className="p-1 text-gray-400 hover:text-gray-600"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-2">
        <Grid
          width={300}
          columns={2}
          fetchGifs={fetchGifs}
          // CORRECTIE: De correcte prop heet 'onGifClick'
          onGifClick={(gif) => {
            onGifSelect(gif);
            onClose(); // Sluit de picker na selectie
          }}
          noLink
          hideAttribution
        />
      </div>
    </div>
  );
}