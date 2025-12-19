// src/components/chat/AutoGrowTextarea.tsx
import React, { useRef, useEffect, ChangeEvent } from "react";

interface AutoGrowTextareaProps {
  value: string;
  onChange: (e: ChangeEvent<HTMLTextAreaElement>) => void;
  placeholder?: string;
  className?: string;
  maxRows?: number;
}

export default function AutoGrowTextarea({
  value,
  onChange,
  placeholder = "",
  className = "",
  maxRows = 5,
}: AutoGrowTextareaProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = "auto";

    const lineHeight = parseInt(getComputedStyle(textarea).lineHeight);
    const paddingTop = parseInt(getComputedStyle(textarea).paddingTop);
    const paddingBottom = parseInt(getComputedStyle(textarea).paddingBottom);
    const maxHeight = lineHeight * maxRows + paddingTop + paddingBottom;

    const newHeight = Math.min(textarea.scrollHeight, maxHeight);
    textarea.style.height = `${newHeight}px`;
  }, [value, maxRows]);

  return (
    <textarea
      ref={textareaRef}
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      rows={1}
      className={`w-full resize-none overflow-y-auto !min-h-[42px]  rounded-lg px-4 py-2  border-1.5 border-black focus:border-black focus:ring-0 placeholder:text-[#000] bg-transparent h-full ${className}`}
      style={{
        minHeight: "45px",
        maxHeight: "146px",
        lineHeight: "1.5",
        scrollbarWidth: "thin",
        scrollbarColor: "#606C38 #F5F0E6",
      }}
    />
  );
}
