"use client";

import { LucideIcon } from "lucide-react";

interface InviteMethodCardProps {
  icon: LucideIcon | "whatsapp";
  title: string;
  onClick: () => void;
  disabled?: boolean;
}

export default function InviteMethodCard({
  icon: Icon,
  title,
  onClick,
  disabled,
}: InviteMethodCardProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`flex flex-col items-center justify-center p-6 rounded-lg border-2 border-gray-200 hover:border-warm-olive hover:bg-warm-olive/5 transition-colors w-full ${
        disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer"
      }`}
    >
      {Icon === "whatsapp" ? (
        <img
          src="https://upload.wikimedia.org/wikipedia/commons/6/6b/WhatsApp.svg"
          alt="WhatsApp"
          className="h-8 w-8 mb-3"
        />
      ) : (
        <Icon className="h-8 w-8 mb-3 text-gray-600" />
      )}
      <span className="text-sm font-medium text-gray-700">{title}</span>
    </button>
  );
}
