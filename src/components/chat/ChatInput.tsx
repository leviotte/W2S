/**
 * components/chat/ChatInput.tsx
 * 
 * FINALE VERSIE: Nu met de correcte 'onGifSelect' prop voor de GifPicker.
 */
"use client";

import React, { useState, useRef } from 'react';
import { Send, Smile, Image as ImageIcon } from 'lucide-react';
import EmojiPicker, { EmojiClickData } from 'emoji-picker-react';
import { IGif } from '@giphy/js-types';

import { useClickOutside } from '@/hooks/useClickOutside';
import AutoGrowTextarea from '@/components/chat/AutoGrowTextarea';
import GifPicker from '@/components/chat/GifPicker';

interface ChatInputProps {
  onSendMessage: (
    text: string,
    isAnonymous: boolean,
    gifUrl?: string
  ) => Promise<void>;
}

export default function ChatInput({ onSendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [showGifPicker, setShowGifPicker] = useState(false);

  const emojiButtonRef = useRef<HTMLButtonElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const gifButtonRef = useRef<HTMLButtonElement>(null);
  const gifPickerRef = useRef<HTMLDivElement>(null);

  useClickOutside([emojiButtonRef, emojiPickerRef], () => {
    setShowEmojiPicker(false);
  });

  useClickOutside([gifButtonRef, gifPickerRef], () => {
    setShowGifPicker(false);
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      const formattedMessage = message.charAt(0).toUpperCase() + message.slice(1);
      await onSendMessage(formattedMessage, isAnonymous);
      setMessage('');
    } catch (error) {
      console.error('Bericht versturen mislukt:', error);
    }
  };

  const handleEmojiClick = (emojiData: EmojiClickData) => {
    setMessage((prev) => prev + emojiData.emoji);
    setShowEmojiPicker(false);
  };

  const handleGifSelect = async (gif: IGif) => {
    try {
      const gifUrl = gif.images.fixed_height.url;
      await onSendMessage('', isAnonymous, gifUrl);
      setShowGifPicker(false); // GifPicker sluit nu zichzelf, maar dit is extra veilig.
    } catch (error) {
      console.error('GIF verzenden mislukt:', error);
    }
  };

  return (
    <div className="p-4 rounded-b-[10px] border-t-[1.5px] border-black">
      <div className="flex items-center justify-between mb-4 pb-2 border-b-[1.5px] border-black">
        <label className="relative inline-flex items-center cursor-pointer">
          <input
            type="checkbox"
            className="sr-only peer focus:ring-0 focus:outline-none"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
          />
          <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-warm-olive/20 rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-warm-olive"></div>
          <span className="ms-3 text-sm font-medium">Stuur Anoniem</span>
        </label>

        <div className="flex items-center space-x-2">
          <div className="relative">
            <button
              type="button"
              ref={gifButtonRef}
              onClick={() => {
                setShowGifPicker(!showGifPicker);
                setShowEmojiPicker(false);
              }}
              className="p-1.5 hover:bg-warm-olive/50 hover:text-gray-600 border border-warm-olive/30 rounded-lg transition-colors"
            >
              <ImageIcon className="h-5 w-5" />
            </button>

            {showGifPicker && (
              <div ref={gifPickerRef} className="absolute bottom-full right-0 mb-2 z-50">
                {/* DE FIX: 'onSelect' is nu 'onGifSelect' */}
                <GifPicker
                  onGifSelect={handleGifSelect}
                  onClose={() => setShowGifPicker(false)}
                />
              </div>
            )}
          </div>

          <div className="relative">
            <button
              type="button"
              ref={emojiButtonRef}
              onClick={() => {
                setShowEmojiPicker(!showEmojiPicker);
                setShowGifPicker(false);
              }}
              className="p-1.5 hover:bg-warm-olive/50 hover:text-gray-600 border border-warm-olive/30 rounded-lg transition-colors"
            >
              <Smile className="h-5 w-5" />
            </button>

            {showEmojiPicker && (
              <div ref={emojiPickerRef} className="absolute bottom-full right-0 mb-2 z-50">
                <EmojiPicker
                  onEmojiClick={handleEmojiClick}
                  autoFocusSearch={false}
                  width={300}
                  height={400}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="flex items-center gap-2">
        <div className="relative flex-grow">
          <AutoGrowTextarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Schrijf een bericht..."
          />
        </div>
        <button
          type="submit"
          className="bg-warm-olive text-white p-2 rounded-lg hover:bg-cool-olive transition-colors disabled:bg-gray-400"
          disabled={!message.trim()}
        >
          <Send className="h-6 w-6" />
        </button>
      </form>
    </div>
  );
}