// src/components/blog/BackButton.tsx
"use client";

import { useRouter } from "next/navigation";

export default function BackButton() {
  const router = useRouter();

  return (
    <button
      onClick={() => router.push("/blog")}
      className="text-blue-400 hover:text-blue-700 text-lg font-semibold"
    >
      ← Terug naar de blog
    </button>
  );
}
