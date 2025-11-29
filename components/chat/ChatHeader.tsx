import React from 'react';

interface ChatHeaderProps {
  title: string;
}

export default function ChatHeader({ title }: ChatHeaderProps) {
  return (
    <div className="bg-warm-olive px-4 py-3 flex items-center space-x-3 rounded-t-lg">
      <h2 className="text-white font-semibold">{title}</h2>
    </div>
  );
}
