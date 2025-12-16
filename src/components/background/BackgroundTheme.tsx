// src/components/background/BackgroundTheme.tsx
"use client";

import { db } from "@/lib/client/firebase";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";

interface BackgroundThemeProps {
  className?: string;
  children: React.ReactNode;
  isWishListPage?: boolean;
}

interface BackImage {
  id: string;
  imageLink: string;
  title: string;
  isLive: boolean;
}

export default function BackgroundTheme({ className = "", children, isWishListPage = false }: BackgroundThemeProps) {
  const [image, setImage] = useState<string>("");
  const imageCollectionRef = collection(db, isWishListPage ? "WishlistBackImages" : "WebBackImages");

  useEffect(() => {
    const fetchImages = async () => {
      const q = query(imageCollectionRef, where("isLive", "==", true));
      const snapshot = await getDocs(q);
      if (!snapshot.empty) setImage((snapshot.docs[0].data() as BackImage).imageLink);
    };
    fetchImages();
  }, [isWishListPage]);

  return (
    <div
      className={`relative min-h-[100vh] ${className}`}
      style={{
        backgroundImage: `url('${image}')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
        backgroundAttachment: "fixed",
        transition: "background-position 0.3s ease-out",
      }}
    >
      <div className="relative z-10">{children}</div>
    </div>
  );
}
