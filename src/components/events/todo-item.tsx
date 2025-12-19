// src/components/events/todo-item.tsx
"use client";

import { Check, X, Circle } from "lucide-react";

interface TodoItemProps {
  label: string;
  status: "inactive" | "active" | "complete";
  statusText?: string;
  progressText?: string;
}

export default function TodoItem({
  label,
  status,
  statusText,
  progressText,
}: TodoItemProps) {
  // Status-based styling
  const getStatusStyles = () => {
    switch (status) {
      case "complete":
        return {
          bgColor: "bg-warm-olive",
          textColor: "text-warm-olive",
          icon: <Check className="text-white text-sm w-4 h-4" />,
        };
      case "active":
        return {
          bgColor: "bg-warm-olive",
          textColor: "text-olive-600",
          icon: <Circle className="text-white w-4 h-4" strokeWidth={2} />,
        };
      default: // inactive
        return {
          bgColor: "bg-[#d3d3d3]",
          textColor: "text-[#b6b4b4]",
          icon: <X className="text-white text-sm w-4 h-4" />,
        };
    }
  };

  const { bgColor, textColor, icon } = getStatusStyles();

  return (
    <div className="flex items-center justify-between py-1">
      <div className="flex items-center gap-2">
        <div className={`rounded-full p-1 ${bgColor}`}>{icon}</div>
        <span className={`text-sm ${textColor}`}>
          {statusText ? statusText : label}
        </span>
      </div>
      {progressText && (
        <span className="text-xs text-gray-500 ml-2 text-right">
          {progressText}
        </span>
      )}
    </div>
  );
}