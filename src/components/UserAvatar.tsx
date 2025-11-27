// components/UserAvatar.tsx
"use client";

import Image from "next/image";

interface UserAvatarProps {
  photoURL?: string;
  firstName: string;
  lastName: string;
  name?: string;
  size?: "sm" | "md" | "lg";
  className?: string;
}

export default function UserAvatar({
  photoURL,
  firstName,
  lastName,
  name,
  size = "md",
  className = "",
}: UserAvatarProps) {
  const getInitials = () => {
    if (name) {
      const [firstWord, secondWord] = name.split(" ");
      const firstInitial = firstWord?.[0]?.toUpperCase() || "";
      const secondInitial = secondWord?.[0]?.toUpperCase() || "";
      return `${firstInitial}${secondInitial}`;
    }
    const firstInitial = firstName?.[0]?.toUpperCase() || "";
    const lastInitial = lastName?.[0]?.toUpperCase() || "";
    return `${firstInitial}${lastInitial}`;
  };

  const sizeClasses = {
    sm: "h-8 w-8 text-sm",
    md: "h-10 w-10 text-base",
    lg: "h-12 w-12 text-lg",
  };

  return (
    <div
      className={`flex-shrink-0 relative rounded-full overflow-hidden ${sizeClasses[size]} ${className}`}
    >
      {photoURL ? (
        <Image
          src={photoURL}
          alt={name || `${firstName} ${lastName}`}
          fill
          sizes="(max-width: 640px) 2.5rem, (max-width: 768px) 2.5rem, 3rem"
          className="object-cover"
          priority={false}
        />
      ) : (
        <div className="h-full w-full bg-warm-olive flex items-center justify-center text-white font-medium">
          {getInitials()}
        </div>
      )}
    </div>
  );
}
